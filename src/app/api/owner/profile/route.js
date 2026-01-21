import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Owner from '@/models/Owner';
import Customer from '@/models/Customer';
import jwt from 'jsonwebtoken';
import { signToken } from '@/lib/auth';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

function getToken(req) {
      const auth = req.headers.get('authorization');
      if (!auth || !auth.startsWith('Bearer ')) return null;
      return auth.split(' ')[1];
}

function toObjectId(id) {
      try { return new mongoose.Types.ObjectId(id); } catch { return null; }
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

            const ownerId = toObjectId(decoded.id);
            const owner = await Owner.findById(ownerId).select('-passwordHash');
            if (!owner) return NextResponse.json({ error: 'Owner not found' }, { status: 404 });

            const deletedCustomers = await Customer.find({ ownerId, isDeleted: true }).sort({ deletedAt: -1 });

            return NextResponse.json({ owner, deletedCustomers }, { status: 200 });
      } catch (err) {
            return NextResponse.json({ error: err.message }, { status: 500 });
      }
}

export async function PATCH(req) {
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

            const ownerId = toObjectId(decoded.id);
            const body = await req.json();

            // Handle Password Change
            if (body.currentPassword && body.newPassword) {
                  const owner = await Owner.findById(ownerId);
                  if (!owner) return NextResponse.json({ error: 'Owner not found' }, { status: 404 });

                  const isMatch = await bcrypt.compare(body.currentPassword, owner.passwordHash);
                  if (!isMatch) return NextResponse.json({ error: 'Incorrect current password' }, { status: 400 });

                  if (body.newPassword.length < 6) return NextResponse.json({ error: 'New password must be at least 6 characters' }, { status: 400 });

                  owner.passwordHash = await bcrypt.hash(body.newPassword, 10);
                  await owner.save();
                  return NextResponse.json({ message: 'Password updated successfully' });
            }

            // Handle Restore Customer
            if (body.restoreCustomerId) {
                  const customer = await Customer.findOne({ _id: body.restoreCustomerId, ownerId });
                  if (!customer) return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
                  
                  const conflict = await Customer.findOne({ ownerId, phone: customer.phone, isDeleted: false });
                  if (conflict) return NextResponse.json({ error: 'Active customer with this phone already exists' }, { status: 400 });

                  customer.isDeleted = false;
                  customer.deletedAt = undefined;
                  await customer.save();
                  return NextResponse.json({ message: 'Customer restored successfully' });
            }

            // Handle Profile Update
            const updates = {};
            ['ownerName', 'shopName', 'phone', 'avatarUrl', 'email', 'bio'].forEach(f => {
                  if (body[f] !== undefined) updates[f] = body[f];
            });

            if (updates.email) {
                  const existing = await Owner.findOne({ email: updates.email.toLowerCase(), _id: { $ne: ownerId } });
                  if (existing) return NextResponse.json({ error: 'Email already in use' }, { status: 409 });
                  updates.email = updates.email.toLowerCase();
            }

            const updatedOwner = await Owner.findOneAndUpdate({ _id: ownerId }, { $set: updates }, { new: true }).select('-passwordHash');
            const newToken = signToken(updatedOwner);

            const res = NextResponse.json({ owner: updatedOwner, token: newToken });
            res.cookies.set('token', newToken, { httpOnly: true, path: '/', sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: 7 * 24 * 60 * 60 });
            return res;
      } catch (err) {
            return NextResponse.json({ error: err.message }, { status: 500 });
      }
}
