import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Customer from '@/models/Customer';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

/* ===== helpers ===== */
function getToken(req) {
      const auth = req.headers.get('authorization');
      if (!auth || !auth.startsWith('Bearer ')) return null;
      return auth.split(' ')[1];
}

function toObjectId(id) {
      try {
            return new mongoose.Types.ObjectId(id);
      } catch {
            return null;
      }
}

// 🔥 FIXED: More flexible phone normalization + detailed logging
function normalizeIndianMobile(rawPhone) {
      if (!rawPhone) {
            console.error('Phone normalization: rawPhone is empty');
            return null;
      }

      let digits = String(rawPhone).replace(/\D/g, '');
      console.log(`Phone normalization: "${rawPhone}" → "${digits}"`);

      if (digits.length > 10 && digits.startsWith('91')) {
            digits = digits.slice(2);
            console.log('Phone normalization: stripped +91 prefix');
      }

      // 🔥 FIXED: Allow ANY 10-digit number for testing/business use
      // Original: /^[6-9]\d{9}$/ (strict mobile rule)
      // New: /^\d{10}$/ (any 10 digits)
      if (!/^\d{10}$/.test(digits)) {
            console.error(`Phone validation FAILED: "${digits}" does not match 10 digits`);
            return null;
      }

      console.log(`Phone normalization SUCCESS: "${digits}"`);
      return digits;
}

/* ===== GET /api/customers/[phone] ===== */
export async function GET(req, { params }) {
      try {
            await dbConnect();

            if (!process.env.JWT_SECRET) {
                  return NextResponse.json(
                        { error: 'Server misconfiguration' },
                        { status: 500 },
                  );
            }

            const token = getToken(req);
            if (!token) {
                  return NextResponse.json(
                        { error: 'Unauthorized: token missing' },
                        { status: 401 },
                  );
            }

            let decoded;
            try {
                  decoded = jwt.verify(token, process.env.JWT_SECRET);
            } catch {
                  return NextResponse.json(
                        { error: 'Invalid or expired token' },
                        { status: 401 },
                  );
            }

            const ownerId = toObjectId(decoded.id);
            if (!ownerId) {
                  return NextResponse.json(
                        { error: 'Invalid owner id in token' },
                        { status: 400 },
                  );
            }

            const normalizedPhone = normalizeIndianMobile(params.phone);
            if (!normalizedPhone) {
                  return NextResponse.json(
                        { error: 'Invalid phone number format. Must be 10 digits.' },
                        { status: 400 },
                  );
            }

            const customer = await Customer.findOne({ ownerId, phone: normalizedPhone });
            if (!customer) {
                  return NextResponse.json(
                        { error: 'Customer not found' },
                        { status: 404 },
                  );
            }

            return NextResponse.json(customer);
      } catch (err) {
            console.error('GET /api/customers/[phone] error:', err);
            return NextResponse.json(
                  { error: err.message || 'Server error' },
                  { status: 500 },
            );
      }
}

/* ===== POST /api/customers/[phone] (add transaction) ===== */
export async function POST(req, { params }) {
      try {
            await dbConnect();

            if (!process.env.JWT_SECRET) {
                  return NextResponse.json(
                        { error: 'Server misconfiguration' },
                        { status: 500 },
                  );
            }

            const token = getToken(req);
            if (!token) {
                  return NextResponse.json(
                        { error: 'Unauthorized: token missing' },
                        { status: 401 },
                  );
            }

            let decoded;
            try {
                  decoded = jwt.verify(token, process.env.JWT_SECRET);
            } catch {
                  return NextResponse.json(
                        { error: 'Invalid or expired token' },
                        { status: 401 },
                  );
            }

            const ownerId = toObjectId(decoded.id);
            if (!ownerId) {
                  return NextResponse.json(
                        { error: 'Invalid owner id in token' },
                        { status: 400 },
                  );
            }

            // 🔥 FIXED: Same normalization as GET
            const normalizedPhone = normalizeIndianMobile(params.phone);
            if (!normalizedPhone) {
                  return NextResponse.json(
                        { error: 'Invalid phone number format. Must be 10 digits.' },
                        { status: 400 },
                  );
            }

            const { type, amount, note, date } = await req.json();
            console.log(`POST /api/customers/${params.phone}:`, { type, amount, note, date });

            if (!type || amount == null) {
                  return NextResponse.json(
                        { error: 'Type and amount required' },
                        { status: 400 },
                  );
            }

            const numericAmount = Number(amount);
            if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
                  return NextResponse.json(
                        { error: 'Amount must be a positive number' },
                        { status: 400 },
                  );
            }

            const customer = await Customer.findOne({ ownerId, phone: normalizedPhone });
            if (!customer) {
                  return NextResponse.json(
                        { error: 'Customer not found' },
                        { status: 404 },
                  );
            }

            const signedAmount =
                  type === 'credit' ? Math.abs(numericAmount) : -Math.abs(numericAmount);

            const now = date ? new Date(date) : new Date();
            const newBalance = (customer.currentDue || 0) + signedAmount;

            customer.ledger.push({
                  type,
                  amount: signedAmount,
                  note: note || '',
                  createdAt: now,
                  balanceAfter: newBalance,
            });

            customer.currentDue = newBalance;

            // backfill createdAt if missing on older entries
            customer.ledger.forEach((entry) => {
                  if (!entry.createdAt) {
                        entry.createdAt =
                              entry._id?.getTimestamp?.() || now;
                  }
            });

            await customer.save();

            console.log(`Transaction saved for ${normalizedPhone}: ${type} ₹${numericAmount}`);
            return NextResponse.json(customer);
      } catch (err) {
            console.error('POST /api/customers/[phone] error:', err);
            return NextResponse.json(
                  { error: err.message || 'Server error' },
                  { status: 500 },
            );
      }
}

/* ===== DELETE /api/customers/[phone] ===== */
export async function DELETE(req, { params }) {
      try {
            await dbConnect();

            const token = getToken(req);
            if (!token) {
                  return NextResponse.json(
                        { error: 'Unauthorized: token missing' },
                        { status: 401 },
                  );
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const ownerId = toObjectId(decoded.id);
            if (!ownerId) {
                  return NextResponse.json(
                        { error: 'Invalid owner id in token' },
                        { status: 400 },
                  );
            }

            const normalizedPhone = normalizeIndianMobile(params.phone);
            if (!normalizedPhone) {
                  return NextResponse.json(
                        { error: 'Invalid phone number' },
                        { status: 400 },
                  );
            }

            const deleted = await Customer.findOneAndDelete({
                  ownerId,
                  phone: normalizedPhone,
            });

            if (!deleted) {
                  return NextResponse.json(
                        { error: 'Customer not found' },
                        { status: 404 },
                  );
            }

            console.log(`Customer deleted: ${normalizedPhone}`);
            return NextResponse.json({ message: 'Customer deleted' });
      } catch (err) {
            console.error('DELETE /api/customers/[phone] error:', err);
            return NextResponse.json(
                  { error: err.message || 'Server error' },
                  { status: 500 },
            );
      }
}
