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
  mongoUri: process.env.MONGODB_URI || '',
  mongoUriNotSrv: process.env.MONGO_URI_NOT_SRV || '',
  mongoDbName: process.env.MONGODB_DB_NAME || 'kazi',
  jwtSecret: process.env.JWT_SECRET || 'development-only-secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  lndRestUrl: process.env.LND_REST_URL || 'http://127.0.0.1:8080',
  lndMacaroon: process.env.LND_MACAROON || '',
  lndTlsCertPath: process.env.LND_TLS_CERT_PATH || '',
  connectDatabase: process.env.CONNECT_DATABASE !== 'false'
};

const stripQuotes = (value = '') => value.replace(/^"|"$/g, '').trim();

const withDbName = (uri) => {
  if (!uri) return uri;
  try {
    const normalized = stripQuotes(uri);
    const hashIndex = normalized.indexOf('#');
    const fragment = hashIndex >= 0 ? normalized.slice(hashIndex) : '';
    const noFragment = fragment ? normalized.slice(0, hashIndex) : normalized;
    if (!noFragment) return normalized;
    const pathMatch = noFragment.match(/^(\w+:\/\/[^/?#]+)(\/[^?#]*)?([?].*)?$/);
    if (!pathMatch) return normalized;
    const [, base, existingPath, query = ''] = pathMatch;
    const dbPath = existingPath && existingPath.length > 1 ? existingPath : `/${env.mongoDbName}`;
    return `${base}${dbPath}${query}${fragment}`;
  } catch {
    return uri;
  }
};

export const getMongoUri = () => {
  const primary = withDbName(env.mongoUri);
  const fallback = withDbName(env.mongoUriNotSrv);
  return primary || fallback || required('MONGODB_URI');
};

export const getFallbackMongoUri = () => withDbName(env.mongoUriNotSrv);
