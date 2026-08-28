import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import routes from './routes/index.js';
import { openapiSpec } from './config/openapi.js';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

app.get('/', (_req, res) => {
  res.json({ name: 'Kazi⚡ API', version: '0.1.0', docs: '/api-docs' });
});
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openapiSpec));
app.use('/api', routes);

app.use((_req, res) => res.status(404).json({ success: false, message: 'Route not found' }));
app.use((error, _req, res, _next) => {
  const statusCode = error.statusCode || 500;
  if (statusCode >= 500) console.error(error);
  const message = error.statusCode ? error.message : 'Internal server error';
  const code = error.code || (error.statusCode ? 'ERROR' : 'INTERNAL');
  res.status(statusCode).json({ error: { message, code } });
});

export default app;

