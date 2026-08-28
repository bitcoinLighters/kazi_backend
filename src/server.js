import app from './app.js';
import { connectDatabase } from './config/database.js';
import { env } from './config/env.js';

try {
  await connectDatabase();
  app.listen(env.port, () => console.log(`Kazi API listening on http://localhost:${env.port}`));
} catch (error) {
  console.error('Startup failed:', error.message);
  process.exit(1);
}

