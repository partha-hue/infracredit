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
            // Find a segment that looks like a phone (contains at least 6 digits) or a mostly numeric segment
            for (let i = 0; i < parts.length; i++) {
                  const seg = parts[i];
                  const digits = (seg || '').replace(/\D/g, '');
                  if (digits.length >= 6) return seg; // return the original segment (may include +91 or leading zeros)
            }
            // fallback: return second last segment if pattern like /customers/:phone/pdf
            if (parts.length >= 2) return parts[parts.length - 2];
            return null;
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

            // If still no normalization, try a relaxed lookup using the raw param (owner may have stored unnormalized phone)
            let customer = null;
            if (normalizedPhone) {
                  customer = await Customer.findOne({ ownerId, phone: normalizedPhone });
            } else {
                  const rawDigits = String(rawParam || '').replace(/\D/g, '');
                  // try exact raw param, digits only, and a contains match on digits
                  customer = await Customer.findOne({ ownerId, $or: [{ phone: rawParam }, { phone: rawDigits }, { phone: { $regex: rawDigits } }] });
            }

            if (!customer) return NextResponse.json({ error: 'Invalid phone number or customer not found' }, { status: 400 });
            // ensure we have canonical phone for filename and message
            const customerPhone = customer.phone;

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

            // Fallback: handle missing built-in AFM font by using pdf-lib (broader detection)
            try {
                  const msg = String(err?.message || '').toLowerCase();
                  const looksLikeMissingAfm = err?.code === 'ENOENT' || msg.includes('helvetica.afm') || msg.includes('no such file') || msg.includes('afm');
                  if (looksLikeMissingAfm) {
                        console.warn('PDFKit AFM missing, using pdf-lib fallback for ledger (detected error):', err?.message || err);
                        const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib');
                        const pdfDoc = await PDFDocument.create();
                        let page = pdfDoc.addPage([595, 842]);
                        const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
                        const fontSize = 12;

                        page.drawText('InfraCredit — Ledger', { x: 40, y: 800, size: 16, font: helvetica, color: rgb(0, 0.4, 0.4) });
                        page.drawText(`Customer: ${customer.name || ''}    Phone: ${customer.phone}`, { x: 40, y: 780, size: fontSize, font: helvetica });
                        page.drawText(`Current Due: ₹${customer.currentDue || 0}`, { x: 40, y: 760, size: fontSize, font: helvetica });

                        let y = 740;
                        (customer.ledger || []).forEach((e) => {
                              if (y < 80) {
                                    page = pdfDoc.addPage();
                                    y = 800;
                              }
                              const when = new Date(e.createdAt || e.date).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' });
                              page.drawText(`${when}  ${String((e.type || '').toUpperCase()).padEnd(8)} ₹${e.amount}  Due: ₹${e.balanceAfter}  ${e.note || ''}`, { x: 40, y, size: fontSize, font: helvetica });
                              y -= 18;
                        });

                        const pdfBytes = await pdfDoc.save();
                        return new NextResponse(Buffer.from(pdfBytes), { headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename=ledger-${customer.phone}.pdf` } });
                  }
            } catch (fallbackErr) {
                  console.error('Fallback pdf-lib ledger generation failed:', fallbackErr);
            }

            return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
      }
}
