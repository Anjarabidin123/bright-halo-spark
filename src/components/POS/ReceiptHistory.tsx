import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Receipt as ReceiptIcon, 
  Search,
  Calendar,
  Eye,
  Printer,
  Download,
  Filter,
  ArrowLeft
} from 'lucide-react';
import { Receipt as ReceiptType } from '@/types/pos';
import { Receipt } from '@/components/POS/Receipt';

interface ReceiptHistoryProps {
  receipts: ReceiptType[];
  formatPrice: (price: number) => string;
  onViewReceipt: (receipt: ReceiptType) => void;
  onPrintReceipt: (receipt: ReceiptType) => void;
  onBackToPOS?: () => void;
}

export const ReceiptHistory = ({ 
  receipts, 
  formatPrice, 
  onViewReceipt,
  onPrintReceipt,
  onBackToPOS 
}: ReceiptHistoryProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState('today');
  const [customDate, setCustomDate] = useState('');
  const [viewingReceipt, setViewingReceipt] = useState<ReceiptType | null>(null);

  const getDateFilter = () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    switch (selectedDate) {
      case 'today':
        return (receipt: ReceiptType) => {
          const receiptDate = new Date(receipt.timestamp);
          return receiptDate.toDateString() === today.toDateString();
        };
      case 'yesterday':
        return (receipt: ReceiptType) => {
          const receiptDate = new Date(receipt.timestamp);
          return receiptDate.toDateString() === yesterday.toDateString();
        };
      case 'custom':
        return (receipt: ReceiptType) => {
          if (!customDate) return true;
          const receiptDate = new Date(receipt.timestamp);
          const filterDate = new Date(customDate);
          return receiptDate.toDateString() === filterDate.toDateString();
        };
      case 'all':
      default:
        return () => true;
    }
  };

  const filteredReceipts = receipts
    .filter(getDateFilter())
    .filter(receipt => 
      receipt.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      receipt.items.some(item => 
        item.product.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    )
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const totalRevenue = filteredReceipts.reduce((sum, receipt) => sum + receipt.total, 0);
  const totalProfit = filteredReceipts.reduce((sum, receipt) => sum + receipt.profit, 0);

  const handleViewReceipt = (receipt: ReceiptType) => {
    setViewingReceipt(receipt);
  };

  const handleBackToHistory = () => {
    setViewingReceipt(null);
  };

  if (viewingReceipt) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="icon"
            onClick={handleBackToHistory}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-xl font-semibold">Detail Nota</h2>
          {onBackToPOS && (
            <Button 
              variant="outline"
              onClick={onBackToPOS}
              className="ml-auto"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Kembali ke POS
            </Button>
          )}
        </div>
        <Receipt receipt={viewingReceipt} formatPrice={formatPrice} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="pos-card">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-success">
              {formatPrice(totalRevenue)}
            </div>
            <div className="text-sm text-muted-foreground">Total Penjualan</div>
          </CardContent>
        </Card>
        
        <Card className="pos-card">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-primary">
              {formatPrice(totalProfit)}
            </div>
            <div className="text-sm text-muted-foreground">Total Keuntungan</div>
          </CardContent>
        </Card>
        
        <Card className="pos-card">
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {filteredReceipts.length}
            </div>
            <div className="text-sm text-muted-foreground">Transaksi</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="pos-card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ReceiptIcon className="h-5 w-5" />
              Riwayat Transaksi
            </div>
            <Badge variant="secondary">
              {filteredReceipts.length} transaksi
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari invoice atau produk..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={selectedDate} onValueChange={setSelectedDate}>
              <SelectTrigger>
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Tanggal</SelectItem>
                <SelectItem value="today">Hari Ini</SelectItem>
                <SelectItem value="yesterday">Kemarin</SelectItem>
                <SelectItem value="custom">Pilih Tanggal</SelectItem>
              </SelectContent>
            </Select>

            {selectedDate === 'custom' && (
              <Input
                type="date"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                className="w-full"
              />
            )}
          </div>

          {/* Receipt List */}
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredReceipts.length === 0 ? (
              <div className="text-center py-8">
                <ReceiptIcon className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">
                  {selectedDate === 'today' 
                    ? 'Belum ada transaksi hari ini'
                    : 'Tidak ada transaksi ditemukan'
                  }
                </p>
              </div>
            ) : (
              filteredReceipts.map((receipt) => (
                <div 
                  key={receipt.id}
                  className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-semibold text-sm">{receipt.id}</div>
                    <div className="font-bold text-lg text-primary">
                      {formatPrice(receipt.total)}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground mb-3">
                    <div>
                      <span className="block">Tanggal:</span>
                      <span className="font-medium text-foreground">
                        {new Date(receipt.timestamp).toLocaleDateString('id-ID', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                    <div>
                      <span className="block">Waktu:</span>
                      <span className="font-medium text-foreground">
                        {new Date(receipt.timestamp).toLocaleTimeString('id-ID')}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-xs text-muted-foreground mb-3">
                    <div>
                      <span className="block">Items:</span>
                      <span className="font-medium text-foreground">
                        {receipt.items.length} produk
                      </span>
                    </div>
                    <div>
                      <span className="block">Profit:</span>
                      <span className="font-medium text-success">
                        {formatPrice(receipt.profit)}
                      </span>
                    </div>
                    <div>
                      <span className="block">Pembayaran:</span>
                      <Badge variant="outline" className="text-xs">
                        {receipt.paymentMethod?.toUpperCase() || 'CASH'}
                      </Badge>
                    </div>
                  </div>

                  {receipt.discount > 0 && (
                    <div className="text-xs text-muted-foreground mb-3">
                      <span className="block">Diskon:</span>
                      <span className="font-medium text-warning">
                        -{formatPrice(receipt.discount)}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="text-xs text-muted-foreground">
                      {receipt.items.slice(0, 2).map(item => item.product.name).join(', ')}
                      {receipt.items.length > 2 && ` +${receipt.items.length - 2} lainnya`}
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewReceipt(receipt)}
                        className="h-7 px-2"
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onPrintReceipt(receipt)}
                        className="h-7 px-2"
                        title="Print Thermal"
                      >
                        <Printer className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};