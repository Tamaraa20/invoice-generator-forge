// PDF Generation Logic

class PDFService {
    constructor() {
        this.jspdf = window.jspdf;
        this.html2canvas = window.html2canvas;
    }

    async generatePackage(data) {
        const btn = document.getElementById('btn-generate-pdf');
        const originalContent = btn.innerHTML;
        
        try {
            btn.disabled = true;
            btn.innerHTML = '<span>Processing...</span>';

            // 1. Generate PDF
            const element = document.getElementById('invoice-preview');
            const canvas = await this.html2canvas(element, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff'
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new this.jspdf.jsPDF('p', 'mm', 'a4');
            const imgProps = pdf.getImageProperties(imgData);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            
            // 2. Export / Save
            pdf.save(`invoice-${data.invoice.number || '001'}.pdf`);

            // 3. Save to Supabase if logged in
            await this.saveToDatabase(data);

        } catch (error) {
            console.error(error);
            alert("Error generating PDF: " + error.message);
        } finally {
            btn.disabled = false;
            btn.innerHTML = originalContent;
        }
    }

    async saveToDatabase(data) {
        const { data: { session } } = await window.supabaseClient.auth.getSession();
        if (!session) return; // Silent return if not logged in

        try {
            const { error } = await window.supabaseClient
                .from('invoices')
                .insert([{
                    user_id: session.user.id,
                    invoice_data: data,
                    updated_at: new Date()
                }]);

            if (error) throw error;
            console.log("Invoice synced to cloud");
        } catch (err) {
            console.error("Cloud sync failed:", err.message);
        }
    }
}

window.PDFService = PDFService;
