import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { TransactionHistory } from '@/components/Reports/TransactionHistory';
import { Receipt as ReceiptComponent } from '@/components/POS/Receipt';
import { usePOSContext } from '@/contexts/POSContext';
import { Receipt } from '@/types/pos';
import { Link } from 'react-router-dom';

export const ReportsPage = () => {
  const { receipts, formatPrice } = usePOSContext();
  const [viewingReceipt, setViewingReceipt] = useState<Receipt | null>(null);

  const handleViewReceipt = (receipt: Receipt) => {
    setViewingReceipt(receipt);
  };

  const handlePrintReceipt = (receipt: Receipt) => {
    // Print functionality - you can implement actual printing here
    console.log('Print receipt:', receipt);
    window.print();
  };

  const handleBackToReports = () => {
    setViewingReceipt(null);
  };

  if (viewingReceipt) {
    return (
      <div className="container mx-auto p-4 space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleBackToReports}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Laporan
          </Button>
          <h1 className="text-2xl font-bold">Detail Transaksi</h1>
        </div>

        <ReceiptComponent
          receipt={viewingReceipt}
          formatPrice={formatPrice}
          onBack={handleBackToReports}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Laporan Penjualan</h1>
          <p className="text-muted-foreground">
            Kelola dan pantau riwayat transaksi Anda
          </p>
        </div>
        <Link to="/">
          <Button variant="outline" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Kembali ke POS
          </Button>
        </Link>
      </div>

      <TransactionHistory
        receipts={receipts}
        formatPrice={formatPrice}
        onViewReceipt={handleViewReceipt}
        onPrintReceipt={handlePrintReceipt}
      />
    </div>
  );
};