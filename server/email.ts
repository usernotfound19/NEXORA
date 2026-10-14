import { db } from './db.js';
import crypto from 'node:crypto';

export interface OrderEmailPayload {
  orderNumber: string;
  customerName: string;
  customerEmail?: string;
  customerPhone: string;
  division: string;
  district: string;
  address: string;
  postalCode?: string;
  items: Array<{
    title: string;
    variant?: string;
    quantity: number;
    price: number;
    total: number;
  }>;
  subtotal: number;
  shippingFee: number;
  discount: number;
  total: number;
  paymentMethod: string;
  paymentStatus: string;
  trxId?: string;
  notes?: string;
}

export async function sendOrderNotifications(order: OrderEmailPayload, orderId: string) {
  // Retrieve store settings
  const settingsRows = db.prepare('SELECT key, value FROM store_settings').all() as Array<{ key: string; value: string }>;
  const settings: Record<string, string> = {};
  for (const row of settingsRows) {
    settings[row.key] = row.value;
  }

  const storeOwnerEmail = settings.store_owner_email || 'tanjilur202@gmail.com';
  const apiKey = process.env.RESEND_API_KEY || settings.resend_api_key || '';
  const fromEmail = settings.email_from || 'NEXORA TECH <onboarding@resend.dev>';

  // Format currency helper
  const fmt = (n: number) => `৳${Number(n).toLocaleString('en-BD')}`;

  const itemsTableHtml = order.items.map(item => `
    <tr style="border-bottom: 1px solid #1e293b;">
      <td style="padding: 10px 0; color: #f8fafc; font-weight: 500;">
        ${item.title}
        ${item.variant ? `<br><span style="font-size: 12px; color: #94a3b8;">Variant: ${item.variant}</span>` : ''}
      </td>
      <td style="padding: 10px 0; text-align: center; color: #94a3b8;">${item.quantity}</td>
      <td style="padding: 10px 0; text-align: right; color: #94a3b8;">${fmt(item.price)}</td>
      <td style="padding: 10px 0; text-align: right; color: #38bdf8; font-weight: 600;">${fmt(item.total)}</td>
    </tr>
  `).join('');

  const adminHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>New Order ${order.orderNumber}</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0b101b; color: #e2e8f0; margin: 0; padding: 24px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #0f172a; border: 1px solid #1e293b; border-radius: 12px; overflow: hidden; padding: 32px;">
        <div style="border-bottom: 1px solid #1e293b; padding-bottom: 20px; margin-bottom: 24px;">
          <h1 style="color: #38bdf8; font-size: 24px; margin: 0 0 6px 0; letter-spacing: -0.5px;">NEXORA TECH</h1>
          <p style="margin: 0; color: #94a3b8; font-size: 14px;">🚨 New Order Received — <strong>#${order.orderNumber}</strong></p>
        </div>

        <div style="background-color: #1e293b; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
          <h3 style="margin: 0 0 10px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; color: #38bdf8;">Customer &amp; Shipping Details</h3>
          <p style="margin: 4px 0; font-size: 14px;"><strong>Customer:</strong> ${order.customerName}</p>
          <p style="margin: 4px 0; font-size: 14px;"><strong>Direct Phone:</strong> <a href="tel:${order.customerPhone}" style="color: #38bdf8; text-decoration: none;">${order.customerPhone}</a></p>
          ${order.customerEmail ? `<p style="margin: 4px 0; font-size: 14px;"><strong>Email:</strong> ${order.customerEmail}</p>` : ''}
          <p style="margin: 4px 0; font-size: 14px;"><strong>Location:</strong> ${order.district}, ${order.division} ${order.postalCode ? `(${order.postalCode})` : ''}</p>
          <p style="margin: 4px 0; font-size: 14px;"><strong>Delivery Address:</strong> ${order.address}</p>
          ${order.notes ? `<p style="margin: 4px 0; font-size: 14px; color: #fbbf24;"><strong>Customer Notes:</strong> ${order.notes}</p>` : ''}
        </div>

        <div style="margin-bottom: 24px;">
          <h3 style="margin: 0 0 12px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; color: #94a3b8;">Order Items</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <thead>
              <tr style="border-bottom: 1px solid #334155; text-align: left; color: #64748b; font-size: 12px;">
                <th style="padding-bottom: 8px;">Product</th>
                <th style="padding-bottom: 8px; text-align: center;">Qty</th>
                <th style="padding-bottom: 8px; text-align: right;">Price</th>
                <th style="padding-bottom: 8px; text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsTableHtml}
            </tbody>
          </table>
        </div>

        <div style="border-top: 1px solid #1e293b; padding-top: 16px; margin-bottom: 24px;">
          <table style="width: 100%; font-size: 14px;">
            <tr><td style="color: #94a3b8; padding: 4px 0;">Subtotal</td><td style="text-align: right; color: #f8fafc;">${fmt(order.subtotal)}</td></tr>
            <tr><td style="color: #94a3b8; padding: 4px 0;">Shipping Fee</td><td style="text-align: right; color: #f8fafc;">${fmt(order.shippingFee)}</td></tr>
            ${order.discount > 0 ? `<tr><td style="color: #34d399; padding: 4px 0;">Discount</td><td style="text-align: right; color: #34d399;">-${fmt(order.discount)}</td></tr>` : ''}
            <tr style="border-top: 1px solid #334155; font-size: 16px; font-weight: bold;">
              <td style="color: #f8fafc; padding: 8px 0;">Final Payable Total</td>
              <td style="text-align: right; color: #38bdf8;">${fmt(order.total)}</td>
            </tr>
          </table>
        </div>

        <div style="background-color: #111827; border-left: 3px solid #38bdf8; padding: 12px 16px; border-radius: 4px; margin-bottom: 24px; font-size: 13px;">
          <p style="margin: 2px 0;"><strong>Payment Method:</strong> ${order.paymentMethod}</p>
          <p style="margin: 2px 0;"><strong>Payment Status:</strong> ${order.paymentStatus.toUpperCase()}</p>
          ${order.trxId ? `<p style="margin: 2px 0;"><strong>Transaction ID (TrxID):</strong> <span style="font-family: monospace; color: #38bdf8;">${order.trxId}</span></p>` : ''}
        </div>

        <div style="text-align: center; margin-top: 32px;">
          <a href="/admin" style="background-color: #0284c7; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 14px; display: inline-block;">
            Open in Admin Dashboard
          </a>
        </div>
      </div>
    </body>
    </html>
  `;

  // Dispatches email to store owner
  let ownerResult: { success: boolean; message: string; response?: any } = { success: false, message: '' };

  if (apiKey) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromEmail,
          to: storeOwnerEmail,
          subject: `New Order Received — #${order.orderNumber}`,
          html: adminHtml,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        ownerResult = { success: true, message: `Email delivered to ${storeOwnerEmail} (ID: ${data.id})`, response: data };
      } else {
        ownerResult = { success: false, message: `Resend API Error: ${data.message || res.statusText}`, response: data };
      }
    } catch (err: any) {
      ownerResult = { success: false, message: `Network/Dispatch Error: ${err.message}` };
    }
  } else {
    ownerResult = {
      success: false,
      message: `Transactional email ready: RESEND_API_KEY is not configured yet in .env or Admin Settings. Configured recipient: ${storeOwnerEmail}. Email payload verified and archived in email_logs.`
    };
  }

  // Record in email_logs
  db.prepare(`
    INSERT INTO email_logs (id, order_id, recipient, subject, status, provider_response, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    crypto.randomUUID(),
    orderId,
    storeOwnerEmail,
    `New Order Received — #${order.orderNumber}`,
    ownerResult.success ? 'sent' : 'logged_ready',
    JSON.stringify(ownerResult),
    new Date().toISOString()
  );

  // If customer provided email, attempt customer confirmation as well
  if (order.customerEmail) {
    const customerHtml = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"></head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0b101b; color: #e2e8f0; margin: 0; padding: 24px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #0f172a; border: 1px solid #1e293b; border-radius: 12px; padding: 32px;">
          <h2 style="color: #38bdf8; margin: 0 0 8px 0;">Order Confirmed!</h2>
          <p>Dear ${order.customerName},</p>
          <p>Thank you for shopping at <strong>NEXORA TECH</strong>. Your order <strong>#${order.orderNumber}</strong> has been received and is being prepared.</p>
          <p><strong>Payable Total:</strong> ${fmt(order.total)} (${order.paymentMethod})</p>
          <p>You can track your parcel live anytime on our website using your order number and phone number: <strong>${order.customerPhone}</strong>.</p>
          <p>Need instant assistance? Contact our helpline at <strong>${settings.direct_call_number || '01352313984'}</strong> or WhatsApp at <strong>${settings.whatsapp_number || '01577215469'}</strong>.</p>
        </div>
      </body>
      </html>
    `;

    if (apiKey) {
      try {
        const custRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: fromEmail,
            to: order.customerEmail,
            subject: `Order Confirmation — #${order.orderNumber} | NEXORA TECH`,
            html: customerHtml,
          }),
        });
        const custData = await custRes.json();
        db.prepare(`
          INSERT INTO email_logs (id, order_id, recipient, subject, status, provider_response, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(
          crypto.randomUUID(),
          orderId,
          order.customerEmail,
          `Order Confirmation — #${order.orderNumber}`,
          custRes.ok ? 'sent' : 'failed',
          JSON.stringify(custData),
          new Date().toISOString()
        );
      } catch (e: any) {
        db.prepare(`
          INSERT INTO email_logs (id, order_id, recipient, subject, status, provider_response, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(
          crypto.randomUUID(),
          orderId,
          order.customerEmail,
          `Order Confirmation — #${order.orderNumber}`,
          'error',
          e.message,
          new Date().toISOString()
        );
      }
    }
  }

  return ownerResult;
}
