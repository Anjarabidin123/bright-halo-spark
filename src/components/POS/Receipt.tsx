import React, { useEffect } from 'react';
import { Receipt as ReceiptType } from '@/types/pos';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Printer, Copy } from 'lucide-react';
import { hybridThermalPrinter } from '@/lib/hybrid-thermal-printer';
import { formatThermalReceipt, formatPrintReceipt } from '@/lib/receipt-formatter';
import { toast } from 'sonner';

interface ReceiptProps {
  receipt: ReceiptType;
  formatPrice: (price: number) => string;
  onBack?: () => void;
}

export const Receipt = ({ receipt, formatPrice, onBack }: ReceiptProps) => {
  
  // Add Enter key support for thermal printing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleThermalPrint();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleThermalPrint = async () => {
    try {
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

  const handlePrint = () => {
    const printContent = formatPrintReceipt(receipt, formatPrice);
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleCopyReceipt = () => {
    const receiptText = formatThermalReceipt(receipt, formatPrice);
    navigator.clipboard.writeText(receiptText);
    toast.success('Struk berhasil disalin ke clipboard!');
  };

  return (
    <div className="space-y-4">
      {/* Header dengan tombol kembali */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {onBack && (
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <h2 className="text-xl font-semibold">Detail Struk</h2>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleCopyReceipt}>
            <Copy className="h-4 w-4 mr-1" />
            Salin
          </Button>
          <Button onClick={handleThermalPrint} size="sm">
            <Printer className="h-4 w-4 mr-1" />
            Print Thermal
          </Button>
        </div>
      </div>

      {/* Konten struk */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Struk #{receipt.id.slice(0, 8)}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {receipt.timestamp.toLocaleString('id-ID')}
              </p>
            </div>
            <Badge variant={receipt.paymentMethod === 'tunai' ? 'default' : 'secondary'}>
              {receipt.paymentMethod || 'tunai'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {/* Toko Info */}
          <div className="text-center mb-4 pb-3 border-b">
            <h3 className="font-bold text-lg">Toko Anjar</h3>
            <p className="text-sm text-muted-foreground">
              Jalan Gajah - Dempet (Depan Koramil)
            </p>
            <p className="text-sm text-muted-foreground">
              HP: 0858-6800-3638
            </p>
          </div>

          {/* Items */}
          <div className="space-y-2 mb-4">
            {receipt.items.map((item, index) => (
              <div key={index} className="flex justify-between text-sm">
                <div className="flex-1">
                  <div className="font-medium">{item.product.name}</div>
                  <div className="text-muted-foreground">
                    {item.quantity} x {formatPrice(item.finalPrice || item.product.sellPrice)}
                  </div>
                </div>
                <div className="font-medium">
                  {formatPrice((item.finalPrice || item.product.sellPrice) * item.quantity)}
                </div>
              </div>
            ))}
          </div>

          <Separator className="my-3" />

          {/* Totals */}
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>{formatPrice(receipt.subtotal)}</span>
            </div>
            {receipt.discount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Diskon:</span>
                <span>-{formatPrice(receipt.discount)}</span>
              </div>
            )}
            <Separator className="my-2" />
            <div className="flex justify-between font-bold text-lg">
              <span>Total:</span>
              <span>{formatPrice(receipt.total)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Keuntungan:</span>
              <span>{formatPrice(receipt.profit)}</span>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-4 pt-3 border-t text-xs text-muted-foreground">
            <p>Terima kasih atas kunjungan Anda!</p>
            <p>Barang yang sudah dibeli tidak dapat dikembalikan</p>
          </div>
        </CardContent>
      </Card>

      {/* Instruksi */}
      <Card>
        <CardContent className="pt-4">
          <div className="text-sm text-muted-foreground">
            <p className="font-medium mb-2">Instruksi:</p>
            <ul className="space-y-1">
              <li>• Tekan <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Enter</kbd> untuk print thermal otomatis</li>
              <li>• Klik tombol "Print Thermal" untuk print manual</li>
              <li>• Klik "Salin" untuk menyalin teks struk</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};