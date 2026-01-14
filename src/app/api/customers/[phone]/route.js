import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Customer from '@/models/Customer';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

function getToken(req) {
      const auth = req.headers.get('authorization');
      if (!auth || !auth.startsWith('Bearer ')) return null;
      return auth.split(' ')[1];
}

function toObjectId(id) {
      try { return new mongoose.Types.ObjectId(id); } catch { return null; }
}

function normalizeIndianMobile(rawPhone) {
      if (!rawPhone) return null;
      let digits = String(rawPhone).replace(/\D/g, '');
      if (digits.startsWith('0091') && digits.length - 4 >= 10) digits = digits.slice(4);
      else if (digits.startsWith('91') && digits.length - 2 >= 10) digits = digits.slice(2);
      else if (digits.startsWith('0') && digits.length - 1 >= 10) digits = digits.slice(1);
      return digits.length === 10 ? digits : null;
}

function extractPhoneFromReq(req, params) {
      if (params && params.phone) return params.phone;
      try {
            const url = new URL(req.url, 'http://localhost');
            const parts = url.pathname.split('/').filter(Boolean);
            return parts.length ? parts[parts.length - 1] : null;
      } catch (e) { return null; }
}

export async function GET(req, { params }) {
      try {
            await dbConnect();
            const token = getToken(req);
            if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

            let decoded;
            try { decoded = jwt.verify(token, process.env.JWT_SECRET); } catch { return NextResponse.json({ error: 'Invalid token' }, { status: 401 }); }

            const ownerId = toObjectId(decoded.id);
            const rawParam = extractPhoneFromReq(req, params);
            let normalizedPhone = normalizeIndianMobile(rawParam) || rawParam;

            const customer = await Customer.findOne({ ownerId, phone: normalizedPhone, isDeleted: false });
            if (!customer) return NextResponse.json({ error: 'Customer not found' }, { status: 404 });

            return NextResponse.json(customer, { status: 200 });
      } catch (err) {
            return NextResponse.json({ error: err.message }, { status: 500 });
      }
}

export async function POST(req, { params }) {
      try {
            await dbConnect();
            const token = getToken(req);
            if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

            let decoded;
            try { decoded = jwt.verify(token, process.env.JWT_SECRET); } catch { return NextResponse.json({ error: 'Invalid token' }, { status: 401 }); }

            const ownerId = toObjectId(decoded.id);
            const rawParam = extractPhoneFromReq(req, params);
            let normalizedPhone = normalizeIndianMobile(rawParam) || rawParam;

            const { type, amount, note, date } = await req.json();
            const customer = await Customer.findOne({ ownerId, phone: normalizedPhone, isDeleted: false });
            if (!customer) return NextResponse.json({ error: 'Customer not found' }, { status: 404 });

            const signedAmount = type === 'credit' ? Math.abs(amount) : -Math.abs(amount);
            const now = date ? new Date(date) : new Date();
            const newBalance = (customer.currentDue || 0) + signedAmount;

            customer.ledger.push({ type, amount: signedAmount, note: note || '', createdAt: now, balanceAfter: newBalance });
            customer.currentDue = newBalance;
            await customer.save();

            return NextResponse.json(customer, { status: 200 });
      } catch (err) {
            return NextResponse.json({ error: err.message }, { status: 500 });
      }
}

export async function PATCH(req, { params }) {
      try {
            await dbConnect();
            const token = getToken(req);
            if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

            let decoded;
            try { decoded = jwt.verify(token, process.env.JWT_SECRET); } catch { return NextResponse.json({ error: 'Invalid token' }, { status: 401 }); }

            const ownerId = toObjectId(decoded.id);
            const rawParam = extractPhoneFromReq(req, params);
            let normalizedPhone = normalizeIndianMobile(rawParam) || rawParam;

            const body = await req.json();
            const customer = await Customer.findOne({ ownerId, phone: normalizedPhone, isDeleted: false });
            if (!customer) return NextResponse.json({ error: 'Customer not found' }, { status: 404 });

            if (body.name || body.newPhone) {
                  if (body.name) customer.name = body.name.trim();
                  if (body.newPhone) {
                        const norm = normalizeIndianMobile(body.newPhone);
                        if (!norm) return NextResponse.json({ error: 'Invalid new phone' }, { status: 400 });
                        customer.phone = norm;
                  }
            } else if (Array.isArray(body.ledger)) {
                  let running = 0;
                  customer.ledger = body.ledger.map((e) => {
                        const signed = e.type === 'credit' ? Math.abs(e.amount) : -Math.abs(e.amount);
                        running += signed;
                        return { ...e, amount: signed, balanceAfter: running, createdAt: e.createdAt || new Date() };
                  });
                  customer.currentDue = running;
            }

            await customer.save();
            return NextResponse.json(customer, { status: 200 });
      } catch (err) {
            return NextResponse.json({ error: err.message }, { status: 500 });
      }
}

export async function DELETE(req, { params }) {
      try {
            await dbConnect();
            const token = getToken(req);
            if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

            let decoded;
            try { decoded = jwt.verify(token, process.env.JWT_SECRET); } catch { return NextResponse.json({ error: 'Invalid token' }, { status: 401 }); }

            const ownerId = toObjectId(decoded.id);
            const rawParam = extractPhoneFromReq(req, params);
            let normalizedPhone = normalizeIndianMobile(rawParam) || rawParam;

            // Soft delete
            const customer = await Customer.findOne({ ownerId, phone: normalizedPhone, isDeleted: false });
            if (!customer) return NextResponse.json({ error: 'Customer not found' }, { status: 404 });

            customer.isDeleted = true;
            customer.deletedAt = new Date();
            await customer.save();

            return NextResponse.json({ message: 'Customer soft-deleted' }, { status: 200 });
      } catch (err) {
            return NextResponse.json({ error: err.message }, { status: 500 });
      }
}
