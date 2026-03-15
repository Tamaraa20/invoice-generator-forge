// Form Management
class InvoiceForm {
  constructor() {
    this.lineItems = [];
    this.form = document.getElementById('form-panel');
    this.itemsContainer = document.getElementById('line-items-container');
    this.btnAddItem = document.getElementById('btn-add-item');
    
    this.init();
  }

  init() {
    this.btnAddItem.onclick = () => this.addLineItem();
    this.addLineItem(); // Initial item
    
    // Global listeners for calculations
    this.form.addEventListener('input', () => this.calculateTotals());
    
    // Logo Upload
    const logoArea = document.getElementById('logo-upload-area');
    const logoInput = document.getElementById('logo-input');
    const logoPreview = document.getElementById('logo-preview');
    const logoPlaceholder = document.getElementById('logo-placeholder');

    logoArea.onclick = () => logoInput.click();
    logoInput.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (re) => {
          logoPreview.src = re.target.result;
          logoPreview.classList.add('active');
          logoPlaceholder.style.display = 'none';
          this.calculateTotals(); // Trigger preview update
        };
        reader.readAsDataURL(file);
      }
    };
  }

  addLineItem() {
    const id = Date.now();
    const item = {
      id,
      description: '',
      quantity: 1,
      price: 0
    };
    this.lineItems.push(item);
    this.renderItem(item);
  }

  renderItem(item) {
    const row = document.createElement('div');
    row.className = 'item-row animate-in';
    row.dataset.id = item.id;
    row.innerHTML = `
      <div class="col-desc">
        <input type="text" class="item-description" placeholder="Item description..." />
      </div>
      <div class="col-qty">
        <input type="number" class="item-qty" value="1" min="1" />
      </div>
      <div class="col-price">
        <input type="number" class="item-price" value="0" min="0" step="0.01" />
      </div>
      <div class="col-amount">
        <span class="item-amount">$0.00</span>
      </div>
      <div class="col-action">
        <button class="btn-remove-item" title="Remove">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 3l10 10M13 3L3 13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
        </button>
      </div>
    `;

    row.querySelector('.btn-remove-item').onclick = () => this.removeItem(item.id, row);
    this.itemsContainer.appendChild(row);
  }

  removeItem(id, element) {
    if (this.lineItems.length <= 1) return;
    this.lineItems = this.lineItems.filter(i => i.id !== id);
    element.classList.add('remove');
    setTimeout(() => element.remove(), 300);
    this.calculateTotals();
  }

  calculateTotals() {
    let subtotal = 0;
    const rows = this.itemsContainer.querySelectorAll('.item-row');
    
    rows.forEach(row => {
      const qty = parseFloat(row.querySelector('.item-qty').value) || 0;
      const price = parseFloat(row.querySelector('.item-price').value) || 0;
      const amount = qty * price;
      subtotal += amount;
      row.querySelector('.item-amount').textContent = this.formatCurrency(amount);
    });

    const taxRate = parseFloat(document.getElementById('tax-rate').value) || 0;
    const discountRate = parseFloat(document.getElementById('discount-rate').value) || 0;
    
    const taxAmount = subtotal * (taxRate / 100);
    const discountAmount = subtotal * (discountRate / 100);
    const total = subtotal + taxAmount - discountAmount;

    document.getElementById('subtotal-display').textContent = this.formatCurrency(subtotal);
    document.getElementById('tax-display').textContent = this.formatCurrency(taxAmount);
    document.getElementById('discount-display').textContent = '-' + this.formatCurrency(discountAmount);
    document.getElementById('total-display').textContent = this.formatCurrency(total);

    // Broadcast change for preview
    const event = new CustomEvent('invoiceUpdate', { detail: this.getData() });
    window.dispatchEvent(event);
  }

  formatCurrency(value) {
    const currency = document.getElementById('invoice-currency').value || 'USD';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(value);
  }

  getData() {
    const rows = Array.from(this.itemsContainer.querySelectorAll('.item-row')).map(row => ({
      description: row.querySelector('.item-description').value,
      quantity: row.querySelector('.item-qty').value,
      price: row.querySelector('.item-price').value,
      amount: parseFloat(row.querySelector('.item-qty').value) * parseFloat(row.querySelector('.item-price').value)
    }));

    return {
      company: {
        name: document.getElementById('company-name').value,
        email: document.getElementById('company-email').value,
        phone: document.getElementById('company-phone').value,
        address: document.getElementById('company-address').value,
        logo: document.getElementById('logo-preview').src
      },
      client: {
        name: document.getElementById('client-name').value,
        company: document.getElementById('client-company').value,
        email: document.getElementById('client-email').value,
        phone: document.getElementById('client-phone').value,
        address: document.getElementById('client-address').value
      },
      invoice: {
        number: document.getElementById('invoice-number').value,
        date: document.getElementById('invoice-date').value,
        dueDate: document.getElementById('invoice-due-date').value,
        currency: document.getElementById('invoice-currency').value,
        notes: document.getElementById('invoice-notes').value,
        terms: document.getElementById('invoice-terms').value
      },
      items: rows,
      totals: {
        subtotal: document.getElementById('subtotal-display').textContent,
        tax: document.getElementById('tax-display').textContent,
        discount: document.getElementById('discount-display').textContent,
        total: document.getElementById('total-display').textContent
      }
    };
  }

  reset() {
      // Logic for new invoice
      this.form.reset();
      this.itemsContainer.innerHTML = '';
      this.lineItems = [];
      this.addLineItem();
      // Reset logo
      const logoPreview = document.getElementById('logo-preview');
      const logoPlaceholder = document.getElementById('logo-placeholder');
      logoPreview.src = '';
      logoPreview.classList.remove('active');
      logoPlaceholder.style.display = 'flex';
      this.calculateTotals();
  }
}

window.InvoiceForm = InvoiceForm;
