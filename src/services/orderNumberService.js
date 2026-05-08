const db = require('../config/db');

const getFinancialYearLabel = (date = new Date()) => {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const startYear = month >= 4 ? year : year - 1;
  const endYearShort = String((startYear + 1) % 100).padStart(2, '0');
  return `FY${startYear}-${endYearShort}`;
};

const padSerial = (n) => String(n).padStart(6, '0');

const nextSellerSerials = async (conn, { sellerType, vendorId = null }) => {
  const fy = getFinancialYearLabel();
  const sellerVendorId = sellerType === 'admin' ? 0 : Number(vendorId || 0);

  await conn.execute(
    `INSERT INTO order_serial_counters
      (fy_label, seller_type, seller_vendor_id, last_order_serial, last_invoice_serial)
     VALUES (?, ?, ?, 0, 0)
     ON DUPLICATE KEY UPDATE updated_at = NOW()`,
    [fy, sellerType, sellerVendorId]
  );

  await conn.execute(
    `UPDATE order_serial_counters
     SET last_order_serial = last_order_serial + 1,
         last_invoice_serial = last_invoice_serial + 1,
         updated_at = NOW()
     WHERE fy_label = ? AND seller_type = ? AND seller_vendor_id = ?`,
    [fy, sellerType, sellerVendorId]
  );

  const [rows] = await conn.query(
    `SELECT last_order_serial, last_invoice_serial
     FROM order_serial_counters
     WHERE fy_label = ? AND seller_type = ? AND seller_vendor_id = ?`,
    [fy, sellerType, sellerVendorId]
  );
  const current = rows[0] || { last_order_serial: 1, last_invoice_serial: 1 };

  const sellerPrefix = sellerType === 'admin' ? 'ADM' : `V${sellerVendorId}`;
  const orderNumber = `${sellerPrefix}/ORD/${fy}/${padSerial(current.last_order_serial)}`;
  const invoiceNumber = `${sellerPrefix}/INV/${fy}/${padSerial(current.last_invoice_serial)}`;

  return { fy, orderNumber, invoiceNumber };
};

const saveInvoiceNumber = (conn, orderId, invoiceNumber) =>
  conn.execute(
    `INSERT INTO order_invoice_numbers (order_id, invoice_number)
     VALUES (?, ?)
     ON DUPLICATE KEY UPDATE invoice_number = VALUES(invoice_number)`,
    [orderId, invoiceNumber]
  );

module.exports = { getFinancialYearLabel, nextSellerSerials, saveInvoiceNumber };
