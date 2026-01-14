import mongoose from 'mongoose';
import connectDB from '@/lib/mongodb';
import Customer from '@/models/Customer';
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';

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
      let digits = String(rawPhone).replace(/\D/g, '');
      if (digits.startsWith('0091') && digits.length - 4 >= 10) digits = digits.slice(4);
      else if (digits.startsWith('91') && digits.length - 2 >= 10) digits = digits.slice(2);
      else if (digits.startsWith('0') && digits.length - 1 >= 10) digits = digits.slice(1);
      return digits.length === 10 ? digits : null;
}

export async function GET(req) {
      try {
            await connectDB();
            const token = getToken(req);
            if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

            let decoded;
            try {
                  decoded = jwt.verify(token, process.env.JWT_SECRET);
            } catch {
                  return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
            }

            const ownerId = toObjectId(decoded.id);
            // ONLY fetch non-deleted customers for the main UI
            const customers = await Customer.find({ ownerId, isDeleted: false })
                  .sort({ createdAt: -1 })
                  .lean();

            return NextResponse.json(customers, { status: 200 });
      } catch (err) {
            return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
      }
}

export async function POST(req) {
      try {
            await connectDB();
            const token = getToken(req);
            if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

            let decoded;
            try {
                  decoded = jwt.verify(token, process.env.JWT_SECRET);
            } catch {
                  return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
            }

            const ownerId = toObjectId(decoded.id);
            const body = await req.json();
            const name = body?.name?.trim();
            const phone = body?.phone?.trim();

            if (!name || !phone) return NextResponse.json({ error: 'Name and phone are required' }, { status: 400 });

            const normalizedPhone = normalizeIndianMobile(phone);
            if (!normalizedPhone) return NextResponse.json({ error: 'Invalid 10-digit phone number' }, { status: 400 });

            // Check if active customer already exists
            const existing = await Customer.findOne({ ownerId, phone: normalizedPhone, isDeleted: false });
            if (existing) return NextResponse.json({ error: 'Active customer with this phone already exists' }, { status: 409 });

            // If a deleted version exists, we could restore it or create new. 
            // For simplicity, we just create a new active one.
            const customer = await Customer.create({
                  ownerId,
                  name,
                  phone: normalizedPhone,
                  ledger: [],
                  currentDue: 0,
                  isDeleted: false
            });

            return NextResponse.json(customer, { status: 201 });
      } catch (err) {
            return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
      }
}
