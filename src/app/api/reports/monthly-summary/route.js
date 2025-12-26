import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Customer from '@/models/Customer';

export async function GET() {
      await dbConnect();

      const data = await Customer.aggregate([
            {
                  $group: {
                        _id: { $month: "$createdAt" },
                        totalCredit: { $sum: "$credit" },
                        totalPaid: { $sum: "$paid" }
                  }
            },
            { $sort: { _id: 1 } }
      ]);

      return NextResponse.json(
            data.map(d => ({
                  month: d._id,
                  credit: d.totalCredit,
                  paid: d.totalPaid
            }))
      );
}
