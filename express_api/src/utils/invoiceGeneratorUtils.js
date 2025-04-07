// utils/invoiceGenerator.js
/**
 * Fungsi untuk generate nomor invoice dengan format INV-YYYYMMDD-XXXX
 * @returns {string} Nomor invoice yang digenerate
 */
export const generateInvoiceNumber = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const dateStr = `${year}${month}${day}`;
    
    // Generate random number untuk bagian akhir invoice
    const randomNum = Math.floor(1000 + Math.random() * 9000); // Generate 4 digit number
    
    return `INV-${dateStr}-${randomNum}`;
  };