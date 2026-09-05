import PDFDocument from 'pdfkit';
import { env } from '../config/env.js';
import { formatMoney } from '../utils/money.js';
import type { InvoiceDocument } from '../modules/invoices/invoice.model.js';
import type { UserDocument } from '../modules/users/user.model.js';

function escapeText(value: string): string {
  return value.replace(/[\u0000-\u001f]/g, ' ').trim();
}

export async function generateInvoicePdf(
  invoice: InvoiceDocument,
  user: UserDocument,
  options: { watermark: boolean },
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const accent = invoice.template?.colorScheme || env.BRAND_ACCENT_COLOR;
    const businessName = escapeText(user.businessInfo?.businessName || env.BRAND_NAME);

    doc.fillColor(accent).fontSize(22).text(businessName, { continued: false });
    doc.fillColor('#0F1512').fontSize(10);
    if (user.businessInfo?.address) {
      doc.text(escapeText(user.businessInfo.address));
    }

    doc.moveDown();
    doc.fontSize(18).text(`Invoice ${escapeText(invoice.invoiceNumber)}`);
    doc.fontSize(10).fillColor('#555');
    doc.text(`Status: ${invoice.status}`);
    doc.text(`Issue date: ${new Date(invoice.issueDate).toISOString().slice(0, 10)}`);
    if (invoice.dueDate) {
      doc.text(`Due date: ${new Date(invoice.dueDate).toISOString().slice(0, 10)}`);
    }

    doc.moveDown();
    doc.fillColor('#0F1512').fontSize(12).text('Bill to');
    doc.fontSize(10);
    const client = invoice.clientSnapshot;
    if (client) {
      doc.text(escapeText(client.name));
      if (client.email) doc.text(escapeText(client.email));
      if (client.address) doc.text(escapeText(client.address));
    }

    doc.moveDown();
    doc.fontSize(11).text('Line items');
    doc.moveDown(0.5);

    for (const item of invoice.lineItems) {
      const lineTotal = Math.round(item.quantity * item.rate);
      doc
        .fontSize(10)
        .text(
          `${escapeText(item.description)}  ·  ${item.quantity} × ${formatMoney(item.rate, invoice.currency)} = ${formatMoney(lineTotal, invoice.currency)}`,
        );
    }

    doc.moveDown();
    doc.text(`Subtotal: ${formatMoney(invoice.subtotal, invoice.currency)}`);
    doc.text(`Tax (${invoice.taxPercentage}%): ${formatMoney(invoice.taxAmount, invoice.currency)}`);
    doc.fontSize(12).text(`Total: ${formatMoney(invoice.total, invoice.currency)}`);

    if (invoice.notes) {
      doc.moveDown();
      doc.fontSize(10).fillColor('#555').text(`Notes: ${escapeText(invoice.notes)}`);
    }

    if (invoice.signature?.value) {
      doc.moveDown();
      doc.fillColor('#0F1512').fontSize(10).text('Signature');
      if (invoice.signature.type === 'typed') {
        doc.fontSize(14).text(escapeText(invoice.signature.value));
      } else {
        doc.fontSize(9).fillColor('#555').text('(Drawn signature on file)');
      }
    }

    if (options.watermark) {
      doc
        .fontSize(10)
        .fillColor('#888')
        .text(`Made with ${env.BRAND_NAME}`, 50, doc.page.height - 50, {
          align: 'center',
          width: doc.page.width - 100,
        });
    }

    doc.end();
  });
}
