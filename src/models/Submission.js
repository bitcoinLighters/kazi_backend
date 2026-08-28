import mongoose from 'mongoose';

const submissionSchema = new mongoose.Schema(
  {
    taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true },
    youthId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, trim: true, default: '' },
    fileUrl: { type: String, trim: true, default: '' },
    status: {
      type: String,
      enum: ['submitted', 'changes_requested', 'approved'],
      default: 'submitted'
    }
  },
  { timestamps: true }
);

submissionSchema.index({ taskId: 1 });
submissionSchema.index({ youthId: 1 });

export const Submission = mongoose.model('Submission', submissionSchema);
