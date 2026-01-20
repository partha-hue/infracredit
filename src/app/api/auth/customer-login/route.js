import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Customer from '@/models/Customer';
import connectDB from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

export async function POST(req) {
      try {
            await connectDB();
            const { phone, password, isRegistering } = await req.json();

            if (!phone || !password) return NextResponse.json({ error: 'Phone and password required' }, { status: 400 });

            // Normalize phone
            let digits = String(phone).replace(/\D/g, '');
            if (digits.startsWith('91') && digits.length === 12) digits = digits.slice(2);
            if (digits.length !== 10) return NextResponse.json({ error: 'Invalid 10-digit phone number' }, { status: 400 });

            // Find any customer entry with this phone number
            const customer = await Customer.findOne({ phone: digits });

            if (!customer) {
                  return NextResponse.json({ error: 'This phone number is not registered. Please ask your shop owner to add you first.' }, { status: 404 });
            }

            // JWT helper
            const generateToken = () => jwt.sign({ phone: digits, role: 'customer' }, process.env.JWT_SECRET, { expiresIn: '30d' });

            // Registration Flow
            if (isRegistering) {
                  if (customer.isRegistered) return NextResponse.json({ error: 'User already registered. Please login.' }, { status: 400 });
                  
                  const hash = await bcrypt.hash(password, 10);
                  await Customer.updateMany({ phone: digits }, { passwordHash: hash, isRegistered: true });
                  
                  const token = generateToken();
                  const res = NextResponse.json({ success: true, token, role: 'customer', message: 'Password set and logged in successfully!' });
                  res.cookies.set('token', token, { httpOnly: true, path: '/', sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: 30 * 24 * 60 * 60 });
                  return res;
            }

            // Login Flow
            if (!customer.isRegistered) {
                  return NextResponse.json({ error: 'Please set a password first' }, { status: 403 });
            }

            const isMatch = await bcrypt.compare(password, customer.passwordHash);
            if (!isMatch) return NextResponse.json({ error: 'Incorrect password' }, { status: 401 });

            const token = generateToken();
            const res = NextResponse.json({ success: true, token, role: 'customer' });
            res.cookies.set('token', token, { httpOnly: true, path: '/', sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: 30 * 24 * 60 * 60 });

            return res;
      } catch (err) {
            return NextResponse.json({ error: err.message }, { status: 500 });
      }
}
