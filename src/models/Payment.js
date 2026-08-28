import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true, unique: true },
    submissionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Submission', required: true },
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    youthId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    rewardSats: { type: Number, required: true, min: 0 },
    platformFeeSats: { type: Number, required: true, default: 0 },
    netPayoutSats: { type: Number, required: true, default: 0 },
    status: { type: String, enum: ['pending', 'confirmed', 'failed'], default: 'pending' },
    lightningInvoice: { type: String, default: '' }
  },
  { timestamps: true }
);

export const Payment = mongoose.model('Payment', paymentSchema);
