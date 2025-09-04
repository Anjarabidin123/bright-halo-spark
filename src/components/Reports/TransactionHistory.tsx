import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Receipt, CartItem } from '@/types/pos';
import { Eye, Printer, Calendar, Clock, Hash, DollarSign, TrendingUp } from 'lucide-react';
import { format, isAfter, isBefore, startOfDay, endOfDay, isToday, isYesterday } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

interface TransactionHistoryProps {
  receipts: Receipt[];
  formatPrice: (price: number) => string;
  onViewReceipt: (receipt: Receipt) => void;
  onPrintReceipt: (receipt: Receipt) => void;
}

export const TransactionHistory = ({ 
  receipts, 
  formatPrice, 
  onViewReceipt, 
  onPrintReceipt 
}: TransactionHistoryProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState<string>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const getDateFilter = () => {
    const now = new Date();
    switch (selectedDate) {
      case 'today':
        return (receipt: Receipt) => isToday(receipt.timestamp);
      case 'yesterday':
        return (receipt: Receipt) => isYesterday(receipt.timestamp);
      case 'custom':
        if (!startDate || !endDate) return () => true;
        const start = startOfDay(new Date(startDate));
        const end = endOfDay(new Date(endDate));
        return (receipt: Receipt) => 
          isAfter(receipt.timestamp, start) && isBefore(receipt.timestamp, end);
      default:
        return () => true;
    }
  };

  const filteredReceipts = receipts
    .filter(getDateFilter())
    .filter(receipt =>
      receipt.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      receipt.paymentMethod?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      receipt.items.some(item => 
        item.product.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    )
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  const totalRevenue = filteredReceipts.reduce((sum, receipt) => sum + receipt.total, 0);
  const totalProfit = filteredReceipts.reduce((sum, receipt) => sum + receipt.profit, 0);
  const totalTransactions = filteredReceipts.length;

  const getReceiptItemsText = (items: CartItem[]) => {
    return items.map(item => `${item.product.name} (${item.quantity}x)`).join(', ');
  };

  const formatDateTime = (date: Date) => {
    return format(date, 'dd/MM/yyyy HH:mm', { locale: localeId });
  };

  const formatDateOnly = (date: Date) => {
    return format(date, 'dd/MM/yyyy', { locale: localeId });
  };

  const formatTimeOnly = (date: Date) => {
    return format(date, 'HH:mm', { locale: localeId });
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Penjualan</p>
                <p className="text-lg font-semibold">{formatPrice(totalRevenue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Keuntungan</p>
                <p className="text-lg font-semibold text-green-600">{formatPrice(totalProfit)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Hash className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Transaksi</p>
                <p className="text-lg font-semibold text-blue-600">{totalTransactions}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Filter Riwayat Transaksi
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <Label htmlFor="search">Cari Transaksi</Label>
              <Input
                id="search"
                placeholder="ID, metode pembayaran, atau produk..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="dateFilter">Filter Tanggal</Label>
              <Select value={selectedDate} onValueChange={setSelectedDate}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih periode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Waktu</SelectItem>
                  <SelectItem value="today">Hari Ini</SelectItem>
                  <SelectItem value="yesterday">Kemarin</SelectItem>
                  <SelectItem value="custom">Periode Kustom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {selectedDate === 'custom' && (
              <>
                <div>
                  <Label htmlFor="startDate">Dari Tanggal</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="endDate">Sampai Tanggal</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Transactions List */}
      <Card>
        <CardHeader>
          <CardTitle>Riwayat Transaksi ({totalTransactions} transaksi)</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredReceipts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Hash className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">Tidak ada transaksi ditemukan</p>
              <p className="text-sm">Coba ubah filter atau periode pencarian</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredReceipts.map((receipt) => (
                <div 
                  key={receipt.id} 
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="text-xs font-mono">
                        {receipt.id}
                      </Badge>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {formatDateOnly(receipt.timestamp)}
                        <Clock className="h-3 w-3 ml-2" />
                        {formatTimeOnly(receipt.timestamp)}
                      </div>
                    </div>
                    
                    <div className="text-sm text-muted-foreground truncate">
                      {getReceiptItemsText(receipt.items)} ({receipt.items.length} item)
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <span className="font-semibold">{formatPrice(receipt.total)}</span>
                      <Badge variant="secondary" className="text-xs">
                        Profit: {formatPrice(receipt.profit)}
                      </Badge>
                      {receipt.paymentMethod && (
                        <Badge variant="outline" className="text-xs">
                          {receipt.paymentMethod}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onViewReceipt(receipt)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onPrintReceipt(receipt)}
                    >
                      <Printer className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};