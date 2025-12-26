import mongoose from 'mongoose';
import connectDB from '@/lib/mongodb';
import Customer from '@/models/Customer';
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';

/* -------------------- helpers -------------------- */

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

// Accept only 10-digit Indian mobile numbers (no +91)
function normalizeIndianMobile(phone) {
      const digits = phone.replace(/\D/g, '');
      if (!/^[6-9]\d{9}$/.test(digits)) return null;
      return digits;
}

/* -------------------- GET customers -------------------- */
export async function GET(req) {
      try {
            await connectDB();

            if (!process.env.JWT_SECRET) {
                  return NextResponse.json(
                        { error: 'Server misconfiguration' },
                        { status: 500 }
                  );
            }

            const token = getToken(req);
            if (!token) {
                  return NextResponse.json(
                        { error: 'Unauthorized: token missing' },
                        { status: 401 }
                  );
            }

            let decoded;
            try {
                  decoded = jwt.verify(token, process.env.JWT_SECRET);
            } catch {
                  return NextResponse.json(
                        { error: 'Invalid or expired token' },
                        { status: 401 }
                  );
            }

            const ownerId = toObjectId(decoded.id);
            if (!ownerId) {
                  return NextResponse.json(
                        { error: 'Invalid owner id in token' },
                        { status: 400 }
                  );
            }

            const customers = await Customer.find({ ownerId })
                  .sort({ createdAt: -1 })
                  .lean();

            return NextResponse.json(customers, { status: 200 });
      } catch (err) {
            console.error('GET /api/customers error:', err);
            return NextResponse.json(
                  { error: 'Internal server error' },
                  { status: 500 }
            );
      }
}

/* -------------------- POST add customer -------------------- */
export async function POST(req) {
      try {
            await connectDB();

            if (!process.env.JWT_SECRET) {
                  return NextResponse.json(
                        { error: 'Server misconfiguration' },
                        { status: 500 }
                  );
            }

            const token = getToken(req);
            if (!token) {
                  return NextResponse.json(
                        { error: 'Unauthorized: token missing' },
                        { status: 401 }
                  );
            }

            let decoded;
            try {
                  decoded = jwt.verify(token, process.env.JWT_SECRET);
            } catch {
                  return NextResponse.json(
                        { error: 'Invalid or expired token' },
                        { status: 401 }
                  );
            }

            const ownerId = toObjectId(decoded.id);
            if (!ownerId) {
                  return NextResponse.json(
                        { error: 'Invalid owner id in token' },
                        { status: 400 }
                  );
            }

            const body = await req.json();
            const name = body?.name?.trim();
            const phone = body?.phone?.trim();

            if (!name || !phone) {
                  return NextResponse.json(
                        { error: 'Name and phone are required' },
                        { status: 400 }
                  );
            }

            const normalizedPhone = normalizeIndianMobile(phone);
            if (!normalizedPhone) {
                  return NextResponse.json(
                        {
                              error:
                                    'Invalid phone number. Enter a valid 10-digit Indian mobile number.',
                        },
                        { status: 400 }
                  );
            }

            try {
                  const customer = await Customer.create({
                        ownerId,
                        name,
                        phone: normalizedPhone,
                        ledger: [],
                        currentDue: 0,
                  });

                  return NextResponse.json(customer, { status: 201 });
            } catch (err) {
                  // Duplicate phone per owner
                  if (err.code === 11000) {
                        return NextResponse.json(
                              { error: 'Customer with this phone already exists' },
                              { status: 409 }
                        );
                  }

                  console.error('POST /api/customers error:', err);
                  return NextResponse.json(
                        { error: 'Internal server error' },
                        { status: 500 }
                  );
            }
      } catch (err) {
            console.error('POST /api/customers error:', err);
            return NextResponse.json(
                  { error: 'Internal server error' },
                  { status: 500 }
            );
      }
}
