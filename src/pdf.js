/* ══════════════════════════════════════════════════════════
   InvoiceForge — PDF Generation
   Uses html2canvas + jsPDF to export the preview as PDF
   ══════════════════════════════════════════════════════════ */

const InvoicePDF = (() => {

  async function generate() {
    const btn = document.getElementById('btn-generate-pdf');
    const previewEl = document.getElementById('invoice-preview');

    // Show loading state
    btn.classList.add('loading');
    const btnContent = btn.querySelector('.btn-content span');
    const originalText = btnContent.textContent;
    btnContent.textContent = 'Generating...';

    try {
      // Wait a tick for any pending preview updates
      await new Promise(r => setTimeout(r, 100));

      // Capture the preview element
      const canvas = await html2canvas(previewEl, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        windowWidth: previewEl.scrollWidth,
        windowHeight: previewEl.scrollHeight
      });

      // Create PDF
      const { jsPDF } = window.jspdf;
      const imgData = canvas.toDataURL('image/png');

      // Calculate dimensions (A4)
      const pdfWidth = 210; // mm
      const pdfHeight = 297; // mm
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;

      // Scale image to fit page width with margins
      const margin = 10; // mm
      const contentWidth = pdfWidth - (margin * 2);
      const ratio = contentWidth / imgWidth;
      const contentHeight = imgHeight * ratio;

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // If content is taller than one page, we might need multiple pages
      let yOffset = margin;
      const pageContentHeight = pdfHeight - (margin * 2);

      if (contentHeight <= pageContentHeight) {
        // Fits on one page
        pdf.addImage(imgData, 'PNG', margin, margin, contentWidth, contentHeight);
      } else {
        // Multi-page
        let remainingHeight = contentHeight;
        let sourceY = 0;
        let page = 0;

        while (remainingHeight > 0) {
          if (page > 0) pdf.addPage();

          const sliceHeight = Math.min(pageContentHeight, remainingHeight);
          pdf.addImage(imgData, 'PNG', margin, margin, contentWidth, contentHeight, undefined, 'FAST', 0, -(sourceY / ratio) * (contentWidth / imgWidth));

          remainingHeight -= pageContentHeight;
          sourceY += pageContentHeight / ratio;
          page++;
        }
      }

      // Generate filename
      const formData = InvoiceForm.getFormData();
      const invNum = formData.invoice.number || 'Invoice';
      const filename = `${invNum.replace(/[^a-zA-Z0-9-]/g, '_')}.pdf`;

      // ─── Supabase Integration: Save to Cloud ───
      const { data: { user } } = await supabaseClient.auth.getUser();
      
      if (user) {
        try {
          // 1. Upload PDF to Storage
          const pdfBlob = pdf.output('blob');
          const pdfPath = `${user.id}/${Date.now()}_${filename}`;
          
          const { error: uploadError } = await supabaseClient.storage
            .from('invoices')
            .upload(pdfPath, pdfBlob);

          if (uploadError) throw uploadError;

          // Get the URL (private, but we store the path)
          const pdfUrl = pdfPath;

          // 2. Insert Invoice Metadata
          const { data: invoiceData, error: invoiceError } = await supabaseClient
            .from('invoices')
            .insert([{
              user_id: user.id,
              invoice_number: formData.invoice.number,
              currency: formData.invoice.currency,
              issue_date: formData.invoice.date,
              due_date: formData.invoice.dueDate,
              company_name: formData.company.name,
              company_email: formData.company.email,
              company_phone: formData.company.phone,
              company_address: formData.company.address,
              client_name: formData.client.name,
              client_company: formData.client.company,
              client_email: formData.client.email,
              client_phone: formData.client.phone,
              client_address: formData.client.address,
              subtotal: formData.summary.subtotal,
              tax_rate: formData.summary.taxRate,
              tax_amount: formData.summary.taxAmount,
              discount_rate: formData.summary.discountRate,
              discount_amount: formData.summary.discountAmount,
              total: formData.summary.total,
              notes: formData.notes,
              terms: formData.terms,
              logo_url: formData.company.logoStorageUrl,
              pdf_url: pdfUrl
            }])
            .select()
            .single();

          if (invoiceError) throw invoiceError;

          // 3. Insert Line Items
          const itemsToInsert = formData.items.map(item => ({
            invoice_id: invoiceData.id,
            description: item.description,
            quantity: item.quantity,
            price: item.price
          }));

          const { error: itemsError } = await supabaseClient
            .from('invoice_items')
            .insert(itemsToInsert);

          if (itemsError) throw itemsError;

          console.log('Invoice saved to Supabase successfully!');
        } catch (dbError) {
          console.error('Error saving to Supabase:', dbError.message);
          // Don't alert here to avoid interrupting the download, just log it
        }
      }

      pdf.save(filename);

    } catch (error) {
      console.error('PDF generation failed:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      // Reset button
      btn.classList.remove('loading');
      btnContent.textContent = originalText;
    }
  }

  return { generate };
})();
