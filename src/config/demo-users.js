import bcrypt from 'bcrypt';
import { User } from '../models/User.js';

export const demoAccounts = {
  employer: { name: 'Kazi Demo Employer', email: 'employer.demo@kazi.work', password: 'KaziEmployer2026!', role: 'client' },
  youth: { name: 'Kazi Demo Youth', email: 'youth.demo@kazi.work', password: 'KaziYouth2026!', role: 'youth', skills: ['research', 'digital services'] }
};

export async function ensureDemoUsers() {
  for (const account of Object.values(demoAccounts)) {
    const existing = await User.findOne({ email: account.email });
    if (existing) continue;
    const { password, ...profile } = account;
    await User.create({ ...profile, passwordHash: await bcrypt.hash(password, 10) });
    console.log(`Created demo ${account.role} account: ${account.email}`);
  }
}
