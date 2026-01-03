import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Owner from '@/models/Owner';
import jwt from 'jsonwebtoken';
import { signToken } from '@/lib/auth';
import mongoose from 'mongoose';

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

export async function GET(req) {
      try {
            await dbConnect();
            if (!process.env.JWT_SECRET) return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });

            const token = getToken(req);
            if (!token) return NextResponse.json({ error: 'Unauthorized: token missing' }, { status: 401 });

            let decoded;
            try {
                  decoded = jwt.verify(token, process.env.JWT_SECRET);
            } catch {
                  return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
            }

            const ownerId = toObjectId(decoded.id);
            if (!ownerId) return NextResponse.json({ error: 'Invalid owner id in token' }, { status: 400 });

            const owner = await Owner.findById(ownerId).select('ownerName shopName email phone avatarUrl provider createdAt updatedAt');
            if (!owner) return NextResponse.json({ error: 'Owner not found' }, { status: 404 });

            return NextResponse.json(owner, { status: 200 });
      } catch (err) {
            console.error('GET /api/owner/profile error:', err);
            return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
      }
}

export async function PATCH(req) {
      try {
            await dbConnect();
            if (!process.env.JWT_SECRET) return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });

            const token = getToken(req);
            if (!token) return NextResponse.json({ error: 'Unauthorized: token missing' }, { status: 401 });

            let decoded;
            try {
                  decoded = jwt.verify(token, process.env.JWT_SECRET);
            } catch {
                  return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
            }

            const ownerId = toObjectId(decoded.id);
            if (!ownerId) return NextResponse.json({ error: 'Invalid owner id in token' }, { status: 400 });

            const body = await req.json();
            const updates = {};
            if (body.ownerName) updates.ownerName = String(body.ownerName).trim();
            if (body.shopName) updates.shopName = String(body.shopName).trim();
            if (body.phone) updates.phone = String(body.phone).replace(/\D/g, '');
            if (body.avatarUrl) updates.avatarUrl = String(body.avatarUrl).trim();
            if (body.email) updates.email = String(body.email).trim().toLowerCase();

            if (!Object.keys(updates).length) return NextResponse.json({ error: 'No updates provided' }, { status: 400 });

            try {
                  const updated = await Owner.findOneAndUpdate({ _id: ownerId }, { $set: updates }, { new: true, runValidators: true, context: 'query' }).select('ownerName shopName email phone avatarUrl provider createdAt updatedAt');
                  if (!updated) return NextResponse.json({ error: 'Owner not found' }, { status: 404 });

                  // reissue token with new claims (so client can refresh stored token if desired)
                  const newToken = signToken(updated);

                  const res = NextResponse.json({ owner: updated, token: newToken }, { status: 200 });
                  // update cookie as well
                  res.cookies.set('token', newToken, {
                        httpOnly: true,
                        path: '/',
                        sameSite: 'lax',
                        secure: process.env.NODE_ENV === 'production',
                        maxAge: 7 * 24 * 60 * 60,
                  });
                  return res;
            } catch (err) {
                  if (err.code === 11000) return NextResponse.json({ error: 'Email already in use' }, { status: 409 });
                  throw err;
            }
      } catch (err) {
            console.error('PATCH /api/owner/profile error:', err);
            return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
      }
}
