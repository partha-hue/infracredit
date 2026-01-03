import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Customer from '@/models/Customer';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import PDFDocument from 'pdfkit';

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

      if (digits.startsWith('0091') && digits.length - 4 >= 10) {
            digits = digits.slice(4);
      } else if (digits.startsWith('91') && digits.length - 2 >= 10) {
            digits = digits.slice(2);
      } else if (digits.startsWith('0') && digits.length - 1 >= 10) {
            digits = digits.slice(1);
      }

      if (!/^[6-9]\d{9}$/.test(digits)) {
            if (digits.length === 10) return digits;
            return null;
      }
      return digits;
}

function extractPhoneFromReq(req, params) {
      if (params && params.phone) return params.phone;
      try {
            const url = new URL(req.url, 'http://localhost');
            const parts = url.pathname.split('/').filter(Boolean);
            return parts.length ? parts[parts.length - 1] : null;
      } catch (e) {
            return null;
      }
}

export async function GET(req, { params }) {
      try {
            await dbConnect();

            if (!process.env.JWT_SECRET) {
                  return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
            }

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

            // get phone
            const rawParam = extractPhoneFromReq(req, params);
            if (!rawParam) return NextResponse.json({ error: 'Phone parameter is missing' }, { status: 400 });

            let normalizedPhone = normalizeIndianMobile(rawParam);
            if (!normalizedPhone) {
                  const rawDigits = String(rawParam || '').replace(/\D/g, '');
                  if (rawDigits.length === 10) normalizedPhone = rawDigits;
            }
            if (!normalizedPhone) return NextResponse.json({ error: 'Invalid phone number' }, { status: 400 });

            const customer = await Customer.findOne({ ownerId, phone: normalizedPhone });
            if (!customer) return NextResponse.json({ error: 'Customer not found' }, { status: 404 });

            // parse query param `type` to choose ledger or invoice
            const url = new URL(req.url);
            const type = url.searchParams.get('type') || 'ledger';

            if (type === 'invoice') {
                  // For invoice, create a simple GST-style invoice with currentDue
                  const doc = new PDFDocument({ size: 'A4', margin: 40 });
                  const buffers = [];
                  doc.on('data', buffers.push.bind(buffers));

                  // Header
                  doc.fontSize(18).fillColor('#0ea5a2').text('InfraCredit — GST Invoice', { align: 'center' });
                  doc.moveDown(0.5);

                  doc.fontSize(12).fillColor('#94a3b8');
                  doc.text(`Customer: ${customer.name || ''}`);
                  doc.text(`Phone: ${customer.phone}`);
                  doc.text(`Invoice No: GST-${Date.now()}`);
                  doc.moveDown(0.5);

                  const base = Number(customer.currentDue || 0);
                  const gst = +(base * 0.18).toFixed(2);
                  const total = +(base + gst).toFixed(2);

                  doc.fontSize(12).fillColor('#cbd5e1');
                  doc.text(`Base Amount: ₹${base}`);
                  doc.text(`GST (18%): ₹${gst}`);
                  doc.text(`Total Amount: ₹${total}`);

                  doc.end();
                  await new Promise((res) => doc.on('end', res));
                  const pdf = Buffer.concat(buffers);
                  return new NextResponse(pdf, { headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename=invoice-${customer.phone}.pdf` } });
            }

            // Default: ledger PDF
            const doc = new PDFDocument({ size: 'A4', margin: 40 });
            const buffers = [];
            doc.on('data', buffers.push.bind(buffers));

            // Branding header
            doc.rect(0, 0, doc.page.width, 86).fill('#071025').fillColor('white');
            doc.fontSize(20).fillColor('white').text('InfraCredit', 48, 24);
            doc.fontSize(10).fillColor('#cbd5e1').text('Digital Khata', 48, 48);

            doc.moveDown(3);

            // Customer block
            doc.fillColor('black').moveDown(1);
            doc.fontSize(12).text(`Customer: ${customer.name || ''}`, { continued: true }).text(`    Phone: ${customer.phone}`, { align: 'right' });
            doc.moveDown(0.5);
            doc.text(`Current Due: ₹${customer.currentDue || 0}`);
            doc.moveDown(0.5);

            // Table header
            doc.fontSize(11).fillColor('#0f172a');
            doc.text('Date', 48, doc.y, { width: 90 });
            doc.text('Type', 150, doc.y, { width: 70 });
            doc.text('Amount', 230, doc.y, { width: 80 });
            doc.text('Balance', 320, doc.y, { width: 80 });
            doc.text('Note', 410, doc.y, { width: doc.page.width - 420 });
            doc.moveDown(0.5);

            // Entries
            doc.fontSize(10).fillColor('#0f172a');
            (customer.ledger || []).forEach((e) => {
                  const date = new Date(e.createdAt || e.date).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' });
                  doc.text(date, 48, doc.y, { width: 90 });
                  doc.text((e.type || '').toUpperCase(), 150, doc.y, { width: 70 });
                  doc.text(`₹${e.amount}`, 230, doc.y, { width: 80 });
                  doc.text(`₹${e.balanceAfter}`, 320, doc.y, { width: 80 });
                  doc.text(e.note || '-', 410, doc.y, { width: doc.page.width - 420 });
                  doc.moveDown(0.5);

                  // add page if near bottom
                  if (doc.y > doc.page.height - 80) doc.addPage();
            });

            doc.end();
            await new Promise((resolve, reject) => { doc.on('end', resolve); doc.on('error', reject); });
            const pdf = Buffer.concat(buffers);

            return new NextResponse(pdf, {
                  headers: {
                        'Content-Type': 'application/pdf',
                        'Content-Disposition': `attachment; filename=ledger-${customer.phone}.pdf`,
                  },
            });
      } catch (err) {
            console.error('PDF generation error:', err);
            return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
      }
}
