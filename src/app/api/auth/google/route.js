import { NextResponse } from 'next/server';
import Owner from '@/models/Owner';
import connectDB from '@/lib/mongodb';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

export async function POST(req) {
      try {
            await connectDB();
            const { email, name, googleId } = await req.json();

            if (!email || !name || !googleId) {
                  return NextResponse.json(
                        { error: 'email, name and googleId are required' },
                        { status: 400 }
                  );
            }

            let owner = await Owner.findOne({ email });

            if (!owner) {
                  owner = await Owner.create({
                        shopName: `${name}'s Shop`,
                        ownerName: name,
                        email,
                        passwordHash: crypto.randomBytes(32).toString('hex'),
                        provider: 'google',
                        googleId,
                  });
            }

            if (!process.env.JWT_SECRET) {
                  return NextResponse.json(
                        { error: 'Server misconfiguration' },
                        { status: 500 }
                  );
            }

            const token = jwt.sign(
                  { id: owner._id, email: owner.email },
                  process.env.JWT_SECRET,
                  { expiresIn: '7d' }
            );

            return NextResponse.json({ success: true, ownerId: owner._id, token });
      } catch (err) {
            console.error(err);
            return NextResponse.json({ error: err.message }, { status: 500 });
      }
}
