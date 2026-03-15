/* ══════════════════════════════════════════════════════════
   InvoiceForge — Live Preview Renderer
   Renders a real-time invoice preview from form data
   ══════════════════════════════════════════════════════════ */

const InvoicePreview = (() => {
  const currencySymbols = {
    USD: '$', EUR: '€', GBP: '£', JPY: '¥', CAD: 'C$', AUD: 'A$'
  };

  function fmt(amount, currency) {
    const sym = currencySymbols[currency] || '$';
    return `${sym}${amount.toFixed(2)}`;
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }

  function formatDisplayDate(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  function update() {
    const data = InvoiceForm.getFormData();
    const container = document.getElementById('invoice-preview');
    const cur = data.invoice.currency;

    const itemsHtml = data.items.map(item => `
      <tr>
        <td>${escapeHtml(item.description) || '<span style="color:#cbd5e1;font-style:italic">No description</span>'}</td>
        <td>${item.quantity}</td>
        <td>${fmt(item.price, cur)}</td>
        <td>${fmt(item.quantity * item.price, cur)}</td>
      </tr>
    `).join('');

    const logoHtml = data.company.hasLogo
      ? `<img src="${data.company.logoSrc}" alt="Company logo" />`
      : '';

    const companyDetailParts = [
      data.company.address,
      data.company.email,
      data.company.phone
    ].filter(Boolean);

    const clientDetailParts = [
      data.client.company,
      data.client.address,
      data.client.email,
      data.client.phone
    ].filter(Boolean);

    container.innerHTML = `
      <!-- Header -->
      <div class="inv-header">
        <div class="inv-brand">
          ${logoHtml}
          <div class="inv-company-name">${escapeHtml(data.company.name) || 'Your Company'}</div>
          <div class="inv-company-detail">${companyDetailParts.map(p => escapeHtml(p)).join('<br>') || 'Company details'}</div>
        </div>
        <div class="inv-title-block">
          <div class="inv-title">INVOICE</div>
          <div class="inv-meta">
            <strong>#</strong> ${escapeHtml(data.invoice.number) || 'INV-000'}<br>
            <strong>Date:</strong> ${formatDisplayDate(data.invoice.date)}<br>
            <strong>Due:</strong> ${formatDisplayDate(data.invoice.dueDate)}
          </div>
        </div>
      </div>

      <!-- Parties -->
      <div class="inv-parties">
        <div>
          <div class="inv-party-label">Bill To</div>
          <div class="inv-party-name">${escapeHtml(data.client.name) || 'Client Name'}</div>
          <div class="inv-party-detail">${clientDetailParts.map(p => escapeHtml(p)).join('<br>') || 'Client details'}</div>
        </div>
        <div>
          <div class="inv-party-label">From</div>
          <div class="inv-party-name">${escapeHtml(data.company.name) || 'Your Company'}</div>
          <div class="inv-party-detail">${companyDetailParts.map(p => escapeHtml(p)).join('<br>') || 'Company details'}</div>
        </div>
      </div>

      <!-- Items Table -->
      <table class="inv-table">
        <thead>
          <tr>
            <th>Description</th>
            <th>Qty</th>
            <th>Price</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml || '<tr><td colspan="4" style="text-align:center;color:#cbd5e1;padding:20px;">No items added</td></tr>'}
        </tbody>
      </table>

      <!-- Totals -->
      <div class="inv-totals">
        <div class="inv-total-row">
          <span>Subtotal</span>
          <span>${fmt(data.summary.subtotal, cur)}</span>
        </div>
        ${data.summary.taxRate > 0 ? `
        <div class="inv-total-row">
          <span>Tax (${data.summary.taxRate}%)</span>
          <span>${fmt(data.summary.taxAmount, cur)}</span>
        </div>` : ''}
        ${data.summary.discountRate > 0 ? `
        <div class="inv-total-row">
          <span>Discount (${data.summary.discountRate}%)</span>
          <span>–${fmt(data.summary.discountAmount, cur)}</span>
        </div>` : ''}
        <div class="inv-total-divider"></div>
        <div class="inv-total-row inv-grand-total">
          <span>Total</span>
          <span>${fmt(data.summary.total, cur)}</span>
        </div>
      </div>

      <!-- Footer -->
      ${data.notes ? `
      <div class="inv-footer">
        <div class="inv-footer-label">Notes</div>
        <div class="inv-footer-text">${escapeHtml(data.notes).replace(/\n/g, '<br>')}</div>
      </div>` : ''}
      ${data.terms ? `
      <div class="inv-footer">
        <div class="inv-footer-label">Payment Terms</div>
        <div class="inv-footer-text">${escapeHtml(data.terms).replace(/\n/g, '<br>')}</div>
      </div>` : ''}
    `;
  }

  return { update };
})();
