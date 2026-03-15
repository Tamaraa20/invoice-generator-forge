// src/main.js
import { initForm } from './form.js';
import { generatePDF } from './pdf.js';

document.addEventListener('DOMContentLoaded', () => {
    console.log('InvoiceForge initialized');
    
    // Initialize Form and Preview
    initForm();

    // PDF Generation
    const btnGenerate = document.getElementById('btn-generate-pdf');
    btnGenerate?.addEventListener('click', async () => {
        btnGenerate.disabled = true;
        const originalText = btnGenerate.querySelector('span').textContent;
        btnGenerate.querySelector('span').textContent = 'Generating...';
        
        try {
            await generatePDF();
        } catch (error) {
            console.error('PDF Generation failed:', error);
            alert('Failed to generate PDF. Please try again.');
        } finally {
            btnGenerate.disabled = false;
            btnGenerate.querySelector('span').textContent = originalText;
        }
    });

    // Add subtle reveal animations
    const sections = document.querySelectorAll('.form-section');
    sections.forEach((s, i) => {
        s.style.setProperty('--delay', i);
    });
});
