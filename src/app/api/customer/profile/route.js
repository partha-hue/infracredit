import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Customer from '@/models/Customer';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

function getToken(req) {
      const auth = req.headers.get('authorization');
      if (!auth || !auth.startsWith('Bearer ')) return null;
      return auth.split(' ')[1];
}

export async function GET(req) {
      try {
            await dbConnect();
            const token = getToken(req);
            if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            if (decoded.role !== 'customer') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

            // Get customer details (phone is the unique identifier for the login)
            const customer = await Customer.findOne({ phone: decoded.phone, isRegistered: true }).select('-passwordHash');
            if (!customer) return NextResponse.json({ error: 'Not found' }, { status: 404 });

            return NextResponse.json(customer);
      } catch (err) {
            return NextResponse.json({ error: err.message }, { status: 500 });
      }
}

export async function PATCH(req) {
      try {
            await dbConnect();
            const token = getToken(req);
            if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const body = await req.json();

            // Find all instances of this customer (across different shops)
            const phone = decoded.phone;

            if (body.newPassword) {
                  const hash = await bcrypt.hash(body.newPassword, 10);
                  await Customer.updateMany({ phone }, { passwordHash: hash });
                  return NextResponse.json({ message: 'Password updated' });
            }

            const updates = {};
            if (body.name) updates.name = body.name;
            if (body.avatarUrl) updates.avatarUrl = body.avatarUrl;

            if (Object.keys(updates).length > 0) {
                  await Customer.updateMany({ phone }, { $set: updates });
            }

            return NextResponse.json({ message: 'Profile updated' });
      } catch (err) {
            return NextResponse.json({ error: err.message }, { status: 500 });
      }
}
