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

export async function POST(req) {
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

            const form = await req.formData();
            const file = form.get('file');
            if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

            // Basic validation
            const mime = file.type || '';
            if (!mime.startsWith('image/')) return NextResponse.json({ error: 'Only image uploads are allowed' }, { status: 400 });

            const maxBytes = 1_200_000; // ~1.2MB
            if (file.size && file.size > maxBytes) return NextResponse.json({ error: 'File too large (max 1.2MB)' }, { status: 400 });

            const buffer = Buffer.from(await file.arrayBuffer());
            const base64 = buffer.toString('base64');
            const dataUrl = `data:${mime};base64,${base64}`;

            const updated = await Owner.findOneAndUpdate({ _id: ownerId }, { $set: { avatarUrl: dataUrl } }, { new: true, runValidators: true, context: 'query' }).select('ownerName shopName email phone avatarUrl provider createdAt updatedAt');
            if (!updated) return NextResponse.json({ error: 'Owner not found' }, { status: 404 });

            const newToken = signToken(updated);
            const res = NextResponse.json({ owner: updated, token: newToken }, { status: 200 });
            res.cookies.set('token', newToken, {
                  httpOnly: true,
                  path: '/',
                  sameSite: 'lax',
                  secure: process.env.NODE_ENV === 'production',
                  maxAge: 7 * 24 * 60 * 60,
            });

            return res;
      } catch (err) {
            console.error('POST /api/owner/avatar error:', err);
            return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
      }
}
