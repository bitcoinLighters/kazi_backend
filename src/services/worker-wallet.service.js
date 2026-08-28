import fs from 'node:fs';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

function macaroon() {
  if (env.workerLndMacaroon) return env.workerLndMacaroon;
  if (env.workerLndMacaroonPath) return fs.readFileSync(env.workerLndMacaroonPath).toString('hex');
  return '';
}

export async function createWorkerInvoice(amountSats, memo) {
  if (!env.workerLndRestUrl || !macaroon()) throw ApiError.badRequest('Worker wallet is not configured', 'WORKER_WALLET_NOT_CONFIGURED');
  const oldTlsSetting = process.env.NODE_TLS_REJECT_UNAUTHORIZED;
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  try {
    const response = await fetch(`${env.workerLndRestUrl}/v1/invoices`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Grpc-Metadata-macaroon': macaroon() },
      body: JSON.stringify({ value: amountSats, memo, expiry: 3600 })
    });
    const data = await response.json();
    if (!response.ok || !data.payment_request) throw ApiError.badRequest('Worker wallet could not generate an invoice', 'WORKER_WALLET_ERROR');
    return { invoice: data.payment_request, paymentHash: data.r_hash ? Buffer.from(data.r_hash, 'base64').toString('hex') : '' };
  } finally {
    if (oldTlsSetting === undefined) delete process.env.NODE_TLS_REJECT_UNAUTHORIZED;
    else process.env.NODE_TLS_REJECT_UNAUTHORIZED = oldTlsSetting;
  }
}
