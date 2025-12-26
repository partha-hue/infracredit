import PDFDocument from 'pdfkit';
import path from 'path';
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

      doc.registerFont('Roboto', fontPath);
      doc.font('Roboto');

      doc.fontSize(18).text('GST INVOICE', { align: 'center' });
      doc.moveDown();

      doc.fontSize(12).text(`Customer: ${body.customer}`);
      doc.text(`Invoice No: GST-${Date.now()}`);
      doc.text(`Base Amount: ₹${body.amount}`);

      const gst = body.amount * 0.18;
      doc.text(`GST (18%): ₹${gst.toFixed(2)}`);
      doc.text(`Total Amount: ₹${(body.amount + gst).toFixed(2)}`);

      doc.end();

      await new Promise(resolve => doc.on('end', resolve));

      const pdf = Buffer.concat(buffers);

      return new NextResponse(pdf, {
            headers: {
                  'Content-Type': 'application/pdf',
                  'Content-Disposition': 'attachment; filename=gst-invoice.pdf',
            },
      });
}
