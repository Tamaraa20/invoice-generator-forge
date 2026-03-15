/**
 * Main Entry Point
 * Initializes all modules and globals
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Form
    const invoiceForm = new window.InvoiceForm();
    
    // 2. Initialize Preview
    const invoicePreview = new window.InvoicePreview();
    
    // 3. Setup event listeners for Global buttons
    const btnNew = document.getElementById('btn-new-invoice');
    const btnGenerate = document.getElementById('btn-generate-pdf');

    btnNew.addEventListener('click', () => {
        if(confirm("Start a new invoice? All current data will be lost.")) {
            invoiceForm.reset();
        }
    });

    btnGenerate.addEventListener('click', async () => {
        const data = invoiceForm.getData();
        const pdfService = new window.PDFService();
        await pdfService.generatePackage(data);
    });

    // 4. Initialize animations / Scroll effects
    const sections = document.querySelectorAll('.form-section');
    sections.forEach((sec, idx) => {
        sec.style.setProperty('--delay', `${idx * 0.1}s`);
    });
});
