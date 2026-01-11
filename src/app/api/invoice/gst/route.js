import { NextResponse } from 'next/server';

export async function POST(req) {
      try {
            const body = await req.json();

            // Use pdf-lib directly because pdfkit is failing due to missing system fonts (AFM) on Vercel
            const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib');
            const pdfDoc = await PDFDocument.create();
            const page = pdfDoc.addPage([595, 842]); // A4
            const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
            const fontReg = await pdfDoc.embedFont(StandardFonts.Helvetica);

            page.drawText('GST INVOICE', { x: 230, y: 800, size: 18, font: fontBold, color: rgb(0.06, 0.65, 0.63) });
            
            page.drawText(`Customer: ${body.customer || 'N/A'}`, { x: 50, y: 760, size: 12, font: fontReg });
            page.drawText(`Invoice No: GST-${Date.now()}`, { x: 50, y: 740, size: 12, font: fontReg });
            page.drawText(`Date: ${new Date().toLocaleDateString()}`, { x: 50, y: 720, size: 12, font: fontReg });

            const baseAmount = Number(body.amount || 0);
            const gst = baseAmount * 0.18;
            const total = baseAmount + gst;

            page.drawText('Description', { x: 50, y: 680, size: 12, font: fontBold });
            page.drawText('Amount', { x: 450, y: 680, size: 12, font: fontBold });
            
            page.drawText('Base Amount', { x: 50, y: 660, size: 12, font: fontReg });
            page.drawText(`Rs. ${baseAmount.toFixed(2)}`, { x: 450, y: 660, size: 12, font: fontReg });

            page.drawText('GST (18%)', { x: 50, y: 640, size: 12, font: fontReg });
            page.drawText(`Rs. ${gst.toFixed(2)}`, { x: 450, y: 640, size: 12, font: fontReg });

            page.drawText('Total Amount', { x: 50, y: 610, size: 14, font: fontBold });
            page.drawText(`Rs. ${total.toFixed(2)}`, { x: 450, y: 610, size: 14, font: fontBold });

            const pdfBytes = await pdfDoc.save();
            return new NextResponse(Buffer.from(pdfBytes), {
                  headers: {
                        'Content-Type': 'application/pdf',
                        'Content-Disposition': `attachment; filename=gst-invoice-${Date.now()}.pdf`,
                  },
            });
      } catch (err) {
            console.error('GST Invoice PDF error:', err);
            return NextResponse.json({ error: err.message }, { status: 500 });
      }
}
