// src/preview.js
export function renderPreview(data) {
  const container = document.getElementById('invoice-preview');
  if (!container) return;

  const { company, client, invoice, items, totals } = data;
  const currencySymbol = getCurrencySymbol(invoice.currency);

  container.innerHTML = `
    <div style="font-family: 'Inter', sans-serif; color: #1e293b; height: 100%; display: flex; flex-direction: column;">
      
      <!-- Header -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px;">
        <div>
          ${company.logo ? `<img src="${company.logo}" alt="Logo" style="max-height: 60px; max-width: 180px; margin-bottom: 15px; display: block;">` : ''}
          <h1 style="font-size: 24px; font-weight: 800; color: #0f172a; margin: 0;">INVOICE</h1>
          <p style="color: #64748b; font-size: 14px; margin-top: 4px;">#${invoice.number || '---'}</p>
        </div>
        <div style="text-align: right;">
          <h2 style="font-size: 16px; font-weight: 700; margin: 0;">${company.name || 'Your Company'}</h2>
          <p style="font-size: 13px; color: #64748b; white-space: pre-line; margin-top: 5px;">${company.address || ''}</p>
          <p style="font-size: 13px; color: #64748b;">${company.email || ''}</p>
          <p style="font-size: 13px; color: #64748b;">${company.phone || ''}</p>
        </div>
      </div>

      <!-- Info Grid -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px;">
        <div>
          <h3 style="font-size: 12px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 10px;">Bill To</h3>
          <p style="font-size: 15px; font-weight: 700; margin: 0;">${client.name || 'Client Name'}</p>
          <p style="font-size: 14px; color: #64748b; margin: 2px 0;">${client.company || ''}</p>
          <p style="font-size: 13px; color: #64748b; white-space: pre-line;">${client.address || ''}</p>
        </div>
        <div style="text-align: right;">
          <div style="margin-bottom: 10px;">
             <span style="font-size: 12px; font-weight: 700; color: #94a3b8; text-transform: uppercase;">Date:</span>
             <span style="font-size: 14px; margin-left: 8px;">${formatDate(invoice.date)}</span>
          </div>
          <div>
             <span style="font-size: 12px; font-weight: 700; color: #94a3b8; text-transform: uppercase;">Due Date:</span>
             <span style="font-size: 14px; margin-left: 8px; font-weight: 600;">${formatDate(invoice.dueDate)}</span>
          </div>
        </div>
      </div>

      <!-- Items Table -->
      <div style="flex: 1;">
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="border-bottom: 2px solid #f1f5f9;">
              <th style="padding: 12px 0; text-align: left; font-size: 12px; font-weight: 700; color: #94a3b8; text-transform: uppercase;">Description</th>
              <th style="padding: 12px 10px; text-align: center; font-size: 12px; font-weight: 700; color: #94a3b8; text-transform: uppercase; width: 60px;">Qty</th>
              <th style="padding: 12px 10px; text-align: right; font-size: 12px; font-weight: 700; color: #94a3b8; text-transform: uppercase; width: 100px;">Price</th>
              <th style="padding: 12px 0; text-align: right; font-size: 12px; font-weight: 700; color: #94a3b8; text-transform: uppercase; width: 100px;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${items.map(item => `
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 15px 0; font-size: 14px;">${item.description || 'New Item'}</td>
                <td style="padding: 15px 10px; font-size: 14px; text-align: center;">${item.quantity}</td>
                <td style="padding: 15px 10px; font-size: 14px; text-align: right;">${formatCurrency(item.price, invoice.currency)}</td>
                <td style="padding: 15px 0; font-size: 14px; font-weight: 600; text-align: right;">${formatCurrency(item.quantity * item.price, invoice.currency)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <!-- Footer Summary -->
      <div style="margin-top: 40px; display: flex; justify-content: flex-end;">
        <div style="width: 240px;">
          <div style="display: flex; justify-content: space-between; padding: 5px 0; font-size: 14px; color: #64748b;">
            <span>Subtotal</span>
            <span>${formatCurrency(totals.subtotal, invoice.currency)}</span>
          </div>
          ${totals.taxAmount > 0 ? `
            <div style="display: flex; justify-content: space-between; padding: 5px 0; font-size: 14px; color: #64748b;">
              <span>Tax (${totals.taxRate}%)</span>
              <span>${formatCurrency(totals.taxAmount, invoice.currency)}</span>
            </div>
          ` : ''}
          ${totals.discountAmount > 0 ? `
            <div style="display: flex; justify-content: space-between; padding: 5px 0; font-size: 14px; color: #64748b;">
              <span>Discount (${totals.discountRate}%)</span>
              <span style="color: #f43f5e;">-${formatCurrency(totals.discountAmount, invoice.currency)}</span>
            </div>
          ` : ''}
          <div style="display: flex; justify-content: space-between; padding: 15px 0; margin-top: 10px; border-top: 2px solid #f1f5f9; font-size: 18px; font-weight: 800; color: #0f172a;">
            <span>Total</span>
            <span>${formatCurrency(totals.total, invoice.currency)}</span>
          </div>
        </div>
      </div>

      <!-- Notes -->
      ${invoice.notes || invoice.terms ? `
        <div style="margin-top: 60px; padding-top: 20px; border-top: 1px solid #f1f5f9;">
          ${invoice.notes ? `
            <div style="margin-bottom: 15px;">
              <h4 style="font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; margin-bottom: 5px;">Notes</h4>
              <p style="font-size: 12px; color: #64748b; line-height: 1.6; white-space: pre-line;">${invoice.notes}</p>
            </div>
          ` : ''}
          ${invoice.terms ? `
            <div>
              <h4 style="font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; margin-bottom: 5px;">Terms & Conditions</h4>
              <p style="font-size: 12px; color: #64748b; line-height: 1.6; white-space: pre-line;">${invoice.terms}</p>
            </div>
          ` : ''}
        </div>
      ` : ''}

    </div>
  `;
}

function formatDate(dateStr) {
  if (!dateStr) return '---';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

function formatCurrency(amount, currency) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD'
  }).format(amount);
}

function getCurrencySymbol(currency) {
  const symbols = {
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'JPY': '¥',
    'CAD': 'C$',
    'AUD': 'A$'
  };
  return symbols[currency] || '$';
}
