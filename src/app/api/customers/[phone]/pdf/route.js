import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Customer from '@/models/Customer';
import jwt from 'jsonwebtoken';
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

function normalizeIndianMobile(rawPhone) {
      if (!rawPhone) return null;
      let digits = String(rawPhone).replace(/\D/g, '');
      if (digits.startsWith('0091') && digits.length - 4 >= 10) digits = digits.slice(4);
      else if (digits.startsWith('91') && digits.length - 2 >= 10) digits = digits.slice(2);
      else if (digits.startsWith('0') && digits.length - 1 >= 10) digits = digits.slice(1);
      return digits.length === 10 ? digits : null;
}

export async function GET(req, { params }) {
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
            // Handle both Next.js 14 and 15+ param styles
            const resolvedParams = await params;
            const rawParam = resolvedParams.phone;
            
            if (!rawParam) return NextResponse.json({ error: 'Phone missing' }, { status: 400 });

            const normalizedPhone = normalizeIndianMobile(rawParam) || rawParam;
            const customer = await Customer.findOne({ 
                  ownerId, 
                  $or: [{ phone: normalizedPhone }, { phone: rawParam }],
                  isDeleted: false
            }).populate('ownerId', 'shopName ownerName');

            if (!customer) return NextResponse.json({ error: 'Customer not found' }, { status: 404 });

            // Use pdf-lib
            const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib');
            const pdfDoc = await PDFDocument.create();
            let page = pdfDoc.addPage([595, 842]); // A4
            const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
            const fontReg = await pdfDoc.embedFont(StandardFonts.Helvetica);

            // Header
            page.drawText('InfraCredit Statement', { x: 50, y: 800, size: 22, font: fontBold, color: rgb(0.06, 0.65, 0.63) });
            page.drawText(customer.ownerId?.shopName || 'Business Statement', { x: 50, y: 775, size: 14, font: fontBold });
            
            // Info Section
            page.drawText(`Customer: ${customer.name}`, { x: 50, y: 740, size: 12, font: fontReg });
            page.drawText(`Phone: ${customer.phone}`, { x: 50, y: 725, size: 12, font: fontReg });
            page.drawText(`Date: ${new Date().toLocaleDateString()}`, { x: 400, y: 740, size: 12, font: fontReg });
            page.drawText(`Total Due: Rs. ${customer.currentDue}`, { x: 400, y: 725, size: 12, font: fontBold, color: rgb(0.8, 0.1, 0.1) });

            // Table Header
            let y = 680;
            page.drawRectangle({ x: 50, y: y - 5, width: 500, height: 25, color: rgb(0.95, 0.95, 0.95) });
            page.drawText('Date', { x: 60, y, size: 11, font: fontBold });
            page.drawText('Description', { x: 150, y, size: 11, font: fontBold });
            page.drawText('Type', { x: 350, y, size: 11, font: fontBold });
            page.drawText('Amount', { x: 450, y, size: 11, font: fontBold });
            y -= 30;

            // Transactions
            const ledger = customer.ledger || [];
            for (const item of ledger) {
                  if (y < 60) {
                        page = pdfDoc.addPage([595, 842]);
                        y = 780;
                  }
                  const dateStr = new Date(item.createdAt || item.date).toLocaleDateString('en-IN');
                  page.drawText(dateStr, { x: 60, y, size: 10, font: fontReg });
                  page.drawText(item.note || '-', { x: 150, y, size: 10, font: fontReg, maxWidth: 180 });
                  page.drawText(item.type === 'credit' ? 'UDHAAR' : 'PAYMENT', { 
                        x: 350, y, size: 10, font: fontBold, 
                        color: item.type === 'credit' ? rgb(0.8, 0.4, 0) : rgb(0.1, 0.6, 0.1) 
                  });
                  page.drawText(`Rs. ${Math.abs(item.amount)}`, { x: 450, y, size: 10, font: fontBold });
                  
                  y -= 20;
                  // Horizontal line
                  page.drawLine({ start: { x: 50, y: y + 5 }, end: { x: 550, y: y + 5 }, thickness: 0.5, color: rgb(0.9, 0.9, 0.9) });
            }

            // Footer
            page.drawText('Thank you for your business. Generated via InfraCredit App.', { 
                  x: 50, y: 30, size: 8, font: fontReg, color: rgb(0.5, 0.5, 0.5) 
            });

            const pdfBytes = await pdfDoc.save();
            
            return new NextResponse(pdfBytes, {
                  headers: {
                        'Content-Type': 'application/pdf',
                        'Content-Disposition': `attachment; filename="Ledger_${customer.phone}.pdf"`,
                        'Cache-Control': 'no-store, max-age=0'
                  },
            });
      } catch (err) {
            console.error('PDF generation error:', err);
            return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
      }
}
