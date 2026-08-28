import { env } from '../config/env.js';

export class LNbitsError extends Error {
  constructor(message, { statusCode = 502, code = 'LNBITS_ERROR', cause } = {}) {
    super(message, { cause });
    this.statusCode = statusCode;
    this.code = code;
  }
}

export class LNbitsPaymentService {
  constructor(config = env) {
    this.url = config.lnbitsUrl;
    this.adminKey = config.lnbitsAdminKey;
    this.invoiceKey = config.lnbitsInvoiceKey || config.lnbitsAdminKey;
    this.timeoutMs = config.lnbitsTimeoutMs;
  }

  assertConfigured() {
    if (!this.url || !this.adminKey) throw new LNbitsError('Lightning service is not configured', { statusCode: 503, code: 'LNBITS_NOT_CONFIGURED' });
  }

  async request(path, { method = 'GET', body, key = this.adminKey } = {}) {
    this.assertConfigured();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await fetch(`${this.url}${path}`, { method, signal: controller.signal, headers: { 'Content-Type': 'application/json', 'X-Api-Key': key }, body: body ? JSON.stringify(body) : undefined });
      const text = await response.text();
      let data; try { data = text ? JSON.parse(text) : {}; } catch { data = { detail: text }; }
      if (!response.ok) {
        const message = data.detail || data.message || `LNbits request failed (${response.status})`;
        const code = response.status === 401 || response.status === 403 ? 'LNBITS_AUTH_ERROR' : response.status === 402 ? 'LNBITS_INSUFFICIENT_FUNDS' : 'LNBITS_REQUEST_FAILED';
        throw new LNbitsError(message, { statusCode: 502, code });
      }
      return data;
    } catch (error) {
      if (error instanceof LNbitsError) throw error;
      const code = error.name === 'AbortError' ? 'LNBITS_TIMEOUT' : 'LNBITS_UNAVAILABLE';
      throw new LNbitsError('Lightning service is unavailable', { statusCode: 503, code, cause: error });
    } finally { clearTimeout(timeout); }
  }

  async createInvoice(amountSats, memo = 'Kazi task payment') {
    const data = await this.request('/api/v1/payments', { method: 'POST', key: this.invoiceKey, body: { out: false, amount: amountSats, memo } });
    return { invoice: data.payment_request || data.bolt11, paymentHash: data.payment_hash || data.checking_id, amountSats: Number(data.amount || amountSats), status: data.paid ? 'PAID' : 'PENDING' };
  }

  async decodeInvoice(invoice) {
    const data = await this.request('/api/v1/payments/decodepay', { method: 'POST', key: this.invoiceKey, body: { data: invoice } });
    return { amountSats: data.amount_msat ? Number(data.amount_msat) / 1000 : Number(data.amount || 0), paymentHash: data.payment_hash || data.payment_hash_bech32 };
  }

  async payInvoice(invoice) {
    const data = await this.request('/api/v1/payments', { method: 'POST', body: { out: true, bolt11: invoice } });
    return { paymentHash: data.payment_hash || data.checking_id, feeSats: Math.ceil(Math.abs(Number(data.fee || data.fee_msat || 0)) / (data.fee_msat ? 1000 : 1)), raw: data };
  }

  async checkPayment(paymentHash) {
    const data = await this.request(`/api/v1/payments/${encodeURIComponent(paymentHash)}`, { key: this.invoiceKey });
    return { paid: Boolean(data.paid || data.status === 'complete' || data.status === 'paid'), paymentHash: data.payment_hash || data.checking_id || paymentHash, raw: data };
  }

  async getBalance() {
    const data = await this.request('/api/v1/wallet', { key: this.invoiceKey });
    return { balanceSats: Math.floor(Number(data.balance || 0) / 1000) };
  }
}

export const lnbitsPaymentService = new LNbitsPaymentService();

