
const handleThermalPrint = async () => {
try {
      // Always use browser printing directly
      // Try thermal printing first
      if (hybridThermalPrinter.isConnected()) {
        const receiptText = formatThermalReceipt(receipt, formatPrice);
        const printed = await hybridThermalPrinter.print(receiptText);
        
        if (printed) {
          toast.success('Struk berhasil dicetak ke thermal printer!');
          return;
        }
      }
      
      // Fallback to thermal printer connection attempt
      const connected = await hybridThermalPrinter.connect();
      if (connected) {
        const receiptText = formatThermalReceipt(receipt, formatPrice);
        const printed = await hybridThermalPrinter.print(receiptText);
        
        if (printed) {
          toast.success('Thermal printer terhubung dan struk berhasil dicetak!');
          return;
        }
      }
      
      // Ultimate fallback to browser printing if thermal printing fails
      toast.info('Thermal printer tidak tersedia, menggunakan printer browser...');
handlePrint();
} catch (error) {
console.error('Print error:', error);
      toast.error('Terjadi kesalahan saat mencetak.');
      toast.error('Thermal printer gagal, menggunakan printer browser...');
      handlePrint();
}
};
