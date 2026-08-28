import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema(
  {
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    rewardSats: { type: Number, required: true, min: 1 },
    deadline: { type: Date, required: true },
    requiredSkills: { type: [String], default: [] },
    status: {
      type: String,
      enum: ['open', 'in_progress', 'reviewing', 'changes_requested', 'paid'],
      default: 'open'
    },
    assignedYouthId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
  },
  { timestamps: true }
);

taskSchema.index({ status: 1 });
taskSchema.index({ clientId: 1 });

export const Task = mongoose.model('Task', taskSchema);
