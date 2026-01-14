import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Owner from '@/models/Owner';
import Customer from '@/models/Customer';
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
            const token = getToken(req);
            if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

            let decoded;
            try {
                  decoded = jwt.verify(token, process.env.JWT_SECRET);
            } catch {
                  return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
            }

            const ownerId = toObjectId(decoded.id);
            const owner = await Owner.findById(ownerId).select('ownerName shopName email phone avatarUrl provider createdAt updatedAt');
            if (!owner) return NextResponse.json({ error: 'Owner not found' }, { status: 404 });

            // Fetch deleted customers for the restore feature
            const deletedCustomers = await Customer.find({ ownerId, isDeleted: true }).sort({ deletedAt: -1 });

            return NextResponse.json({ owner, deletedCustomers }, { status: 200 });
      } catch (err) {
            console.error('GET /api/owner/profile error:', err);
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

            // Handle Restore Customer
            if (body.restoreCustomerId) {
                  const customer = await Customer.findOne({ _id: body.restoreCustomerId, ownerId });
                  if (!customer) return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
                  
                  // Check if phone already exists in active customers
                  const existingActive = await Customer.findOne({ ownerId, phone: customer.phone, isDeleted: false });
                  if (existingActive) return NextResponse.json({ error: 'An active customer with this phone number already exists.' }, { status: 400 });

                  customer.isDeleted = false;
                  customer.deletedAt = undefined;
                  await customer.save();
                  return NextResponse.json({ message: 'Customer restored successfully' });
            }

            const updates = {};
            if (body.ownerName) updates.ownerName = String(body.ownerName).trim();
            if (body.shopName) updates.shopName = String(body.shopName).trim();
            if (body.phone) updates.phone = String(body.phone).replace(/\D/g, '');
            if (body.avatarUrl) updates.avatarUrl = String(body.avatarUrl).trim();
            if (body.email) updates.email = String(body.email).trim().toLowerCase();

            if (!Object.keys(updates).length) return NextResponse.json({ error: 'No updates provided' }, { status: 400 });

            const updated = await Owner.findOneAndUpdate({ _id: ownerId }, { $set: updates }, { new: true });
            const newToken = signToken(updated);
            const res = NextResponse.json({ owner: updated, token: newToken });
            res.cookies.set('token', newToken, { httpOnly: true, path: '/', sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: 7 * 24 * 60 * 60 });
            return res;
      } catch (err) {
            return NextResponse.json({ error: err.message }, { status: 500 });
      }
}
