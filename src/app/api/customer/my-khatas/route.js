import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Customer from '@/models/Customer';
import jwt from 'jsonwebtoken';

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

            let decoded;
            try {
                  decoded = jwt.verify(token, process.env.JWT_SECRET);
            } catch {
                  return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
            }

            if (decoded.role !== 'customer') {
                  return NextResponse.json({ error: 'Access denied' }, { status: 403 });
            }

            // Find all customer records belonging to this phone number across all shops
            const khatas = await Customer.find({ phone: decoded.phone, isDeleted: false })
                  .populate('ownerId', 'shopName ownerName')
                  .sort({ updatedAt: -1 });

            return NextResponse.json(khatas, { status: 200 });
      } catch (err) {
            return NextResponse.json({ error: err.message }, { status: 500 });
      }
}
