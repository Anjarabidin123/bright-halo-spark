
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CartItem, Receipt as ReceiptType } from '@/types/pos';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ShoppingCart as CartIcon, Trash2, CreditCard, Percent, Printer, Edit, ExternalLink, Bluetooth, Plus } from 'lucide-react';
import { thermalPrinter } from '@/lib/thermal-printer';
import { formatThermalReceipt } from '@/lib/receipt-formatter';
import { toast } from 'sonner';
import { QuantitySelector } from './QuantitySelector';
import { QuickProductSearch } from './QuickProductSearch';
import { Product } from '@/types/pos';

interface ShoppingCartProps {
  cart: CartItem[];
  updateCartQuantity: (productId: string, quantity: number, finalPrice?: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  processTransaction: (paymentMethod?: string, discount?: number) => ReceiptType | null;
  formatPrice: (price: number) => string;
  onPrintThermal: (receipt: ReceiptType) => void;
  onViewReceipt?: (receipt: ReceiptType) => void;
  receipts?: ReceiptType[];
  products?: Product[];
  onAddToCart?: (product: Product, quantity?: number) => void;
}

export const ShoppingCart = ({
  cart,
  updateCartQuantity,
  removeFromCart,
  clearCart,
  processTransaction,
  formatPrice,
  onPrintThermal,
  onViewReceipt,
  receipts = [],
  products = [],
  onAddToCart
}: ShoppingCartProps) => {
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState<'amount' | 'percent'>('amount');
  const [editingPrice, setEditingPrice] = useState<string | null>(null);
  const navigate = useNavigate();

  const handlePriceChange = (productId: string, newPrice: number) => {
    const item = cart.find(item => item.product.id === productId);
    if (item) {
      updateCartQuantity(productId, item.quantity, newPrice);
    }
  };

  const subtotal = cart.reduce((sum, item) => {
    const price = item.finalPrice || item.product.sellPrice;
    return sum + (price * item.quantity);
  }, 0);

  const discountAmount = discountType === 'percent' 
    ? Math.round(subtotal * (discount / 100))
    : discount;
    
  const total = Math.max(0, subtotal - discountAmount);

  const handleCheckout = () => {
    const receipt = processTransaction(paymentMethod, discountAmount);
    if (receipt) {
      setPaymentMethod('cash');
      setDiscount(0);
      setDiscountType('amount');
    }
  };

  const handlePrintToReceipt = () => {
    const receipt = processTransaction(paymentMethod, discountAmount);
    if (receipt) {
      onViewReceipt?.(receipt);
      setPaymentMethod('cash');
      setDiscount(0);
      setDiscountType('amount');
    }
  };

  const handleThermalPrint = async () => {
    const receipt = processTransaction(paymentMethod, discountAmount);
    if (receipt) {
      try {
        const thermalContent = formatThermalReceipt(receipt, formatPrice);
        const success = await thermalPrinter.print(thermalContent);
        
        if (success) {
          toast.success('Nota berhasil dicetak!');
          setPaymentMethod('cash');
          setDiscount(0);
          setDiscountType('amount');
        } else {
          toast.error('Gagal mencetak nota. Pastikan printer terhubung.');
        }
      } catch (error) {
        console.error('Print error:', error);
        toast.error('Terjadi kesalahan saat mencetak.');
      }
    }
  };

  if (cart.length === 0) {
    return (
      <div className="space-y-2 sm:space-y-4">
        <Card className="pos-card h-fit">
          <CardHeader className="text-center py-4 sm:py-8 p-3 sm:p-6">
            <CartIcon className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground mx-auto mb-2 sm:mb-4" />
            <CardTitle className="text-muted-foreground text-sm sm:text-base">Keranjang Kosong</CardTitle>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Pilih produk untuk memulai transaksi
            </p>
          </CardHeader>
        </Card>

        {/* Transaction History */}
        {receipts.length > 0 && (
          <Card className="pos-card">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Printer className="h-4 w-4" />
                Transaksi Terakhir
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {receipts.slice(-8).reverse().map((receipt) => (
                  <div 
                    key={receipt.id}
                    className="flex flex-col p-2 bg-secondary/50 rounded border cursor-pointer hover:bg-secondary/70 transition-colors"
                    onClick={() => onViewReceipt?.(receipt)}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="font-medium text-xs">{receipt.id}</div>
                      <div className="font-semibold text-xs">
                        {formatPrice(receipt.total)}
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{receipt.items.length} item</span>
                      <div className="text-right">
                        <div>{new Date(receipt.timestamp).toLocaleDateString('id-ID', {
                          day: '2-digit',
                          month: '2-digit'
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
    );
  }

  return (
    <div className="space-y-2 sm:space-y-4">
      <Card className="pos-card h-fit">
        <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-6">
          <CardTitle className="flex items-center justify-between text-sm sm:text-base">
            <div 
              className="flex items-center gap-1 sm:gap-2 cursor-pointer hover:text-primary transition-colors"
              onClick={() => navigate('/cart')}
            >
              <CartIcon className="h-4 w-4 sm:h-5 sm:w-5" />
              Keranjang
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <Badge variant="secondary" className="text-xs">{cart.length} item</Badge>
              <Button
                size="sm"
                variant="outline"
                onClick={handleThermalPrint}
                className="h-5 w-5 sm:h-6 sm:w-6 p-0"
                title="Print Thermal"
              >
                <Printer className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => navigate('/cart')}
                className="h-5 w-5 sm:h-6 sm:w-6 p-0"
              >
                <ExternalLink className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-6">
          {/* Quick Product Search */}
          {products.length > 0 && onAddToCart && (
            <div className="mb-3">
              <QuickProductSearch 
                products={products}
                onAddToCart={onAddToCart}
                formatPrice={formatPrice}
              />
            </div>
          )}

          <div className="max-h-48 sm:max-h-64 lg:max-h-80 overflow-y-auto space-y-3 border rounded-lg p-2 bg-secondary/20">
            {cart.map((item, index) => (
              <div key={`${item.product.id}-${item.finalPrice || 'default'}-${index}`} className="pos-cart-item min-h-[80px] sm:min-h-[100px]">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1 sm:mb-2">
                    <h4 
                      className="font-medium text-xs sm:text-sm cursor-pointer hover:text-primary transition-colors leading-tight" 
                      onClick={(e) => {
                        e.stopPropagation();
                        console.log(`Produk: ${item.product.name}, Qty: ${item.quantity}, Harga: ${formatPrice(item.finalPrice || item.product.sellPrice)}`);
                      }}
                    >
                      {item.product.name}
                    </h4>
                    {item.quantity >= 12 && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-5 w-5 sm:h-6 sm:w-6 p-0"
                        onClick={() => setEditingPrice(editingPrice === item.product.id ? null : item.product.id)}
                      >
                        <Edit className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                      </Button>
                    )}
                  </div>
                  
                  <div className="text-xs text-muted-foreground mb-2 sm:mb-3">
                    {formatPrice(item.finalPrice || item.product.sellPrice)} × {item.quantity}
                  </div>
                  
                  <QuantitySelector
                    quantity={item.quantity}
                    productName={item.product.name}
                    onQuantityChange={(quantity) => {
                      if (quantity === 0) {
                        removeFromCart(item.product.id);
                      } else {
                        updateCartQuantity(item.product.id, quantity, item.finalPrice);
                      }
                    }}
                    onRemove={() => removeFromCart(item.product.id)}
                    allowBulkPricing={true}
                    currentPrice={item.finalPrice || item.product.sellPrice}
                    onPriceChange={(price) => handlePriceChange(item.product.id, price)}
                  />
                </div>
                
                <div className="text-right ml-2">
                  <div className="font-semibold text-sm sm:text-lg">
                    {formatPrice((item.finalPrice || item.product.sellPrice) * item.quantity)}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Separator />
          
          <div className="space-y-3 sm:space-y-4">
            <div className="space-y-1 sm:space-y-2">
              <Label className="text-xs sm:text-sm font-medium">Metode Pembayaran</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger className="h-8 sm:h-10 text-xs sm:text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Tunai</SelectItem>
                  <SelectItem value="debit">Kartu Debit</SelectItem>
                  <SelectItem value="credit">Kartu Kredit</SelectItem>
                  <SelectItem value="qris">QRIS</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1 sm:space-y-2">
              <Label className="text-xs sm:text-sm font-medium flex items-center gap-1 sm:gap-2">
                <Percent className="w-3 h-3 sm:w-4 sm:h-4" />
                Diskon
              </Label>
              <div className="flex gap-2">
                <Select value={discountType} onValueChange={(value: 'amount' | 'percent') => setDiscountType(value)}>
                  <SelectTrigger className="w-16 sm:w-24 h-8 sm:h-10 text-xs sm:text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="amount">Rp</SelectItem>
                    <SelectItem value="percent">%</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  placeholder="0"
                  value={discount || ''}
                  onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                  min="0"
                  max={discountType === 'percent' ? 100 : subtotal}
                  className="h-8 sm:h-10 text-xs sm:text-sm"
                />
              </div>
            </div>
          </div>
          
          <div className="space-y-2 sm:space-y-3 pt-3 sm:pt-4 border-t">
            <div className="flex justify-between text-sm sm:text-lg">
              <span>Subtotal:</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-sm sm:text-lg text-destructive">
                <span>Diskon:</span>
                <span>-{formatPrice(discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg sm:text-xl font-bold">
              <span>Total:</span>
              <span className="text-primary">{formatPrice(total)}</span>
            </div>
          </div>
          
          <div className="space-y-1.5 sm:space-y-2 pt-2">
            <Button 
              className="w-full h-8 sm:h-10 text-xs sm:text-sm"
              variant="success"
              onClick={handleCheckout}
            >
              <CreditCard className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              Checkout
            </Button>
            
            <Button 
              className="w-full h-8 sm:h-10 text-xs sm:text-sm"
              variant="default"
              onClick={handlePrintToReceipt}
            >
              <Printer className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              Print Nota
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full h-8 sm:h-10 text-xs sm:text-sm"
              onClick={clearCart}
            >
              Kosongkan Keranjang
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Transaction History */}
      {receipts.length > 0 && (
        <Card className="pos-card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Printer className="h-4 w-4" />
              Transaksi Terakhir
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {receipts.slice(-8).reverse().map((receipt) => (
                <div 
                  key={receipt.id}
                  className="flex flex-col p-2 bg-secondary/50 rounded border cursor-pointer hover:bg-secondary/70 transition-colors"
                  onClick={() => onViewReceipt?.(receipt)}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="font-medium text-xs">{receipt.id}</div>
                    <div className="font-semibold text-xs">
                      {formatPrice(receipt.total)}
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{receipt.items.length} item</span>
                    <div className="text-right">
                      <div>{new Date(receipt.timestamp).toLocaleDateString('id-ID', {
                        day: '2-digit',
                        month: '2-digit'
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
  );
};
