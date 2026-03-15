// Invoice Preview Renderer

class InvoicePreview {
    constructor() {
        this.container = document.getElementById('invoice-preview');
        this.init();
    }

    init() {
        window.addEventListener('invoiceUpdate', (e) => this.render(e.detail));
        this.renderInitial();
    }

    renderInitial() {
        this.container.innerHTML = `<div class="p-empty">Complete the form to see preview</div>`;
        this.container.style.display = 'flex';
        this.container.style.alignItems = 'center';
        this.container.style.justifyContent = 'center';
    }

    render(data) {
        this.container.style.display = 'block';
        this.container.innerHTML = `
            <div class="p-header">
                <div class="p-logo-box">
                    ${data.company.logo ? `<img src="${data.company.logo}" class="p-logo" />` : ''}
                    <div class="p-company-info">
                        <div class="p-name">${data.company.name || 'Your Company'}</div>
                        <div class="p-value">${data.company.address || ''}</div>
                        <div class="p-value">${data.company.email || ''}</div>
                    </div>
                </div>
                <div class="p-title">
                    <h1>INVOICE</h1>
                    <p># ${data.invoice.number || '---'}</p>
                </div>
            </div>

            <div class="p-grid">
                <div class="p-bill-to">
                    <div class="p-label">Bill To</div>
                    <div class="p-name">${data.client.name || 'Client Name'}</div>
                    <div class="p-value">${data.client.company || ''}</div>
                    <div class="p-value">${data.client.address || ''}</div>
                </div>
                <div class="p-details">
                    <div class="p-label">Details</div>
                    <div class="p-value"><strong>Date:</strong> ${data.invoice.date || '---'}</div>
                    <div class="p-value"><strong>Due Date:</strong> ${data.invoice.dueDate || '---'}</div>
                    <div class="p-value"><strong>Currency:</strong> ${data.invoice.currency}</div>
                </div>
            </div>

            <table class="p-table">
                <thead>
                    <tr>
                        <th>Description</th>
                        <th class="t-right">Qty</th>
                        <th class="t-right">Price</th>
                        <th class="t-right">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.items.map(item => `
                        <tr>
                            <td>${item.description || '---'}</td>
                            <td class="t-right">${item.quantity}</td>
                            <td class="t-right">${item.price}</td>
                            <td class="t-right"><strong>${this.formatVal(item.amount, data.invoice.currency)}</strong></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>

            <div class="p-summary">
                <div class="s-row">
                    <span>Subtotal</span>
                    <span>${data.totals.subtotal}</span>
                </div>
                <div class="s-row">
                    <span>Tax</span>
                    <span>${data.totals.tax}</span>
                </div>
                <div class="s-row">
                    <span>Discount</span>
                    <span>${data.totals.discount}</span>
                </div>
                <div class="s-total">
                    <div class="s-row">
                        <strong>TOTAL</strong>
                        <span class="s-val">${data.totals.total}</span>
                    </div>
                </div>
            </div>

            <div class="p-footer">
                ${data.invoice.notes ? `
                    <div class="p-notes-title">Notes</div>
                    <div class="p-notes-val">${data.invoice.notes}</div>
                ` : ''}
                ${data.invoice.terms ? `
                    <div class="p-notes-title" style="margin-top: 20px;">Terms</div>
                    <div class="p-notes-val">${data.invoice.terms}</div>
                ` : ''}
            </div>
        `;
    }

    formatVal(val, cur) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: cur || 'USD'
        }).format(val);
    }
}

window.InvoicePreview = InvoicePreview;
