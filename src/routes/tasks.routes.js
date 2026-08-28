import { Router } from 'express';
import { authenticate, allowRoles } from '../middleware/auth.js';
import { lnbitsPaymentService, LNbitsError } from '../services/lnbits.service.js';
import { newId, now, store, userWallet } from '../store/memory.store.js';
import { HttpError, asyncHandler, idParam, required } from '../utils/http.js';

const router = Router();
router.use(authenticate);

router.get('/', (req, res) => {
  const { status = 'open', category } = req.query;
  const tasks = [...store.tasks.values()].filter((task) => (status === 'all' || task.status === status) && (!category || task.category === category));
  res.json({ success: true, data: { tasks } });
});

router.post('/', allowRoles('client'), (req, res) => {
  required(req.body, ['title', 'category', 'description', 'rewardSats', 'deadline']);
  const rewardSats = Number(req.body.rewardSats);
  if (!Number.isInteger(rewardSats) || rewardSats <= 0) throw new HttpError(400, 'rewardSats must be a positive integer');
  const task = { id: newId(), clientId: req.user.id, title: req.body.title.trim(), category: req.body.category.trim(), description: req.body.description.trim(), rewardSats, deadline: req.body.deadline, status: 'open', youthId: null, createdAt: now(), updatedAt: now() };
  store.tasks.set(task.id, task);
  res.status(201).json({ success: true, data: { task } });
});

router.get('/client/mine', allowRoles('client'), (req, res) => res.json({ success: true, data: { tasks: [...store.tasks.values()].filter((task) => task.clientId === req.user.id) } }));
router.get('/youth/mine', allowRoles('youth'), (req, res) => res.json({ success: true, data: { tasks: [...store.tasks.values()].filter((task) => task.youthId === req.user.id) } }));

router.get('/:id', (req, res) => {
  const task = store.tasks.get(idParam(req));
  if (!task) throw new HttpError(404, 'Task not found');
  res.json({ success: true, data: { task } });
});

router.post('/:id/accept', allowRoles('youth'), (req, res) => {
  const task = store.tasks.get(idParam(req));
  if (!task) throw new HttpError(404, 'Task not found');
  if (task.status !== 'open') throw new HttpError(409, 'Task is no longer available');
  task.status = 'in_progress'; task.youthId = req.user.id; task.updatedAt = now();
  res.json({ success: true, data: { task } });
});

router.post('/:id/approve-payment', allowRoles('client'), async (req, res, next) => {
  try {
    const task = store.tasks.get(idParam(req));
    if (!task || task.clientId !== req.user.id) throw new HttpError(404, 'Task not found');
    if (task.status === 'paid') {
      const existing = [...store.payments.values()].find((payment) => payment.taskId === task.id && payment.status === 'PAID');
      return res.json({ success: true, message: 'Task has already been paid', data: { payment: existing, task } });
    }
    if (task.status !== 'reviewing') throw new HttpError(409, 'Task must be reviewing before payment');
    const submission = [...store.submissions.values()].find((item) => item.taskId === task.id && item.status === 'reviewing');
    if (!task.youthId || !submission) throw new HttpError(409, 'A reviewing worker submission is required');
    if (!submission.invoice) throw new HttpError(409, 'Worker invoice is missing');
    const payment = [...store.payments.values()].find((item) => item.taskId === task.id) || {
      id: newId(), taskId: task.id, workerId: task.youthId, invoice: submission.invoice, paymentHash: null, amountSats: task.rewardSats, status: 'PENDING', createdAt: now()
    };
    if (payment.status === 'PAID') return res.json({ success: true, message: 'Payment already completed', data: { payment, task } });
    if (store.paymentLocks.has(task.id)) throw new HttpError(409, 'Payment is already processing');
    payment.invoice = submission.invoice; payment.amountSats = task.rewardSats; payment.status = 'PROCESSING'; payment.error = null; store.payments.set(payment.id, payment); store.paymentLocks.add(task.id);
    try {
      const decoded = await lnbitsPaymentService.decodeInvoice(payment.invoice);
      if (decoded.amountSats && decoded.amountSats !== task.rewardSats) throw new HttpError(400, 'Worker invoice amount does not match the task reward');
      const paid = await lnbitsPaymentService.payInvoice(payment.invoice);
      payment.paymentHash = paid.paymentHash || decoded.paymentHash;
      const confirmed = payment.paymentHash ? await lnbitsPaymentService.checkPayment(payment.paymentHash) : { paid: true };
      if (!confirmed.paid) throw new LNbitsError('Payment is still pending confirmation', { statusCode: 502, code: 'PAYMENT_PENDING' });
      payment.status = 'PAID'; payment.paidAt = now(); payment.feeSats = paid.feeSats || 0;
      task.status = 'paid'; task.updatedAt = now(); submission.status = 'approved'; submission.updatedAt = now();
      store.ledger.push({ id: newId(), userId: task.youthId, taskId: task.id, paymentId: payment.id, type: 'earning', amountSats: payment.amountSats, createdAt: payment.paidAt });
      return res.json({ success: true, message: 'Payment successful', data: { payment, task, workerWallet: userWallet(task.youthId) } });
    } catch (error) {
      payment.status = 'FAILED'; payment.error = error.code || 'PAYMENT_FAILED'; payment.failedAt = now(); task.status = 'reviewing'; task.updatedAt = now();
      if (error instanceof HttpError) throw error;
      throw new HttpError(error.statusCode || 502, error.code === 'LNBITS_INSUFFICIENT_FUNDS' ? 'Insufficient LNbits balance' : 'Payment failed. The task has not been marked as paid. Please try again.');
    } finally { store.paymentLocks.delete(task.id); }
  } catch (error) { next(error); }
});

export default router;
