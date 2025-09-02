import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CartItem, Receipt as ReceiptType } from '@/types/pos';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ShoppingCart as CartIcon, ArrowLeft, Printer, CreditCard, Bluetooth } from 'lucide-react';
import { thermalPrinter } from '@/lib/thermal-printer';
import { formatThermalReceipt, formatPrintReceipt } from '@/lib/receipt-formatter';
import { usePOSContext } from '@/contexts/POSContext';
import { useToast } from '@/hooks/use-toast';

export const CartView = () => {
  const navigate = useNavigate();
  const { cart, formatPrice, receipts, processTransaction, clearCart } = usePOSContext();
  const { toast } = useToast();

  const subtotal = cart.reduce((sum, item) => {
    const price = item.finalPrice || item.product.sellPrice;
    return sum + (price * item.quantity);
  }, 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    
    const receipt = await processTransaction('cash', 0);
    if (receipt) {
      toast({
        title: "Transaksi Berhasil",
        description: `Invoice ${receipt.id} telah dibuat`,
      });
      clearCart();
      navigate('/', { state: { viewReceipt: receipt } });
    }
  };

  const handlePrintReceipt = async () => {
    if (cart.length === 0) return;
    
    const receipt = await processTransaction('cash', 0);
    if (receipt) {
      printReceipt(receipt);
      clearCart();
      navigate('/');
    }
  };

  const handleThermalPrint = async () => {
    if (cart.length === 0) return;
    
    const receipt = await processTransaction('cash', 0);
    if (receipt) {
      try {
        const thermalContent = formatThermalReceipt(receipt, formatPrice);
        const success = await thermalPrinter.print(thermalContent);
        
        if (success) {
          toast({
            title: "Berhasil",
            description: "Nota berhasil dicetak ke thermal printer!",
          });
          clearCart();
          navigate('/');
        } else {
          toast({
            title: "Error",
            description: "Gagal mencetak nota. Pastikan printer terhubung.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('Print error:', error);
        toast({
          title: "Error", 
          description: "Terjadi kesalahan saat mencetak.",
          variant: "destructive",
        });
      }
    }
  };

  const printReceipt = (receipt: ReceiptType) => {
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
    <div className="min-h-screen bg-background p-4 space-y-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <CartIcon className="h-6 w-6" />
            <h1 className="text-2xl font-bold">Keranjang Belanja</h1>
            <Badge variant="secondary">{cart.length} item</Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Item dalam Keranjang</CardTitle>
              </CardHeader>
              <CardContent>
                {cart.length === 0 ? (
                  <div className="text-center py-8">
                    <CartIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Keranjang kosong</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cart.map((item, index) => (
                      <div key={`${item.product.id}-${item.finalPrice || 'default'}-${index}`} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <h3 className="font-medium">{item.product.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {formatPrice(item.finalPrice || item.product.sellPrice)} × {item.quantity}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-lg">
                            {formatPrice((item.finalPrice || item.product.sellPrice) * item.quantity)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Summary & History */}
          <div className="space-y-6">
            {/* Order Summary */}
            {cart.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Ringkasan Pesanan</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between text-lg">
                    <span>Subtotal:</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-xl font-bold">
                    <span>Total:</span>
                    <span className="text-primary">{formatPrice(subtotal)}</span>
                  </div>
                  <div className="space-y-2">
                    <Button 
                      className="w-full" 
                      onClick={handleCheckout}
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      Checkout
                    </Button>
                    <Button 
                      variant="outline"
                      className="w-full" 
                      onClick={handleThermalPrint}
                    >
                      <Printer className="h-4 w-4 mr-2" />
                      Print Thermal
                    </Button>
                    <Button 
                      variant="outline"
                      className="w-full" 
                      onClick={handlePrintReceipt}
                    >
                      <Printer className="h-4 w-4 mr-2" />
                      Print Browser
                    </Button>
                    <Button 
                      variant="secondary"
                      className="w-full" 
                      onClick={() => navigate('/')}
                    >
                      Kembali ke Kasir
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Transaction History */}
            {receipts.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Printer className="h-4 w-4" />
                    Transaksi Terakhir
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {receipts.slice(-10).reverse().map((receipt) => (
                      <div 
                        key={receipt.id}
                        className="flex flex-col p-3 bg-secondary/50 rounded border cursor-pointer hover:bg-secondary/70 transition-colors"
                        onClick={() => navigate('/', { state: { viewReceipt: receipt } })}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-medium text-sm">{receipt.id}</div>
                          <div className="font-semibold text-sm">
                            {formatPrice(receipt.total)}
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{receipt.items.length} item</span>
                          <div className="text-right">
                            <div>{new Date(receipt.timestamp).toLocaleDateString('id-ID', {
                              day: '2-digit',
                              month: '2-digit', 
                              year: 'numeric'
                            })}</div>
                            <div>{new Date(receipt.timestamp).toLocaleTimeString('id-ID', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};