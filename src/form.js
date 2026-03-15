// src/form.js
import { renderPreview } from './preview.js';

let logoFile = null;
let lineItems = [{ id: Date.now(), description: '', quantity: 1, price: 0 }];

export function initForm() {
  const btnAddItem = document.getElementById('btn-add-item');
  const btnNewInvoice = document.getElementById('btn-new-invoice');
  const taxRateInput = document.getElementById('tax-rate');
  const discountRateInput = document.getElementById('discount-rate');

  // Load state from local storage or set defaults
  initDefaultDates();
  initLogoUpload();
  renderLineItems();
  setupEventListeners();

  btnAddItem?.addEventListener('click', addLineItem);
  btnNewInvoice?.addEventListener('click', resetForm);
  taxRateInput?.addEventListener('input', updateSummary);
  discountRateInput?.addEventListener('input', updateSummary);

  // Initial render
  updateSummary();
}

function initDefaultDates() {
  const dateInput = document.getElementById('invoice-date');
  const dueDateInput = document.getElementById('invoice-due-date');
  
  if (dateInput && !dateInput.value) {
    const today = new Date().toISOString().split('T')[0];
    dateInput.value = today;
  }
  
  if (dueDateInput && !dueDateInput.value) {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    dueDateInput.value = nextWeek.toISOString().split('T')[0];
  }
}

function setupEventListeners() {
  const inputs = document.querySelectorAll('#form-panel input, #form-panel textarea, #form-panel select');
  inputs.forEach(input => {
    input.addEventListener('input', () => {
      updateSummary();
    });
  });

  // Accordion logic
  const headers = document.querySelectorAll('.section-header');
  headers.forEach(header => {
    header.addEventListener('click', () => {
      const section = header.parentElement;
      const body = section.querySelector('.section-body');
      const isVisible = section.classList.contains('active');
      
      // Close others (optional, comment out for multiple open)
      // document.querySelectorAll('.form-section').forEach(s => s.classList.remove('active'));
      
      if (!isVisible) {
        section.classList.add('active');
      } else {
        section.classList.remove('active');
      }
    });
  });

  // Open first section by default
  document.querySelector('.form-section')?.classList.add('active');
}

function initLogoUpload() {
  const uploadArea = document.getElementById('logo-upload-area');
  const fileInput = document.getElementById('logo-input');
  const preview = document.getElementById('logo-preview');
  const placeholder = document.getElementById('logo-placeholder');

  uploadArea?.addEventListener('click', () => fileInput?.click());

  fileInput?.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file) {
      logoFile = file;
      const reader = new FileReader();
      reader.onload = async (event) => {
        preview.src = event.target.result;
        preview.style.display = 'block';
        placeholder.style.display = 'none';
        
        // Upload to Supabase implicitly if user is logged in
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (user) {
          const fileName = `${user.id}/${Date.now()}-${file.name}`;
          const { data, error } = await supabaseClient.storage
            .from('logos')
            .upload(fileName, file);
          
          if (!error) {
            const { data: { publicUrl } } = supabaseClient.storage
              .from('logos')
              .getPublicUrl(fileName);
            // We can store this in a hidden input or state
            preview.dataset.url = publicUrl;
          }
        }
        
        updateSummary();
      };
      reader.readAsDataURL(file);
    }
  });
}

