import { randomUUID } from 'node:crypto';

// Temporary backend-owned adapter. Replace this module with Atlas repositories
// when the database workstream supplies the final schemas and indexes.
export const store = {
  users: new Map(),
  tasks: new Map(),
  submissions: new Map(),
  payments: new Map(),
  ledger: [],
  paymentLocks: new Set()
};

export const now = () => new Date().toISOString();
export const newId = () => randomUUID();
export const publicUser = ({ passwordHash, ...user }) => user;

export const findUserByEmail = (email) => [...store.users.values()].find((user) => user.email === email.toLowerCase());
export const userWallet = (userId) => {
  const entries = store.ledger.filter((entry) => entry.userId === userId);
  return {
    balanceSats: entries.reduce((sum, entry) => sum + entry.amountSats, 0),
    earningsSats: entries.filter((entry) => entry.type === 'earning').reduce((sum, entry) => sum + entry.amountSats, 0),
    entries
  };
};
