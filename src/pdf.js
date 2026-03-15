// src/pdf.js
export async function generatePDF() {
  const { jsPDF } = window.jspdf;
  const element = document.getElementById('invoice-preview');
  
  if (!element) return;

  // Prepare for capture
  // Some styles might need adjustment for canvas
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
    windowWidth: element.scrollWidth,
    windowHeight: element.scrollHeight
  });

  const imgData = canvas.toDataURL('image/jpeg', 1.0);
  const pdf = new jsPDF('p', 'mm', 'a4');
  
  const imgProps = pdf.getImageProperties(imgData);
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

  pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
  
  const invoiceNumber = document.getElementById('invoice-number')?.value || 'invoice';
  const fileName = `${invoiceNumber}.pdf`;
  
  // 1. Download locally
  pdf.save(fileName);

  // 2. Optional: Save to Supabase DB & Storage
  await saveToSupabase(pdf, fileName);
}

async function saveToSupabase(pdf, fileName) {
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (!session) return; // Only save if user is logged in

  try {
    const user = session.user;
    const blob = pdf.output('blob');
    const storagePath = `${user.id}/${Date.now()}-${fileName}`;

    // Upload PDF to storage
    const { data: uploadData, error: uploadError } = await supabaseClient.storage
      .from('invoices')
      .upload(storagePath, blob);

    if (uploadError) throw uploadError;

    // Get public URL (or signed URL depending on bucket privacy)
    // Here we assume private bucket and just store the path
    
    // Insert record into DB
    const invoiceData = {
      user_id: user.id,
      invoice_number: document.getElementById('invoice-number')?.value || 'INV-001',
      currency: document.getElementById('invoice-currency')?.value || 'USD',
      issue_date: document.getElementById('invoice-date')?.value,
      due_date: document.getElementById('invoice-due-date')?.value,
      company_name: document.getElementById('company-name')?.value,
      company_email: document.getElementById('company-email')?.value,
      company_address: document.getElementById('company-address')?.value,
      client_name: document.getElementById('client-name')?.value,
      client_email: document.getElementById('client-email')?.value,
      client_address: document.getElementById('client-address')?.value,
      subtotal: parseFloat(document.getElementById('subtotal-display')?.textContent.replace(/[^0-9.-]+/g, "")) || 0,
      total: parseFloat(document.getElementById('total-display')?.textContent.replace(/[^0-9.-]+/g, "")) || 0,
      pdf_url: storagePath
    };

    const { error: dbError } = await supabaseClient
      .from('invoices')
      .insert([invoiceData]);

    if (dbError) throw dbError;
    
    console.log('Invoice saved to Supabase successfully');

  } catch (err) {
    console.error('Error saving invoice metadata:', err);
  }
}
