/* ══════════════════════════════════════════════════════════
   InvoiceForge — Form Logic
   Handles accordion sections, logo upload, line items,
   and summary calculations
   ══════════════════════════════════════════════════════════ */

const InvoiceForm = (() => {
  let lineItems = [];
  let nextItemId = 1;

  // ─── Currency symbols ───
  const currencySymbols = {
    USD: '$', EUR: '€', GBP: '£', JPY: '¥', CAD: 'C$', AUD: 'A$'
  };

  function getCurrencySymbol() {
    const sel = document.getElementById('invoice-currency');
    return currencySymbols[sel?.value || 'USD'];
  }

  // ─── Accordion Toggle ───
  function initAccordion() {
    document.querySelectorAll('.section-header[data-toggle]').forEach(header => {
      header.addEventListener('click', () => {
        const section = header.closest('.form-section');
        section.classList.toggle('collapsed');
      });
    });
  }

  // ─── Logo Upload ───
  let uploadedLogoUrl = null;

  function initLogoUpload() {
    const area = document.getElementById('logo-upload-area');
    const input = document.getElementById('logo-input');
    const placeholder = document.getElementById('logo-placeholder');
    const preview = document.getElementById('logo-preview');

    placeholder.addEventListener('click', () => input.click());
    preview.addEventListener('click', () => input.click());

    input.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      // 1. Show local preview immediately
      const reader = new FileReader();
      reader.onload = (ev) => {
        preview.src = ev.target.result;
        preview.classList.add('visible');
        placeholder.style.display = 'none';
        InvoicePreview.update();
      };
      reader.readAsDataURL(file);

      // 2. Upload to Supabase Storage
      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
        const filePath = `company-logos/${fileName}`;

        const { data, error } = await supabaseClient.storage
          .from('logos')
          .upload(filePath, file);

        if (error) throw error;

        // Get public URL
        const { data: { publicUrl } } = supabaseClient.storage
          .from('logos')
          .getPublicUrl(filePath);

        uploadedLogoUrl = publicUrl;
        console.log('Logo uploaded to Supabase:', uploadedLogoUrl);
      } catch (err) {
        console.error('Error uploading logo:', err.message);
        // Fallback or alert user
      }
    });
  }

  // ─── Line Items ───
  function createLineItem() {
    const id = nextItemId++;
    const item = { id, description: '', quantity: 1, price: 0 };
    lineItems.push(item);
    renderLineItem(item);
    updateSummary();
    InvoicePreview.update();
    return item;
  }

  function renderLineItem(item) {
    const container = document.getElementById('line-items-container');
    const row = document.createElement('div');
    row.className = 'line-item-row';
    row.dataset.itemId = item.id;

    row.innerHTML = `
      <input type="text" placeholder="Item description" class="item-desc" value="${escapeHtml(item.description)}" />
      <input type="number" placeholder="1" class="item-qty" value="${item.quantity}" min="0" step="1" />
      <input type="number" placeholder="0.00" class="item-price" value="${item.price || ''}" min="0" step="0.01" />
      <span class="item-amount">${formatCurrency(item.quantity * item.price)}</span>
      <button class="remove-item-btn" title="Remove item">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
      </button>
    `;

    // Event listeners
    const descInput = row.querySelector('.item-desc');
    const qtyInput = row.querySelector('.item-qty');
    const priceInput = row.querySelector('.item-price');
    const removeBtn = row.querySelector('.remove-item-btn');
    const amountSpan = row.querySelector('.item-amount');

    const updateRow = () => {
      item.description = descInput.value;
      item.quantity = parseFloat(qtyInput.value) || 0;
      item.price = parseFloat(priceInput.value) || 0;
      amountSpan.textContent = formatCurrency(item.quantity * item.price);
      updateSummary();
      InvoicePreview.update();
    };

    descInput.addEventListener('input', updateRow);
    qtyInput.addEventListener('input', updateRow);
    priceInput.addEventListener('input', updateRow);

    removeBtn.addEventListener('click', () => {
      row.classList.add('removing');
      setTimeout(() => {
        row.remove();
        lineItems = lineItems.filter(i => i.id !== item.id);
        updateSummary();
        InvoicePreview.update();
      }, 300);
    });

    container.appendChild(row);
  }

  function getLineItems() {
    return lineItems;
  }

  // ─── Summary Calculations ───
  function getSubtotal() {
    return lineItems.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  }

  function updateSummary() {
    const subtotal = getSubtotal();
    const taxRate = parseFloat(document.getElementById('tax-rate')?.value) || 0;
    const discountRate = parseFloat(document.getElementById('discount-rate')?.value) || 0;


    const taxAmount = subtotal * (taxRate / 100);
    const discountAmount = subtotal * (discountRate / 100);
    const total = subtotal + taxAmount - discountAmount;

    const sym = getCurrencySymbol();
    document.getElementById('subtotal-display').textContent = `${sym}${subtotal.toFixed(2)}`;
    document.getElementById('tax-display').textContent = `${sym}${taxAmount.toFixed(2)}`;
    document.getElementById('discount-display').textContent = `–${sym}${discountAmount.toFixed(2)}`;
    document.getElementById('total-display').textContent = `${sym}${total.toFixed(2)}`;
  }

  function getSummaryData() {
    const subtotal = getSubtotal();
    const taxRate = parseFloat(document.getElementById('tax-rate')?.value) || 0;
    const discountRate = parseFloat(document.getElementById('discount-rate')?.value) || 0;
    const taxAmount = subtotal * (taxRate / 100);
    const discountAmount = subtotal * (discountRate / 100);
    const total = subtotal + taxAmount - discountAmount;
    return { subtotal, taxRate, taxAmount, discountRate, discountAmount, total };
  }

  // ─── Collect All Form Data ───
  function getFormData() {
    return {
      company: {
        name: val('company-name'),
        email: val('company-email'),
        phone: val('company-phone'),
        address: val('company-address'),
        logoSrc: document.getElementById('logo-preview')?.src || '',
        logoStorageUrl: uploadedLogoUrl,
        hasLogo: document.getElementById('logo-preview')?.classList.contains('visible')
      },
      client: {
        name: val('client-name'),
        company: val('client-company'),
        email: val('client-email'),
        phone: val('client-phone'),
        address: val('client-address')
      },
      invoice: {
        number: val('invoice-number'),
        currency: document.getElementById('invoice-currency')?.value || 'USD',
        date: val('invoice-date'),
        dueDate: val('invoice-due-date')
      },
      items: lineItems,
      summary: getSummaryData(),
      notes: val('invoice-notes'),
      terms: val('invoice-terms')
    };
  }

  // ─── Helpers ───
  function val(id) {
    return document.getElementById(id)?.value || '';
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function formatCurrency(amount) {
    const sym = getCurrencySymbol();
    return `${sym}${amount.toFixed(2)}`;
  }

  // ─── Auto-generate invoice number ───
  function generateInvoiceNumber() {
    const now = new Date();
    const num = `INV-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;
    document.getElementById('invoice-number').value = num;
  }

  // ─── Set default dates ───
  function setDefaultDates() {
    const today = new Date();
    const due = new Date(today);
    due.setDate(due.getDate() + 30);

    document.getElementById('invoice-date').value = formatDate(today);
    document.getElementById('invoice-due-date').value = formatDate(due);
  }

  function formatDate(d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  // ─── Init ───
  function init() {
    initAccordion();
    initLogoUpload();
    generateInvoiceNumber();
    setDefaultDates();

    // Add first line item
    createLineItem();

    // Add item button
    document.getElementById('btn-add-item').addEventListener('click', () => createLineItem());

    // Tax/discount inputs
    document.getElementById('tax-rate').addEventListener('input', () => { updateSummary(); InvoicePreview.update(); });
    document.getElementById('discount-rate').addEventListener('input', () => { updateSummary(); InvoicePreview.update(); });

    // Currency change
    document.getElementById('invoice-currency').addEventListener('change', () => {
      updateSummary();
      // Update all line item amounts
      document.querySelectorAll('.line-item-row').forEach(row => {
        const qty = parseFloat(row.querySelector('.item-qty').value) || 0;
        const price = parseFloat(row.querySelector('.item-price').value) || 0;
        row.querySelector('.item-amount').textContent = formatCurrency(qty * price);
      });
      InvoicePreview.update();
    });

    // Listen to all form inputs for live preview
    document.querySelectorAll('#form-panel input, #form-panel textarea, #form-panel select').forEach(el => {
      el.addEventListener('input', debounce(() => InvoicePreview.update(), 150));
    });

    // New invoice button
    document.getElementById('btn-new-invoice').addEventListener('click', resetForm);
  }

  function resetForm() {
    // Clear all text/email/tel inputs
    document.querySelectorAll('#form-panel input[type="text"], #form-panel input[type="email"], #form-panel input[type="tel"], #form-panel textarea').forEach(el => {
      el.value = '';
    });
    // Reset logo
    const preview = document.getElementById('logo-preview');
    preview.classList.remove('visible');
    preview.src = '';
    document.getElementById('logo-placeholder').style.display = '';
    document.getElementById('logo-input').value = '';

    // Reset line items
    document.getElementById('line-items-container').innerHTML = '';
    lineItems = [];
    nextItemId = 1;

    // Reset tax/discount
    document.getElementById('tax-rate').value = 0;
    document.getElementById('discount-rate').value = 0;

    // Re-initialize
    generateInvoiceNumber();
    setDefaultDates();
    createLineItem();
    updateSummary();
    InvoicePreview.update();
  }

  function debounce(fn, ms) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), ms);
    };
  }

  return { init, getFormData, getLineItems, getCurrencySymbol };
})();
