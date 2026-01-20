import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Customer from '@/models/Customer';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

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

            const ownerId = new mongoose.Types.ObjectId(decoded.id);

            const data = await Customer.aggregate([
                  { $match: { ownerId, isDeleted: false } },
                  { $unwind: "$ledger" },
                  {
                        $group: {
                              _id: { $month: "$ledger.createdAt" },
                              credit: {
                                    $sum: {
                                          $cond: [{ $eq: ["$ledger.type", "credit"] }, "$ledger.amount", 0]
                                    }
                              },
                              payment: {
                                    $sum: {
                                          $cond: [{ $eq: ["$ledger.type", "payment"] }, { $abs: "$ledger.amount" }, 0]
                                    }
                              }
                        }
                  },
                  { $sort: { _id: 1 } }
            ]);

            const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

            return NextResponse.json(
                  data.map(d => ({
                        month: months[d._id - 1] || `Month ${d._id}`,
                        credit: d.credit,
                        payment: d.payment
                  }))
            );
      } catch (err) {
            console.error('Report Error:', err);
            return NextResponse.json({ error: err.message }, { status: 500 });
      }
}
