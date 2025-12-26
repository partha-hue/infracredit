import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Customer from '@/models/Customer';

/* ======================
   PHONE NORMALIZER
====================== */
function normalizeIndianMobile(rawPhone) {
      if (!rawPhone) return null;
      let digits = String(rawPhone).replace(/\D/g, '');
      if (digits.length > 10 && digits.startsWith('91')) {
            digits = digits.slice(2);
      }
      if (digits.length !== 10) return null;
      return digits;
}

/* ======================
   GET /api/customers/[phone]
   - Single customer with full ledger
====================== */
export async function GET(req, { params }) {
      try {
            await dbConnect();
            const normalizedPhone = normalizeIndianMobile(params.phone);
            if (!normalizedPhone) {
                  return NextResponse.json(
                        { error: 'Invalid phone number' },
                        { status: 400 },
                  );
            }

            const customer = await Customer.findOne({ phone: normalizedPhone });
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

/* ======================
   POST /api/customers/[phone]
   - Add transaction for this customer
====================== */
export async function POST(req, { params }) {
      try {
            await dbConnect();
            const normalizedPhone = normalizeIndianMobile(params.phone);
            if (!normalizedPhone) {
                  return NextResponse.json(
                        { error: 'Invalid phone number' },
                        { status: 400 },
                  );
            }

            const { type, amount, note } = await req.json();

            if (!type || !amount) {
                  return NextResponse.json(
                        { error: 'Type and amount required' },
                        { status: 400 },
                  );
            }

            const customer = await Customer.findOne({ phone: normalizedPhone });
            if (!customer) {
                  return NextResponse.json(
                        { error: 'Customer not found' },
                        { status: 404 },
                  );
            }

            const signedAmount =
                  type === 'credit' ? Math.abs(amount) : -Math.abs(amount);

            const now = new Date();

            // ensure every entry has createdAt and balanceAfter
            const newBalance = (customer.currentDue || 0) + signedAmount;

            customer.ledger.push({
                  type,
                  amount: signedAmount,
                  note,
                  createdAt: now, // Date object; Mongo stores as ISO
                  balanceAfter: newBalance,
            });

            customer.currentDue = newBalance;

            // OPTIONAL: backfill createdAt for old entries missing it
            customer.ledger.forEach((entry) => {
                  if (!entry.createdAt) {
                        entry.createdAt = entry._id?.getTimestamp
                              ? entry._id.getTimestamp()
                              : now;
                  }
            });

            await customer.save();

            // return updated customer with full ledger
            return NextResponse.json(customer);
      } catch (err) {
            console.error('POST /api/customers/[phone] error:', err);
            return NextResponse.json(
                  { error: err.message || 'Server error' },
                  { status: 500 },
            );
      }
}
