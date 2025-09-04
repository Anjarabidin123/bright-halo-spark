import { useEffect } from 'react';
import { Receipt as ReceiptType } from '@/types/pos';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Printer, Download, Bluetooth, ArrowLeft } from 'lucide-react';
import { bluetoothPrinter } from '@/lib/bluetooth-printer';
import { formatThermalReceipt, formatPrintReceipt, formatMobileA4PrintReceipt } from '@/lib/receipt-formatter';
import { toast } from 'sonner';
import { BluetoothInstructions } from './BluetoothInstructions';

interface ReceiptProps {
  receipt: ReceiptType;
  formatPrice: (price: number) => string;
  onBack?: () => void;
}

export const Receipt = ({ receipt, formatPrice, onBack }: ReceiptProps) => {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        handleThermalPrint();
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [receipt]);

  const handleThermalPrint = async () => {
    try {
      // Always use browser printing directly
      handlePrint();
    } catch (error) {
      console.error('Print error:', error);
      toast.error('Terjadi kesalahan saat mencetak.');
    }
  };

  const handleConnectPrinter = async () => {
    try {
      const connected = await bluetoothPrinter.connect();
      if (connected) {
        toast.success(`Printer ${bluetoothPrinter.getPlatform()} terhubung!`);
      } else {
        toast.error('Gagal menghubungkan printer bluetooth.');
      }
    } catch (error) {
      console.error('Connection error:', error);
      toast.error('Terjadi kesalahan saat menghubungkan printer.');
    }
  };

  const handleMobileA4Print = () => {
    const printContent = formatMobileA4PrintReceipt(receipt, formatPrice);

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Struk Penjualan - ${receipt.id}</title>
            <style>
              body { margin: 0; padding: 0; font-family: Arial, sans-serif; }
              @media print {
                body { margin: 0; padding: 0; }
                @page { 
                  margin: 10mm;
                  size: A4;
                }
              }
            </style>
          </head>
          <body>
            ${printContent}
            <script>
              window.onload = function() {
                setTimeout(function() {
                  window.print();
                  setTimeout(function() {
                    window.close();
                  }, 1000);
                }, 500);
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const handlePrint = () => {
    const printContent = formatPrintReceipt(receipt, formatPrice);

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Struk Penjualan - ${receipt.id}</title>
            <style>
              body { margin: 0; padding: 20px; }
              @media print {
                body { margin: 0; }
              }
            </style>
          </head>
          <body>
            ${printContent}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <div className="space-y-4">
      {onBack && (
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-xl font-semibold">Struk Penjualan</h2>
        </div>
      )}
      <Card className="pos-card max-w-md mx-auto">
      <CardHeader className="text-center pb-4">
        <h2 className="text-xl font-bold">Toko Anjar Fotocopy & ATK</h2>
        <p className="text-sm text-muted-foreground">
          Jl. Raya Gajah - Dempet (depan Koramil Gajah)
        </p>
        <p className="text-sm text-muted-foreground">
          Telp/WA : 0895630183347
        </p>
      </CardHeader>

      <CardContent className="printable pos-receipt space-y-4">
        <div className="text-center">
          <div className="font-mono text-lg font-bold">STRUK PENJUALAN</div>
          <div className="text-sm text-muted-foreground">
            {receipt.id}
          </div>
          <div className="text-sm text-muted-foreground">
            {formatDate(receipt.timestamp)}
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          {receipt.items.map((item, index) => (
            <div key={index} className="flex justify-between text-sm">
              <div className="flex-1">
                <div className="font-medium">{item.product.name}</div>
                <div className="text-muted-foreground">
                  {formatPrice(item.finalPrice || item.product.sellPrice)} × {item.quantity}
                </div>
              </div>
              <div className="font-medium">
                {formatPrice((item.finalPrice || item.product.sellPrice) * item.quantity)}
              </div>
            </div>
          ))}
        </div>

        <Separator />

        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{formatPrice(receipt.subtotal)}</span>
          </div>
          {receipt.discount > 0 && (
            <div className="flex justify-between text-destructive">
              <span>Diskon</span>
              <span>-{formatPrice(receipt.discount)}</span>
            </div>
          )}
          <Separator />
          <div className="flex justify-between text-lg font-bold">
            <span>TOTAL</span>
            <span>{formatPrice(receipt.total)}</span>
          </div>
        </div>

        <Separator />

        <div className="text-center text-sm text-muted-foreground">
          <p>Terima kasih atas kunjungan Anda!</p>
          <p>Semoga Hari Anda Menyenangkan</p>
          <p className="mt-2 font-mono">
            Kasir: Admin | {receipt.paymentMethod?.toUpperCase() || 'CASH'}
          </p>
        </div>
      </CardContent>

      <div className="p-4 space-y-2">
        <BluetoothInstructions />
        
        <div className="bg-muted/50 p-3 rounded-lg text-center text-sm text-muted-foreground mb-3 mt-3">
          Tekan <kbd className="bg-background px-2 py-1 rounded border">Enter</kbd> untuk print otomatis
        </div>
        
        <Button 
          className="w-full"
          onClick={handleThermalPrint}
        >
          <Printer className="w-4 h-4 mr-2" />
          Cetak Nota (Enter)
        </Button>
        
        <Button 
          variant="outline"
          className="w-full"
          onClick={handleConnectPrinter}
        >
          <Bluetooth className="w-4 h-4 mr-2" />
          Sambungkan Bluetooth
        </Button>
        
        <Button 
          variant="outline"
          className="w-full"
          onClick={() => {
            const receiptData = `data:text/plain;charset=utf-8,${encodeURIComponent(
              `TOKO ANJAR FOTOCOPY & ATK\n${receipt.id}\n${formatDate(receipt.timestamp)}\n\n${
                receipt.items.map(item => {
                  const price = item.finalPrice || item.product.sellPrice;
                  return `${item.product.name}\n${formatPrice(price)} × ${item.quantity} = ${formatPrice(price * item.quantity)}`;
                }).join('\n\n')
              }\n\nSubtotal: ${formatPrice(receipt.subtotal)}${receipt.discount > 0 ? `\nDiskon: -${formatPrice(receipt.discount)}` : ''}\nTOTAL: ${formatPrice(receipt.total)}`
            )}`;
            const link = document.createElement('a');
            link.href = receiptData;
            link.download = `receipt-${receipt.id}.txt`;
            link.click();
          }}
        >
          <Download className="w-4 h-4 mr-2" />
          Download Struk
        </Button>
      </div>
    </Card>
    </div>
  );
};