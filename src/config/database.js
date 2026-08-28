import mongoose from 'mongoose';
import { env, getMongoUri } from './env.js';

export async function connectDatabase() {
  const uri = getMongoUri();
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  console.log(`MongoDB connected (${env.nodeEnv})`);
}

export async function disconnectDatabase() {
  await mongoose.disconnect();
}

