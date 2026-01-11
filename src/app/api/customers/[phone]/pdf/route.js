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
      const original = String(rawPhone);
      let digits = original.replace(/\D/g, '');
      if (digits.startsWith('0091') && digits.length - 4 >= 10) digits = digits.slice(4);
      else if (digits.startsWith('91') && digits.length - 2 >= 10) digits = digits.slice(2);
      else if (digits.startsWith('0') && digits.length - 1 >= 10) digits = digits.slice(1);
      return digits.length === 10 ? digits : null;
}

function extractPhoneFromReq(req, params) {
      if (params && params.phone) return params.phone;
      try {
            const url = new URL(req.url);
            const parts = url.pathname.split('/').filter(Boolean);
            for (let i = 0; i < parts.length; i++) {
                  const digits = parts[i].replace(/\D/g, '');
                  if (digits.length >= 6) return parts[i];
            }
            return parts[parts.length - 2] || null;
      } catch (e) { return null; }
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
            const rawParam = extractPhoneFromReq(req, params);
            if (!rawParam) return NextResponse.json({ error: 'Phone missing' }, { status: 400 });

            const normalizedPhone = normalizeIndianMobile(rawParam) || rawParam;
            const customer = await Customer.findOne({ ownerId, $or: [{ phone: normalizedPhone }, { phone: rawParam }] });

            if (!customer) return NextResponse.json({ error: 'Customer not found' }, { status: 400 });

            // Use pdf-lib directly because pdfkit is failing due to missing system fonts (AFM) on Vercel
            const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib');
            const pdfDoc = await PDFDocument.create();
            let page = pdfDoc.addPage([595, 842]); // A4
            const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
            const fontReg = await pdfDoc.embedFont(StandardFonts.Helvetica);

            page.drawText('InfraCredit Statement', { x: 50, y: 800, size: 20, font, color: rgb(0.06, 0.65, 0.63) });
            page.drawText(`Customer: ${customer.name || 'N/A'}`, { x: 50, y: 770, size: 12, font: fontReg });
            page.drawText(`Phone: ${customer.phone}`, { x: 50, y: 755, size: 12, font: fontReg });
            page.drawText(`Current Due: Rs. ${customer.currentDue || 0}`, { x: 50, y: 740, size: 12, font });

            let y = 710;
            page.drawText('Date', { x: 50, y, size: 11, font });
            page.drawText('Type', { x: 150, y, size: 11, font });
            page.drawText('Amount', { x: 230, y, size: 11, font });
            page.drawText('Note', { x: 320, y, size: 11, font });
            y -= 20;

            (customer.ledger || []).forEach((e) => {
                  if (y < 50) {
                        page = pdfDoc.addPage();
                        y = 800;
                  }
                  const date = new Date(e.createdAt || e.date).toLocaleDateString();
                  page.drawText(date, { x: 50, y, size: 10, font: fontReg });
                  page.drawText((e.type || '').toUpperCase(), { x: 150, y, size: 10, font: fontReg });
                  page.drawText(`Rs. ${e.amount}`, { x: 230, y, size: 10, font: fontReg });
                  page.drawText(e.note || '-', { x: 320, y, size: 10, font: fontReg });
                  y -= 15;
            });

            const pdfBytes = await pdfDoc.save();
            return new NextResponse(Buffer.from(pdfBytes), {
                  headers: {
                        'Content-Type': 'application/pdf',
                        'Content-Disposition': `attachment; filename=ledger-${customer.phone}.pdf`,
                  },
            });
      } catch (err) {
            console.error('PDF error:', err);
            return NextResponse.json({ error: err.message }, { status: 500 });
      }
}
