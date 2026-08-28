import app from './app.js';
import { connectDatabase } from './config/database.js';
import { env } from './config/env.js';

try {
  if (env.connectDatabase) await connectDatabase();
  else console.log('Database connection disabled; using temporary in-memory store');
  app.listen(env.port, () => console.log(`Kazi API listening on http://localhost:${env.port}`));
} catch (error) {
  console.error('Startup failed:', error.message);
  process.exit(1);
}
