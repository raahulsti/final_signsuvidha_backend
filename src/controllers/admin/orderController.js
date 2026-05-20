const orderModel = require('../../models/orderModel');
const { enrichOrderForPanel, enrichOrdersForPanel, getAdminSellerId } = require('../../services/orderResponseService');
const { success, notFound, paginated } = require('../../utils/response');
const { getPagination, getPaginationMeta } = require('../../utils/helpers');
const { buildInvoicePdf } = require('../../services/invoiceService');
const { sendMail } = require('../../services/emailService');

exports.getAll = async (req, res, next) => {
  try {
    const { status, vendor_id, page = 1, limit = 20 } = req.query;
    const { offset, limit: lim } = getPagination(page, limit);
    const { rows, total } = await orderModel.getAll({ status, vendorId: vendor_id, offset, limit: lim });
    return paginated(res, rows, getPaginationMeta(total, page, lim));
  } catch (err) { next(err); }
};

exports.getOne = async (req, res, next) => {
  try {
    const order = await orderModel.getById(req.params.id);
    if (!order) return notFound(res, 'Order not found');
    const enriched = await enrichOrderForPanel(order, null, await getAdminSellerId());
    return success(res, enriched);
  } catch (err) { next(err); }
};

exports.updateStatus = async (req, res, next) => {
  try {
    if (!await orderModel.getById(req.params.id)) return notFound(res, 'Order not found');
    await orderModel.updateStatus(req.params.id, req.body.status);
    return success(res, {}, 'Order status updated');
  } catch (err) { next(err); }
};

exports.downloadInvoice = async (req, res, next) => {
  try {
    const order = await orderModel.getById(req.params.id);
    if (!order) return notFound(res, 'Order not found');
    const items = await orderModel.getOrderItems(order.id);
    const { buffer, invoiceNumber } = await buildInvoicePdf({ order, items });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${invoiceNumber}.pdf"`);
    return res.status(200).send(buffer);
  } catch (err) { next(err); }
};

exports.emailInvoice = async (req, res, next) => {
  try {
    const order = await orderModel.getById(req.params.id);
    if (!order) return notFound(res, 'Order not found');

    const recipient = req.body?.email || order.customer_email;
    if (!recipient) {
      const e = new Error('Customer email not available for this order');
      e.statusCode = 400;
      throw e;
    }

    const items = await orderModel.getOrderItems(order.id);
    const { buffer, invoiceNumber } = await buildInvoicePdf({ order, items });

    await sendMail({
      to: recipient,
      subject: `Invoice ${invoiceNumber} for Order ${order.order_number}`,
      html: `
        <p>Dear ${order.customer_name || 'Customer'},</p>
        <p>Please find your invoice attached for order <b>${order.order_number}</b>.</p>
        <p>Taxable amount: <b>Rs ${Number(order.total_amount || 0).toFixed(2)}</b></p>
        <p>GST (${Number(order.gst_percent || 0).toFixed(2)}%): <b>Rs ${Number(order.gst_amount || 0).toFixed(2)}</b></p>
        <p>Grand total (incl. GST): <b>Rs ${Number(order.payable_amount != null ? order.payable_amount : Number(order.total_amount || 0) + Number(order.gst_amount || 0)).toFixed(2)}</b></p>
        <p>Thanks,<br/>SignSuvidha Team</p>
      `,
      attachments: [
        {
          filename: `${invoiceNumber}.pdf`,
          content: buffer,
          contentType: 'application/pdf',
        },
      ],
    });

    return success(res, { email: recipient, invoice_number: invoiceNumber }, 'Invoice emailed successfully');
  } catch (err) { next(err); }
};
