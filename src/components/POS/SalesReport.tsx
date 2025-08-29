import { useState } from 'react';
import { Receipt } from '@/types/pos';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { FileText, TrendingUp, DollarSign, Package } from 'lucide-react';
import { format, subDays, subWeeks, subMonths, subYears, startOfDay, endOfDay } from 'date-fns';
import { id } from 'date-fns/locale';

interface SalesReportProps {
  receipts: Receipt[];
  formatPrice: (price: number) => string;
}

type ReportPeriod = '1d' | '7d' | '30d' | '60d' | '365d';

export const SalesReport = ({ receipts, formatPrice }: SalesReportProps) => {
  const [selectedPeriod, setSelectedPeriod] = useState<ReportPeriod>('1d');

  const getDateRange = (period: ReportPeriod) => {
    const now = new Date();
    const today = startOfDay(now);
    
    switch (period) {
      case '1d':
        return { start: today, end: endOfDay(now) };
      case '7d':
        return { start: subDays(today, 6), end: endOfDay(now) };
      case '30d':
        return { start: subDays(today, 29), end: endOfDay(now) };
      case '60d':
        return { start: subDays(today, 59), end: endOfDay(now) };
      case '365d':
        return { start: subDays(today, 364), end: endOfDay(now) };
      default:
        return { start: today, end: endOfDay(now) };
    }
  };

  const getPeriodLabel = (period: ReportPeriod) => {
    switch (period) {
      case '1d': return 'Hari Ini';
      case '7d': return '7 Hari Terakhir';
      case '30d': return '30 Hari Terakhir';
      case '60d': return '60 Hari Terakhir';
      case '365d': return '1 Tahun Terakhir';
      default: return 'Hari Ini';
    }
  };

  const { start, end } = getDateRange(selectedPeriod);
  
  const filteredReceipts = receipts.filter(receipt => {
    const receiptDate = new Date(receipt.timestamp);
    return receiptDate >= start && receiptDate <= end;
  });

  const stats = {
    totalSales: filteredReceipts.reduce((sum, receipt) => sum + receipt.total, 0),
    totalProfit: filteredReceipts.reduce((sum, receipt) => sum + receipt.profit, 0),
    totalDiscount: filteredReceipts.reduce((sum, receipt) => sum + receipt.discount, 0),
    totalTransactions: filteredReceipts.length,
    totalItems: filteredReceipts.reduce((sum, receipt) => 
      sum + receipt.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
    ),
  };

  const handlePrint = () => {
    const printContent = `
      <div style="font-family: monospace; max-width: 300px; margin: 0 auto;">
        <h2 style="text-align: center; margin-bottom: 20px;">LAPORAN PENJUALAN</h2>
        <p style="text-align: center; margin-bottom: 20px;">${getPeriodLabel(selectedPeriod)}</p>
        <p style="text-align: center; margin-bottom: 30px;">${format(start, 'dd/MM/yyyy', { locale: id })} - ${format(end, 'dd/MM/yyyy', { locale: id })}</p>
        
        <div style="border-top: 1px dashed #000; margin: 20px 0; padding-top: 10px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
            <span>Total Transaksi:</span>
            <span>${stats.totalTransactions}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
            <span>Total Item:</span>
            <span>${stats.totalItems}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
            <span>Total Diskon:</span>
            <span>${formatPrice(stats.totalDiscount)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
            <span>Total Penjualan:</span>
            <span>${formatPrice(stats.totalSales)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 10px; font-weight: bold;">
            <span>Total Keuntungan:</span>
            <span>${formatPrice(stats.totalProfit)}</span>
          </div>
        </div>
        
        <div style="border-top: 1px dashed #000; margin: 20px 0; padding-top: 10px;">
          <h3 style="margin-bottom: 10px;">Detail Transaksi:</h3>
          ${filteredReceipts.map(receipt => `
            <div style="margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid #ccc;">
              <div style="display: flex; justify-content: space-between; font-weight: bold;">
                <span>${receipt.id}</span>
                <span>${format(new Date(receipt.timestamp), 'dd/MM HH:mm', { locale: id })}</span>
              </div>
              ${receipt.items.map(item => `
                <div style="display: flex; justify-content: space-between; font-size: 12px; margin: 2px 0;">
                  <span>${item.product.name} x${item.quantity}</span>
                  <span>${formatPrice((item.finalPrice || item.product.sellPrice) * item.quantity)}</span>
                </div>
              `).join('')}
              ${receipt.discount > 0 ? `<div style="display: flex; justify-content: space-between; font-size: 12px; color: #666;">
                <span>Diskon:</span>
                <span>-${formatPrice(receipt.discount)}</span>
              </div>` : ''}
              <div style="display: flex; justify-content: space-between; font-weight: bold; margin-top: 5px;">
                <span>Total:</span>
                <span>${formatPrice(receipt.total)}</span>
              </div>
            </div>
          `).join('')}
        </div>
        
        <p style="text-align: center; margin-top: 30px; font-size: 12px;">
          Dicetak pada ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: id })}
        </p>
      </div>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Laporan Penjualan - ${getPeriodLabel(selectedPeriod)}</title>
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Laporan Penjualan</h2>
        <div className="flex gap-2">
          <Select value={selectedPeriod} onValueChange={(value: ReportPeriod) => setSelectedPeriod(value)}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1d">Hari Ini</SelectItem>
              <SelectItem value="7d">7 Hari Terakhir</SelectItem>
              <SelectItem value="30d">30 Hari Terakhir</SelectItem>
              <SelectItem value="60d">60 Hari Terakhir</SelectItem>
              <SelectItem value="365d">1 Tahun Terakhir</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handlePrint} variant="outline">
            <FileText className="w-4 h-4 mr-2" />
            Cetak Laporan
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Penjualan</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{formatPrice(stats.totalSales)}</div>
            <p className="text-xs text-muted-foreground">{getPeriodLabel(selectedPeriod)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Keuntungan</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{formatPrice(stats.totalProfit)}</div>
            <p className="text-xs text-muted-foreground">{getPeriodLabel(selectedPeriod)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transaksi</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTransactions}</div>
            <p className="text-xs text-muted-foreground">{getPeriodLabel(selectedPeriod)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Item</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalItems}</div>
            <p className="text-xs text-muted-foreground">{getPeriodLabel(selectedPeriod)}</p>
          </CardContent>
        </Card>
      </div>

      {stats.totalDiscount > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Total Diskon</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-destructive">{formatPrice(stats.totalDiscount)}</div>
            <p className="text-sm text-muted-foreground">Diskon yang diberikan dalam periode ini</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Detail Transaksi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {filteredReceipts.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Tidak ada transaksi dalam periode {getPeriodLabel(selectedPeriod).toLowerCase()}
              </p>
            ) : (
              filteredReceipts.map(receipt => (
                <div key={receipt.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-medium">{receipt.id}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(receipt.timestamp), 'dd MMM yyyy, HH:mm', { locale: id })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{formatPrice(receipt.total)}</p>
                      <p className="text-sm text-success">+{formatPrice(receipt.profit)}</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    {receipt.items.map((item, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>{item.product.name} x{item.quantity}</span>
                        <span>{formatPrice((item.finalPrice || item.product.sellPrice) * item.quantity)}</span>
                      </div>
                    ))}
                    {receipt.discount > 0 && (
                      <div className="flex justify-between text-sm text-destructive">
                        <span>Diskon</span>
                        <span>-{formatPrice(receipt.discount)}</span>
                      </div>
                    )}
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