function renderLineItems() {
  const container = document.getElementById('line-items-container');
  if (!container) return;

  container.innerHTML = '';
  lineItems.forEach((item, index) => {
    const row = document.createElement('div');
    row.className = 'item-row animate-in';
    row.style.setProperty('--delay', index * 0.05);
    row.innerHTML = `
      <div class="col-desc">
        <input type="text" placeholder="Item description..." value="${item.description}" data-id="${item.id}" class="item-desc-input" />
      </div>
      <div class="col-qty">
        <input type="number" value="${item.quantity}" min="1" data-id="${item.id}" class="item-qty-input" />
      </div>
      <div class="col-price">
        <input type="number" value="${item.price}" min="0" step="0.01" data-id="${item.id}" class="item-price-input" />
      </div>
      <div class="col-amount">
        <span>${formatCurrency(item.quantity * item.price)}</span>
      </div>
      <div class="col-action">
        <button class="btn-remove-item" data-id="${item.id}">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 3l10 10M13 3L3 13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
        </button>
      </div>
    `;
    container.appendChild(row);
  });

  // Attach listeners to new inputs
  container.querySelectorAll('input').forEach(input => {
    input.addEventListener('input', (e) => {
      const id = parseInt(e.target.dataset.id);
      const item = lineItems.find(i => i.id === id);
      if (item) {
        if (e.target.classList.contains('item-desc-input')) item.description = e.target.value;
        if (e.target.classList.contains('item-qty-input')) item.quantity = parseFloat(e.target.value) || 0;
        if (e.target.classList.contains('item-price-input')) item.price = parseFloat(e.target.value) || 0;
        updateSummary();
      }
    });

    // Special behavior for enter key to add new row
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && input.classList.contains('item-desc-input')) {
        addLineItem();
      }
    });
  });

  container.querySelectorAll('.btn-remove-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.dataset.id);
      lineItems = lineItems.filter(i => i.id !== id);
      if (lineItems.length === 0) addLineItem();
      renderLineItems();
      updateSummary();
    });
  });
}

function addLineItem() {
  lineItems.push({ id: Date.now(), description: '', quantity: 1, price: 0 });
  renderLineItems();
  // Focus new description
  const inputs = document.querySelectorAll('.item-desc-input');
  inputs[inputs.length - 1]?.focus();
}

export function updateSummary() {
  let subtotal = 0;
  lineItems.forEach(item => {
    subtotal += item.quantity * item.price;
  });

  const taxRate = parseFloat(document.getElementById('tax-rate')?.value) || 0;
  const discountRate = parseFloat(document.getElementById('discount-rate')?.value) || 0;

  const taxAmount = subtotal * (taxRate / 100);
  const discountAmount = subtotal * (discountRate / 100);
  const total = subtotal + taxAmount - discountAmount;

  document.getElementById('subtotal-display').textContent = formatCurrency(subtotal);
  document.getElementById('tax-display').textContent = formatCurrency(taxAmount);
  document.getElementById('discount-display').textContent = `–${formatCurrency(discountAmount)}`;
  document.getElementById('total-display').textContent = formatCurrency(total);

  // Sync to preview
  syncToPreview({ subtotal, taxAmount, taxRate, discountAmount, discountRate, total });
}

function syncToPreview(totals) {
  const formData = {
    company: {
      name: document.getElementById('company-name')?.value,
      email: document.getElementById('company-email')?.value,
      phone: document.getElementById('company-phone')?.value,
      address: document.getElementById('company-address')?.value,
      logo: document.getElementById('logo-preview')?.src
    },
    client: {
      name: document.getElementById('client-name')?.value,
      company: document.getElementById('client-company')?.value,
      email: document.getElementById('client-email')?.value,
      phone: document.getElementById('client-phone')?.value,
      address: document.getElementById('client-address')?.value
    },
    invoice: {
      number: document.getElementById('invoice-number')?.value,
      date: document.getElementById('invoice-date')?.value,
      dueDate: document.getElementById('invoice-due-date')?.value,
      currency: document.getElementById('invoice-currency')?.value || 'USD',
      notes: document.getElementById('invoice-notes')?.value,
      terms: document.getElementById('invoice-terms')?.value
    },
    items: lineItems,
    totals: totals
  };

  renderPreview(formData);
}

function formatCurrency(amount) {
  const currency = document.getElementById('invoice-currency')?.value || 'USD';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(amount);
}

function resetForm() {
  if (confirm('Start a new invoice? This will clear all current details.')) {
    document.querySelectorAll('#form-panel input, #form-panel textarea').forEach(input => {
      if (input.type !== 'number') input.value = '';
      else input.value = input.id.includes('rate') ? '0' : '1';
    });
    
    // Check if dates are already cleared, then re-init
    initDefaultDates();
    
    // Clear logo
    logoFile = null;
    const preview = document.getElementById('logo-preview');
    const placeholder = document.getElementById('logo-placeholder');
    if (preview) {
      preview.src = '';
      preview.style.display = 'none';
    }
    if (placeholder) placeholder.style.display = 'flex';

    lineItems = [{ id: Date.now(), description: '', quantity: 1, price: 0 }];
    renderLineItems();
    updateSummary();
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
