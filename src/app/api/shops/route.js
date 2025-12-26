import { NextRequest, NextResponse } from 'next/server';

export async function POST(request) {
      const { phone, customerPhone, amount, description } = await request.json();

      console.log('Add sale:', { phone, customerPhone, amount, description });

      return NextResponse.json({
            success: true,
            message: `₹${amount} added to ${customerPhone} ledger`
      });
}
