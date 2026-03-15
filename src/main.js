/* ══════════════════════════════════════════════════════════
   InvoiceForge — Main Entry Point
   Initializes all modules on DOM ready
   ══════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize form (accordion, logo upload, line items, summary)
  InvoiceForm.init();

  // Initial preview render
  InvoicePreview.update();

  // Generate PDF button
  document.getElementById('btn-generate-pdf').addEventListener('click', () => {
    InvoicePDF.generate();
  });

  // Intersection Observer for scroll-triggered animations
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.animationPlayState = 'running';
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1 }
  );

  document.querySelectorAll('.animate-in').forEach(el => {
    observer.observe(el);
  });
});
