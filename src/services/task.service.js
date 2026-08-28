import mongoose from 'mongoose';
import { Task } from '../models/Task.js';
import { Submission } from '../models/Submission.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';

export async function createTask(clientId, data) {
  return Task.create({
    clientId,
    title: data.title,
    category: data.category,
    description: data.description,
    rewardSats: data.rewardSats,
    deadline: data.deadline,
    requiredSkills: data.requiredSkills || []
  });
}

export async function listTasks({ category, status = 'open' } = {}) {
  const query = {};
  if (category) query.category = category;
  if (status !== 'all') query.status = status;
  return Task.find(query).sort({ createdAt: -1 });
}

export async function listRecommendedTasks(youthId, { category, status = 'open' } = {}) {
  const youth = await User.findById(youthId);
  if (!youth) throw ApiError.notFound('User not found');
  const skills = youth.skills || [];

  const query = {};
  if (category) query.category = category;
  if (status !== 'all') query.status = status;
  query.requiredSkills = { $in: skills.length ? skills : [new RegExp('.*')] };

  const recommended = await Task.find(query).sort({ createdAt: -1 });

  const anyQuery = { ...query };
  delete anyQuery.requiredSkills;
  anyQuery.requiredSkills = { $size: 0 };
  const anyTasks = await Task.find(anyQuery).sort({ createdAt: -1 });

  const seen = new Set(recommended.map((t) => t._id.toString()));
  const merged = [...recommended];
  for (const t of anyTasks) {
    if (!seen.has(t._id.toString())) merged.push(t);
  }
  return merged;
}

export async function getTaskForUser(taskId, user) {
  const task = await Task.findById(taskId);
  if (!task) throw ApiError.notFound('Task not found');
  const isClient = user.role === 'client' && task.clientId.toString() === user._id.toString();
  if (user.role !== 'youth' && !isClient) {
    throw ApiError.forbidden('You are not allowed to view this task');
  }
  return task;
}

export async function acceptTask(taskId, youthId) {
  if (!mongoose.isValidObjectId(taskId)) throw ApiError.badRequest('Invalid task id');

  const task = await Task.findOneAndUpdate(
    { _id: taskId, status: 'open', assignedYouthId: null },
    { status: 'in_progress', assignedYouthId: youthId },
    { new: true }
  );
  if (!task) {
    const existing = await Task.findById(taskId);
    if (!existing) throw ApiError.notFound('Task not found');
    throw ApiError.conflict('Task is no longer available to accept', 'ALREADY_ACCEPTED');
  }
  return task;
}

export async function submitWork(taskId, youthId, { text, fileUrl }) {
  if (!mongoose.isValidObjectId(taskId)) throw ApiError.badRequest('Invalid task id');
  if (!text && !fileUrl) throw ApiError.badRequest('submission needs text or fileUrl');

  const task = await Task.findById(taskId);
  if (!task) throw ApiError.notFound('Task not found');
  if (task.status !== 'in_progress') {
    throw ApiError.conflict('Task is not in a submittable state', 'INVALID_STATE');
  }
  if (task.assignedYouthId?.toString() !== youthId.toString()) {
    throw ApiError.forbidden('Only the assigned youth can submit work');
  }

  const submission = await Submission.create({ taskId, youthId, text, fileUrl });
  task.status = 'reviewing';
  await task.save();
  return submission;
}

export async function getSubmissionForUser(submissionId, user) {
  if (!mongoose.isValidObjectId(submissionId)) throw ApiError.badRequest('Invalid submission id');
  const submission = await Submission.findById(submissionId).populate('taskId', 'title clientId status');
  if (!submission) throw ApiError.notFound('Submission not found');

  const isClientOwner =
    submission.taskId?.clientId && submission.taskId.clientId.toString() === user._id.toString();
  const isYouth = submission.youthId.toString() === user._id.toString();

  if (!isClientOwner && !isYouth) {
    throw ApiError.forbidden('You are not allowed to view this submission');
  }
  return submission;
}

export async function requestChanges(submissionId, clientId) {
  if (!mongoose.isValidObjectId(submissionId)) throw ApiError.badRequest('Invalid submission id');
  const submission = await Submission.findById(submissionId).populate('taskId');
  if (!submission) throw ApiError.notFound('Submission not found');
  if (!submission.taskId || submission.taskId.clientId.toString() !== clientId.toString()) {
    throw ApiError.forbidden('Only the task owner can review this submission');
  }
  if (submission.taskId.status !== 'reviewing') {
    throw ApiError.conflict('Task is not in reviewing state', 'INVALID_STATE');
  }

  submission.status = 'changes_requested';
  await submission.save();
  submission.taskId.status = 'in_progress';
  await submission.taskId.save();
  return { submission, task: submission.taskId };
}

export async function listClientTasks(clientId) {
  return Task.find({ clientId }).sort({ createdAt: -1 });
}

export async function listYouthTasks(youthId) {
  return Task.find({ assignedYouthId: youthId }).sort({ createdAt: -1 });
}

export async function listVisibleSubmissions(user) {
  let query;
  if (user.role === 'client') {
    const clientTasks = await Task.find({ clientId: user._id }).select('_id');
    const taskIds = clientTasks.map((t) => t._id);
    query = { taskId: { $in: taskIds } };
  } else {
    query = { youthId: user._id };
  }
  return Submission.find(query)
    .populate('taskId', 'title category status rewardSats')
    .sort({ createdAt: -1 });
}
