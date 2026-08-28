import mongoose from 'mongoose';

const walletSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    balanceSats: { type: Number, required: true, default: 0 },
    totalEarnedSats: { type: Number, required: true, default: 0 }
  },
  { timestamps: true }
);

export const Wallet = mongoose.model('Wallet', walletSchema);
