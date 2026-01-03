import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Customer from '@/models/Customer';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

// Backend version tag to help verify deployment logs
const BACKEND_FIX_VERSION = 'fix/phone-normalization-2026-01-04-v2';

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

function normalizeIndianMobile(rawPhone) {
      if (!rawPhone) return null;

      const original = String(rawPhone);
      let digits = original.replace(/\D/g, '');

      // Remove common country/trunk prefixes ONLY if doing so leaves >= 10 digits
      if (digits.startsWith('0091') && digits.length - 4 >= 10) {
            digits = digits.slice(4);
      } else if (digits.startsWith('91') && digits.length - 2 >= 10) {
            digits = digits.slice(2);
      } else if (digits.startsWith('0') && digits.length - 1 >= 10) {
            digits = digits.slice(1);
      }

      // Must be exactly 10 digits and start with 6-9 (Indian mobile rule)
      if (!/^[6-9]\d{9}$/.test(digits)) {
            // Fallback: accept any 10-digit number (keeps compatibility with older data)
            if (digits.length === 10) {
                  console.warn('Phone does not start with 6-9 but is 10 digits — accepting as fallback', { raw: original, normalized: digits });
                  return digits;
            }

            console.error('Phone normalization failed', { raw: original, digits, reason: 'must be 10 digits and start with 6-9' });
            return null;
      }

      console.log('Normalized phone', { raw: original, normalized: digits });
      return digits;
}

/***** helper: robust phone extraction from request (params or path) *****/
function extractPhoneFromReq(req, params) {
      // prefer params.phone if present
      if (params && params.phone) return params.phone;

      // otherwise, try to parse last path segment from request URL
      try {
            const url = new URL(req.url, 'http://localhost');
            const parts = url.pathname.split('/').filter(Boolean);
            return parts.length ? parts[parts.length - 1] : null;
      } catch (e) {
            return null;
      }
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

            console.log('Backend version:', BACKEND_FIX_VERSION);

            // get phone from params or fallback to parsing URL path
            const rawParam = extractPhoneFromReq(req, params);
            if (!rawParam) {
                  console.error('GET /api/customers/[phone]: missing param and no phone in path', { rawParam });
                  return NextResponse.json(
                        { error: 'Phone parameter is missing' },
                        { status: 400 },
                  );
            }

            let normalizedPhone = normalizeIndianMobile(rawParam);

            // Server-side tolerant fallback: if normalize fails but raw param contains exactly 10 digits, accept it
            if (!normalizedPhone) {
                  const rawDigits = String(rawParam || '').replace(/\D/g, '');
                  if (rawDigits.length === 10) {
                        console.warn('Fallback acceptance of raw 10-digit phone in GET', { rawParam, digits: rawDigits });
                        normalizedPhone = rawDigits;
                  }
            }

            if (!normalizedPhone) {
                  console.error('GET /api/customers/[phone]: invalid phone param', { rawParam });
                  return NextResponse.json(
                        {
                              error:
                                    'Invalid phone number format. Enter a valid 10-digit Indian mobile number (e.g., 9876543210).',
                        },
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

            return NextResponse.json(customer, { status: 200 });
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
            const rawParamPost = extractPhoneFromReq(req, params);
            if (!rawParamPost) {
                  console.error('POST /api/customers/[phone]: missing param and no phone in path', { rawParam: rawParamPost });
                  return NextResponse.json(
                        { error: 'Phone parameter is missing' },
                        { status: 400 },
                  );
            }

            let normalizedPhone = normalizeIndianMobile(rawParamPost);

            // Server-side tolerant fallback: if normalize fails but raw param contains exactly 10 digits, accept it
            if (!normalizedPhone) {
                  const rawDigits = String(rawParamPost || '').replace(/\D/g, '');
                  if (rawDigits.length === 10) {
                        console.warn('Fallback acceptance of raw 10-digit phone in POST', { rawParam: rawParamPost, digits: rawDigits });
                        normalizedPhone = rawDigits;
                  }
            }

            if (!normalizedPhone) {
                  console.error('POST /api/customers/[phone]: invalid phone param', { rawParam: rawParamPost });
                  return NextResponse.json(
                        {
                              error:
                                    'Invalid phone number format. Enter a valid 10-digit Indian mobile number (e.g., 9876543210).',
                        },
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
            return NextResponse.json(customer, { status: 200 });
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

            const rawParamDelete = extractPhoneFromReq(req, params);
            if (!rawParamDelete) {
                  console.error('DELETE /api/customers/[phone]: missing param and no phone in path', { rawParam: rawParamDelete });
                  return NextResponse.json(
                        { error: 'Phone parameter is missing' },
                        { status: 400 },
                  );
            }

            let normalizedPhone = normalizeIndianMobile(rawParamDelete);

            // Server-side tolerant fallback: if normalize fails but raw param contains exactly 10 digits, accept it
            if (!normalizedPhone) {
                  const rawDigits = String(rawParamDelete || '').replace(/\D/g, '');
                  if (rawDigits.length === 10) {
                        console.warn('Fallback acceptance of raw 10-digit phone in DELETE', { rawParam: rawParamDelete, digits: rawDigits });
                        normalizedPhone = rawDigits;
                  }
            }

            if (!normalizedPhone) {
                  console.error('DELETE /api/customers/[phone]: invalid phone param', { rawParam: rawParamDelete });
                  return NextResponse.json(
                        {
                              error:
                                    'Invalid phone number format. Enter a valid 10-digit Indian mobile number (e.g., 9876543210).',
                        },
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
            return NextResponse.json({ message: 'Customer deleted' }, { status: 200 });
      } catch (err) {
            console.error('DELETE /api/customers/[phone] error:', err);
            return NextResponse.json(
                  { error: err.message || 'Server error' },
                  { status: 500 },
            );
      }
}
