import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

const MOCK_DELAY_MS = 1500;
const POLL_INTERVAL_MS = 2000;
const MAX_POLL_ATTEMPTS = 5;

function createMockPaymentService() {
  return {
    name: 'mock',
    createInvoice(amountSats) {
      return Promise.resolve({ invoice: `mock_invoice_${amountSats}_${Date.now()}` });
    },
    checkPaymentStatus() {
      return Promise.resolve({ settled: true, settledAt: new Date().toISOString() });
    },
    payInvoice() {
      return Promise.resolve({ settled: true });
    },
    async waitForConfirmation() {
      await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY_MS));
      return { settled: true, settledAt: new Date().toISOString() };
    }
  };
}

function createLndPaymentService() {
  const baseHeaders = {
    'Grpc-Metadata-macaroon': env.lndMacaroon
  };

  async function request(path, { method = 'GET', body } = {}) {
    let url = `${env.lndRestUrl}${path}`;
    if (env.lndTlsCertPath) {
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    }
    const res = await fetch(url, {
      method,
      headers: { ...baseHeaders, 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined
    });
    if (!res.ok) {
      throw ApiError.badRequest(`LND request failed (${res.status})`, 'LND_ERROR');
    }
    return res.json();
  }

  async function pollUntilSettled(paymentHash, attempts = 0) {
    if (attempts >= MAX_POLL_ATTEMPTS) {
      return { settled: false, reason: 'timeout' };
    }
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
    try {
      const data = await request(`/v1/invoice/${paymentHash}`);
      const confirmed = data.settled === true || (data.state !== undefined && data.state !== 'OPEN');
      if (confirmed) return { settled: true, settledAt: new Date().toISOString() };
    } catch {
      // transient error — keep polling
    }
    return pollUntilSettled(paymentHash, attempts + 1);
  }

  return {
    name: 'lnd',
    async createInvoice(amountSats) {
      const body = {
        value: amountSats,
        memo: 'Kazi task payout',
        expiry: 3600
      };
      const data = await request('/v1/invoices', { method: 'POST', body });
      if (!data.payment_request || !data.r_hash) {
        throw ApiError.badRequest('LND did not return a valid invoice', 'LND_ERROR');
      }
      return {
        invoice: data.payment_request,
        paymentHash: Buffer.from(data.r_hash, 'base64').toString('hex')
      };
    },
    async checkPaymentStatus(paymentHash) {
      return pollUntilSettled(paymentHash);
    },
    async payInvoice(paymentRequest) {
      const body = { payment_request: paymentRequest, fee_limit: { fixed: 0 } };
      const data = await request('/v1/channels/transactions', { method: 'POST', body });
      return { settled: data.payment_error === '', status: data.payment_error || 'SUCCEEDED' };
    },
    waitForConfirmation(paymentHash) {
      return pollUntilSettled(paymentHash);
    }
  };
}

export const paymentService =
  env.lndMacaroon && env.lndRestUrl ? createLndPaymentService() : createMockPaymentService();
