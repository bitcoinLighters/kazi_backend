import dotenv from 'dotenv';

dotenv.config();
// Atlas onboarding exports this filename. It is ignored by git and used only
// when .env has not already supplied the MongoDB settings.
if (!process.env.MONGODB_URI && !process.env.MONGO_URI_NOT_SRV) {
  dotenv.config({ path: 'atlas-credentials.env' });
}

const required = (name) => {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
};

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 5000),
  mongoUri: process.env.MONGODB_URI || process.env.MONGO_URI_NOT_SRV,
  jwtSecret: process.env.JWT_SECRET || 'development-only-secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  lndRestUrl: process.env.LND_REST_URL || 'http://127.0.0.1:8080',
  lndMacaroon: process.env.LND_MACAROON || '',
  lndTlsCertPath: process.env.LND_TLS_CERT_PATH || '',
  connectDatabase: process.env.CONNECT_DATABASE === 'true',
  lnbitsUrl: (process.env.LNBITS_URL || '').replace(/\/$/, ''),
  lnbitsAdminKey: process.env.LNBITS_ADMIN_KEY || '',
  lnbitsInvoiceKey: process.env.LNBITS_INVOICE_KEY || '',
  lnbitsTimeoutMs: Number(process.env.LNBITS_TIMEOUT_MS || 15000)
};

export const getMongoUri = () => env.mongoUri || required('MONGODB_URI');
