const PDFDocument = require('pdfkit');

const toMoney = (value) => Number(value || 0).toFixed(2);

const collectPdfBuffer = (doc) =>
  new Promise((resolve, reject) => {
    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });

const drawRow = (doc, y, cols) => {
  const [c1, c2, c3, c4] = cols;
  doc.fontSize(10).text(c1, 40, y, { width: 220 });
  doc.text(c2, 270, y, { width: 70, align: 'right' });
  doc.text(c3, 350, y, { width: 90, align: 'right' });
  doc.text(c4, 450, y, { width: 100, align: 'right' });
};

const buildInvoicePdf = async ({ order, items }) => {
  const doc = new PDFDocument({ size: 'A4', margin: 40 });
  const bufferPromise = collectPdfBuffer(doc);
  const invoiceNumber = order.invoice_number || `INV-${order.order_number || order.id}`;

  const gstPercent = Number(order.gst_percent || 0);
  const gstAmount = Number(order.gst_amount || 0);
  const taxableAmount = Number(order.total_amount || 0);
  const payableRaw = order.payable_amount;
  const payableAmount =
    payableRaw != null && payableRaw !== ''
      ? Number(payableRaw)
      : taxableAmount + gstAmount;

  const sellerType = order.seller_type || (order.vendor_id ? 'vendor' : 'admin');
  const sellerLabel =
    sellerType === 'vendor'
      ? `Vendor${order.vendor_name ? ` — ${order.vendor_name}` : ''}`
      : 'Company (Admin)';

  doc.fillColor('#111111').fontSize(20).text('SignSuvidha Invoice', { align: 'left' });
  doc.moveDown(0.2);
  doc.fontSize(10).fillColor('#666666').text('Professional signage services');
  doc.moveDown(1.2);

  doc.fontSize(11).fillColor('#111111');
  doc.text(`Invoice No: ${invoiceNumber}`);
  doc.text(`Order No: ${order.order_number || '-'}`);
  doc.text(`Order Date: ${new Date(order.created_at).toLocaleString('en-IN')}`);
  doc.text(`Status: ${order.status || '-'}`);
  doc.text(`Seller: ${sellerLabel}`);
  if (order.payment_transaction_id) {
    doc.text(`Payment ref: ${order.payment_transaction_id}`);
  }
  doc.moveDown(1);

  doc.fontSize(12).text('Bill To', { underline: true });
  doc.moveDown(0.3);
  doc.fontSize(10);
  doc.text(order.customer_name || '-');
  doc.text(order.customer_email || '-');
  if (order.customer_phone) doc.text(order.customer_phone);
  doc.moveDown(1);

  doc.fontSize(12).text('Items', { underline: true });
  doc.moveDown(0.4);
  const tableTop = doc.y;
  drawRow(doc, tableTop, ['Product', 'Qty', 'Unit Price', 'Amount']);
  doc.moveTo(40, tableTop + 14).lineTo(555, tableTop + 14).strokeColor('#d9d9d9').stroke();

  let y = tableTop + 22;
  items.forEach((it) => {
    const product = it.product_name || it.product_type_name || `Product #${it.product_type_id}`;
    drawRow(doc, y, [product, String(it.quantity || 0), `Rs ${toMoney(it.unit_price)}`, `Rs ${toMoney(it.total_price)}`]);
    y += 18;
    if (y > 720) {
      doc.addPage();
      y = 50;
    }
  });

  doc.moveTo(40, y + 5).lineTo(555, y + 5).strokeColor('#d9d9d9').stroke();
  y += 16;
  drawRow(doc, y, ['', '', 'Subtotal (items)', `Rs ${toMoney(order.subtotal)}`]);
  y += 18;
  drawRow(doc, y, ['', '', 'Shipping', `Rs ${toMoney(order.shipping_cost)}`]);
  y += 18;
  doc.font('Helvetica-Bold');
  drawRow(doc, y, ['', '', 'Taxable amount', `Rs ${toMoney(taxableAmount)}`]);
  doc.font('Helvetica');
  y += 18;
  if (gstPercent > 0 || gstAmount > 0) {
    drawRow(doc, y, ['', '', `GST (${gstPercent.toFixed(2)}%)`, `Rs ${toMoney(gstAmount)}`]);
    y += 18;
    doc.font('Helvetica-Bold');
    drawRow(doc, y, ['', '', 'Grand total (incl. GST)', `Rs ${toMoney(payableAmount)}`]);
    doc.font('Helvetica');
  } else {
    doc.font('Helvetica-Bold');
    drawRow(doc, y, ['', '', 'Total', `Rs ${toMoney(taxableAmount)}`]);
    doc.font('Helvetica');
  }

  doc.moveDown(3);
  doc.fontSize(9).fillColor('#666666').text(
    gstPercent > 0 || gstAmount > 0
      ? 'This is a computer-generated tax invoice. GST is shown as charged on this order. Grand total includes GST.'
      : 'This is a computer-generated invoice. For payment gateway integration, transaction details are attached post-confirmation.',
    40,
    doc.y,
    { width: 515 }
  );

  doc.end();
  return { buffer: await bufferPromise, invoiceNumber };
};

module.exports = { buildInvoicePdf };
