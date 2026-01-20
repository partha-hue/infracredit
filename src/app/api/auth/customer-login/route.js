import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Customer from '@/models/Customer';
import connectDB from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

export async function POST(req) {
      try {
            await connectDB();
            const { phone, password } = await req.json();

            if (!phone || !password) return NextResponse.json({ error: 'Phone and password required' }, { status: 400 });

            // Find any customer entry with this phone number
            const customer = await Customer.findOne({ phone, isRegistered: true });

            if (!customer) {
                  // Check if phone exists but not registered
                  const exists = await Customer.findOne({ phone });
                  if (exists) return NextResponse.json({ error: 'Please set a password first' }, { status: 403 });
                  return NextResponse.json({ error: 'Phone number not found' }, { status: 404 });
            }

            const isMatch = await bcrypt.compare(password, customer.passwordHash);
            if (!isMatch) return NextResponse.json({ error: 'Incorrect password' }, { status: 401 });

            const token = jwt.sign({ phone, role: 'customer' }, process.env.JWT_SECRET, { expiresIn: '30d' });

            return NextResponse.json({ success: true, token, role: 'customer' });
      } catch (err) {
            return NextResponse.json({ error: err.message }, { status: 500 });
      }
}
