import jsPDF from 'jspdf';
import { ShoppingItem } from '@/hooks/useShoppingList';

export const generateShoppingListPDF = (items: ShoppingItem[], userName?: string): jsPDF => {
  const doc = new jsPDF();
  
  // Add title
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('DAFTAR BELANJA', 105, 20, { align: 'center' });
  
  // Add user info and date
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Dibuat oleh: ${userName || 'User'}`, 20, 35);
  doc.text(`Tanggal: ${new Date().toLocaleDateString('id-ID')}`, 20, 42);
  doc.text(`Total item: ${items.length}`, 20, 49);
  
  // Add table header
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  
  const startY = 65;
  const lineHeight = 8;
  
  // Table headers
  doc.text('No', 20, startY);
  doc.text('Nama Barang', 35, startY);
  doc.text('Qty', 120, startY);
  doc.text('Unit', 140, startY);
  doc.text('Stok', 160, startY);
  doc.text('Status', 180, startY);
  
  // Draw header line
  doc.line(20, startY + 2, 190, startY + 2);
  
  // Add items
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  
  let currentY = startY + 10;
  
  items.forEach((item, index) => {
    // Check if we need a new page
    if (currentY > 270) {
      doc.addPage();
      currentY = 20;
    }
    
    const rowY = currentY;
    
    // Item number
    doc.text((index + 1).toString(), 20, rowY);
    
    // Item name (wrap if too long)
    const itemName = item.name.length > 25 ? item.name.substring(0, 25) + '...' : item.name;
    doc.text(itemName, 35, rowY);
    
    // Quantity
    doc.text(item.quantity?.toString() || '-', 120, rowY);
    
    // Unit
    doc.text(item.unit || 'pcs', 140, rowY);
    
    // Stock
    doc.text(item.current_stock?.toString() || '-', 160, rowY);
    
    // Status
    doc.text(item.is_completed ? '✓ Selesai' : '○ Pending', 180, rowY);
    
    // Add notes if available
    if (item.notes && item.notes.trim()) {
      currentY += lineHeight;
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      const notes = item.notes.length > 50 ? item.notes.substring(0, 50) + '...' : item.notes;
      doc.text(`Catatan: ${notes}`, 35, currentY);
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
    }
    
    currentY += lineHeight;
  });
  
  // Add footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(`Halaman ${i} dari ${pageCount}`, 105, 290, { align: 'center' });
    doc.text('Daftar Belanja - Toko Anjar', 105, 285, { align: 'center' });
  }
  
  return doc;
};

export const shareShoppingListPDF = async (items: ShoppingItem[], userName?: string) => {
  const pdf = generateShoppingListPDF(items, userName);
  const pdfBlob = pdf.output('blob');
  
  const pendingCount = items.filter(item => !item.is_completed).length;
  const completedCount = items.filter(item => item.is_completed).length;
  
  const message = `📝 *DAFTAR BELANJA*\n\n` +
    `📊 Total: ${items.length} item\n` +
    `⏳ Pending: ${pendingCount} item\n` +
    `✅ Selesai: ${completedCount} item\n\n` +
    `📅 ${new Date().toLocaleDateString('id-ID')}\n` +
    `🏪 Toko Anjar`;
  
  if (navigator.share && navigator.canShare({ files: [new File([pdfBlob], 'daftar-belanja.pdf', { type: 'application/pdf' })] })) {
    // Use Web Share API if available
    try {
      await navigator.share({
        title: 'Daftar Belanja',
        text: message,
        files: [new File([pdfBlob], 'daftar-belanja.pdf', { type: 'application/pdf' })]
      });
    } catch (error) {
      console.error('Error sharing:', error);
      // Fallback to WhatsApp link
      shareToWhatsApp(message, pdfBlob);
    }
  } else {
    // Fallback to WhatsApp link
    shareToWhatsApp(message, pdfBlob);
  }
};

const shareToWhatsApp = (message: string, pdfBlob: Blob) => {
  // Create download link for PDF
  const url = URL.createObjectURL(pdfBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'daftar-belanja.pdf';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  // Open WhatsApp with message
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
  window.open(whatsappUrl, '_blank');
};