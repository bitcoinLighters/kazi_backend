import mongoose from 'mongoose';
import { Task } from '../models/Task.js';
import { Submission } from '../models/Submission.js';
import { Payment } from '../models/Payment.js';
import { Wallet } from '../models/Wallet.js';
import { lnbitsPaymentService } from './lnbits.service.js';
import { createWorkerInvoice } from './worker-wallet.service.js';
import { ApiError } from '../utils/ApiError.js';

const PLATFORM_FEE_SATS = 0;

async function getWalletFor(youthId) {
  let wallet = await Wallet.findOne({ userId: youthId });
  if (!wallet) wallet = await Wallet.create({ userId: youthId });
  return wallet;
}

async function approveSubmissionInternal(submissionId, clientId, { initiate = true } = {}) {
  if (!mongoose.isValidObjectId(submissionId)) throw ApiError.badRequest('Invalid submission id');
  const submission = await Submission.findById(submissionId).populate('taskId');
  if (!submission || !submission.taskId) throw ApiError.notFound('Submission not found');
  const task = submission.taskId;
  if (task.clientId.toString() !== clientId.toString()) {
    throw ApiError.forbidden('Only the task owner can approve this submission');
  }

  let payment = await Payment.findOne({ taskId: task._id });
  if (payment && payment.status === 'confirmed') {
    return { payment, task, alreadyConfirmed: true };
  }

  if (task.status !== 'reviewing') {
    throw ApiError.conflict('Task is not in reviewing state', 'INVALID_STATE');
  }

  if (!payment) {
    payment = await Payment.create({
      taskId: task._id,
      submissionId: submission._id,
      clientId: task.clientId,
      youthId: task.assignedYouthId,
      rewardSats: task.rewardSats,
      platformFeeSats: PLATFORM_FEE_SATS,
      netPayoutSats: task.rewardSats - PLATFORM_FEE_SATS
    });
  }

  if (payment.status === 'pending' && !initiate) {
    throw ApiError.conflict('Payment already pending', 'PAYMENT_PENDING');
  }

  let workerInvoice = submission.lightningInvoice;
  if (!workerInvoice) {
    const generated = await createWorkerInvoice(task.rewardSats, `Kazi payout: ${task.title}`);
    workerInvoice = generated.invoice;
    submission.lightningInvoice = workerInvoice;
    await submission.save();
  }

  // The worker owns this invoice. The employer only approves; Kazi pays it.
  payment.lightningInvoice = workerInvoice;
  payment.status = 'pending';
  await payment.save();

  const paymentResult = await lnbitsPaymentService.payInvoice(workerInvoice);
  payment.paymentHash = paymentResult.paymentHash || payment.paymentHash;
  await payment.save();
  const confirmation = payment.paymentHash
    ? await lnbitsPaymentService.checkPayment(payment.paymentHash)
    : { paid: true };

  if (confirmation.paid) {
    payment.status = 'confirmed';
    await payment.save();

    const wallet = await getWalletFor(task.assignedYouthId);
    wallet.balanceSats += payment.netPayoutSats;
    wallet.totalEarnedSats += payment.netPayoutSats;
    await wallet.save();

    task.status = 'paid';
    await task.save();

    payment = await Payment.findById(payment._id);
    return { payment, task, wallet, alreadyConfirmed: false, settled: true };
  }

  payment.status = 'failed';
  await payment.save();
  return { payment, task, settled: false };
}

export async function approveSubmission(submissionId, clientId) {
  return approveSubmissionInternal(submissionId, clientId, { initiate: true });
}

export async function getPaymentForUser(paymentId, user) {
  if (!mongoose.isValidObjectId(paymentId)) throw ApiError.badRequest('Invalid payment id');
  const payment = await Payment.findById(paymentId);
  if (!payment) throw ApiError.notFound('Payment not found');
  const involved =
    payment.clientId.toString() === user._id.toString() || payment.youthId.toString() === user._id.toString();
  if (!involved) throw ApiError.forbidden('You are not allowed to view this payment');
  return payment;
}

export async function listEarnings(userId) {
  const payments = await Payment.find({ youthId: userId, status: 'confirmed' })
    .populate('taskId', 'title')
    .sort({ createdAt: -1 });
  return payments;
}

export async function getWallet(userId) {
  return getWalletFor(userId);
}
