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

            // Fetch soft-deleted customers for restore management
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

            // Handle Restore Customer Feature
            if (body.restoreCustomerId) {
                  const customer = await Customer.findOne({ _id: body.restoreCustomerId, ownerId });
                  if (!customer) return NextResponse.json({ error: 'Customer record not found' }, { status: 404 });
                  
                  // Check for phone conflicts in active records
                  const conflict = await Customer.findOne({ ownerId, phone: customer.phone, isDeleted: false });
                  if (conflict) return NextResponse.json({ error: `An active customer with phone ${customer.phone} already exists.` }, { status: 400 });

                  customer.isDeleted = false;
                  customer.deletedAt = undefined;
                  await customer.save();
                  return NextResponse.json({ message: 'Customer restored successfully' });
            }

            // Secure profile updates
            const updates = {};
            const allowedFields = ['ownerName', 'shopName', 'phone', 'avatarUrl', 'email'];
            
            allowedFields.forEach(field => {
                  if (body[field] !== undefined) {
                        let val = String(body[field]).trim();
                        if (field === 'phone') val = val.replace(/\D/g, '');
                        if (field === 'email') val = val.toLowerCase();
                        if (val) updates[field] = val;
                  }
            });

            if (Object.keys(updates).length === 0) {
                  return NextResponse.json({ error: 'No valid data provided for update' }, { status: 400 });
            }

            // Check if email is being changed and if it's already taken
            if (updates.email) {
                  const existingEmail = await Owner.findOne({ email: updates.email, _id: { $ne: ownerId } });
                  if (existingEmail) return NextResponse.json({ error: 'Email address is already in use by another account' }, { status: 409 });
            }

            const updatedOwner = await Owner.findOneAndUpdate(
                  { _id: ownerId },
                  { $set: updates },
                  { new: true, runValidators: true }
            ).select('-passwordHash');

            if (!updatedOwner) return NextResponse.json({ error: 'Owner account not found' }, { status: 404 });

            // Re-sign token with updated info for the client
            const newToken = signToken(updatedOwner);

            const res = NextResponse.json({ 
                  owner: updatedOwner, 
                  token: newToken, 
                  message: 'Profile secured and updated successfully' 
            });

            res.cookies.set('token', newToken, {
                  httpOnly: true,
                  path: '/',
                  sameSite: 'lax',
                  secure: process.env.NODE_ENV === 'production',
                  maxAge: 7 * 24 * 60 * 60,
            });

            return res;
      } catch (err) {
            console.error('Profile update error:', err);
            return NextResponse.json({ error: err.message }, { status: 500 });
      }
}
