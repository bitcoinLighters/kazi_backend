import mongoose from 'mongoose';
import { env, getMongoUri, getFallbackMongoUri } from './env.js';

async function connectWith(uri, label) {
  console.log(`MongoDB connecting (${env.nodeEnv}) via ${label}...`);
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  console.log(`MongoDB connected (${env.nodeEnv})`);
}

export async function connectDatabase() {
  const primary = getMongoUri();
  const fallback = getFallbackMongoUri();

  try {
    await connectWith(primary, 'primary URI');
  } catch (primaryError) {
    if (!fallback || fallback === primary) {
      throw primaryError;
    }
    console.error('Primary MongoDB URI failed, trying fallback:', primaryError.message);
    await connectWith(fallback, 'fallback URI');
  }
}

export async function disconnectDatabase() {
  await mongoose.disconnect();
}
