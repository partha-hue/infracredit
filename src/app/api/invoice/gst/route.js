import PDFDocument from 'pdfkit';
import path from 'path';
import fs from 'fs';
import { NextResponse } from 'next/server';

export async function POST(req) {
      const body = await req.json();

      const fontPath = path.join(
            process.cwd(),
            'public',
            'fonts',
            'Roboto-Regular.ttf'
      );

      const doc = new PDFDocument({ size: 'A4', margin: 40 });
      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));

      try {
            // Register custom font only if it exists; fall back to built-in font otherwise
            if (fs.existsSync(fontPath)) {
                  try {
                        doc.registerFont('Roboto', fontPath);
                        doc.font('Roboto');
                  } catch (err) {
                        console.warn('Failed to register custom font, falling back to default. Font path:', fontPath, err);
                        // continue with default font
                  }
            } else {
                  console.warn('Custom font not found at', fontPath, '— using PDF default font');
            }

            doc.fontSize(18).fillColor('#0ea5a2').text('GST INVOICE', { align: 'center' });
            doc.moveDown();

            doc.fontSize(12).fillColor('#374151').text(`Customer: ${body.customer}`);
            doc.text(`Invoice No: GST-${Date.now()}`);
            doc.text(`Base Amount: ₹${body.amount}`);

            const gst = Number(body.amount || 0) * 0.18;
            doc.text(`GST (18%): ₹${gst.toFixed(2)}`);
            doc.text(`Total Amount: ₹${(Number(body.amount || 0) + gst).toFixed(2)}`);

            doc.end();

            await new Promise((resolve, reject) => {
                  doc.on('end', resolve);
                  doc.on('error', reject);
            });

            const pdf = Buffer.concat(buffers);

            return new NextResponse(pdf, {
                  headers: {
                        'Content-Type': 'application/pdf',
                        'Content-Disposition': `attachment; filename=gst-invoice-${Date.now()}.pdf`,
                  },
            });
      } catch (err) {
            console.error('GST invoice generation error:', err);
            try {
                  // ensure the document is closed to free resources
                  doc.end();
            } catch (_) { }
            return NextResponse.json({ error: err.message || 'Failed to generate invoice PDF' }, { status: 500 });
      }
}
