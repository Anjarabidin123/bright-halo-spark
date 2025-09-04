import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Receipt as ReceiptIcon, CreditCard, Percent, Printer, Copy, Bluetooth } from 'lucide-react';
import { Receipt as ReceiptType, Product } from '@/types/pos';
import { toast } from 'sonner';
import { bluetoothPrinter } from '@/lib/bluetooth-printer';
import { formatThermalReceipt } from '@/lib/receipt-formatter';

interface ManualItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice?: number;
  total: number;
  isPhotocopy?: boolean;
}

interface ManualInvoiceProps {
  onCreateInvoice: (receipt: ReceiptType) => void;
  formatPrice: (price: number) => string;
  receipts: ReceiptType[];
  onPrintReceipt?: (receipt: ReceiptType) => void;
  products: Product[];
  processManualTransaction?: (cart: any[], paymentMethod?: string, discount?: number) => Promise<ReceiptType | null>;
}

export const ManualInvoice = ({ onCreateInvoice, formatPrice, receipts, onPrintReceipt, products, processManualTransaction }: ManualInvoiceProps) => {
  const [items, setItems] = useState<ManualItem[]>([]);
  const [currentItem, setCurrentItem] = useState({
    name: '',
    quantity: 0,
    unitPrice: 0,
    isPhotocopy: false
  });
  const [currentPhotocopy, setCurrentPhotocopy] = useState({
    productId: '',
    total: 0
  });
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState<'amount' | 'percent'>('amount');
  const [isBluetoothConnected, setIsBluetoothConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  const photocopyProducts = products.filter(p => p.isPhotocopy);

  const addPhotocopyItem = () => {
    if (!currentPhotocopy.productId || currentPhotocopy.total <= 0) {
      toast.error('Pilih jenis fotocopy dan masukkan total harga!');
      return;
    }

    const product = photocopyProducts.find(p => p.id === currentPhotocopy.productId);
    if (!product) return;

    const newItem: ManualItem = {
      id: Date.now().toString(),
      name: product.name,
      quantity: 1,
      total: currentPhotocopy.total,
      isPhotocopy: true
    };
    setItems(prev => [...prev, newItem]);
    setCurrentPhotocopy({ productId: '', total: 0 });
  };

  const addItem = () => {
    if (!currentItem.name) {
      toast.error('Nama barang harus diisi!');
      return;
    }

    if (currentItem.isPhotocopy) {
      // Untuk fotocopy, validasi harga total
      if (currentItem.unitPrice <= 0) {
        toast.error('Total harga fotocopy harus diisi!');
        return;
      }
      
      const newItem: ManualItem = {
        id: Date.now().toString(),
        name: currentItem.name,
        quantity: 1, // Fotocopy selalu quantity 1
        unitPrice: currentItem.unitPrice, // Simpan sebagai unit price untuk konsistensi
        total: currentItem.unitPrice, // Total sama dengan harga yang diinput
        isPhotocopy: true
      };
      
      setItems(prev => [...prev, newItem]);
      setCurrentItem({ name: '', quantity: 0, unitPrice: 0, isPhotocopy: false });
    } else {
      // Untuk barang regular, validasi jumlah dan harga satuan
      if (currentItem.quantity <= 0) {
        toast.error('Jumlah barang harus diisi!');
        return;
      }
      
      if (currentItem.unitPrice <= 0) {
        toast.error('Harga satuan harus diisi!');
        return;
      }

      const newItem: ManualItem = {
        id: Date.now().toString(),
        name: currentItem.name,
        quantity: currentItem.quantity,
        unitPrice: currentItem.unitPrice,
        total: currentItem.quantity * currentItem.unitPrice,
        isPhotocopy: false
      };

      setItems(prev => [...prev, newItem]);
      setCurrentItem({ name: '', quantity: 0, unitPrice: 0, isPhotocopy: false });
    }
  };

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const updateItemQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) return;
    setItems(prev => prev.map(item => 
      item.id === id && !item.isPhotocopy
        ? { ...item, quantity, total: quantity * (item.unitPrice || 0) }
        : item
    ));
  };

  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const discountAmount = discountType === 'percent' 
    ? Math.round(subtotal * (discount / 100))
    : discount;
  const total = Math.max(0, subtotal - discountAmount);

  const handleCreateInvoice = async () => {
    if (items.length === 0) {
      toast.error('Tambahkan minimal satu item!');
      return;
    }

    // Convert manual items to cart items format
    const cartItems = items.map(item => ({
      product: {
        id: item.id,
        name: item.name,
        costPrice: 0, // No cost price for manual items
        sellPrice: item.isPhotocopy ? item.total : (item.unitPrice || 0),
        stock: 0,
        category: item.isPhotocopy ? 'Fotocopy' : 'Manual',
        isPhotocopy: item.isPhotocopy || false
      },
      quantity: item.quantity,
      finalPrice: item.isPhotocopy ? item.total : (item.unitPrice || 0)
    }));

    let receipt: ReceiptType | null = null;

    if (processManualTransaction) {
      // Use database transaction
      receipt = await processManualTransaction(cartItems, paymentMethod, discountAmount);
    } else {
      // Fallback to local processing
      const now = new Date();
      const day = String(now.getDate()).padStart(2, '0');
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const year = String(now.getFullYear()).slice(-2);
      const dateStr = `${day}${month}${year}`;
      const counter = receipts.length + 1;
      const invoiceId = `MNL-${counter}${dateStr}`;

      receipt = {
        id: invoiceId,
        items: cartItems,
        subtotal,
        discount: discountAmount,
        total,
        profit: total, // All manual invoice income is profit since no cost
        timestamp: new Date(),
        paymentMethod
      };
    }

    if (receipt) {
      onCreateInvoice(receipt);
      
      // Reset form
      setItems([]);
      setCurrentItem({ name: '', quantity: 0, unitPrice: 0, isPhotocopy: false });
      setCurrentPhotocopy({ productId: '', total: 0 });
      setDiscount(0);
      setPaymentMethod('cash');
      
      toast.success(`Nota manual ${receipt.id} berhasil dibuat dan disimpan ke database!`);
    }
    
    return receipt;
  };

  const handleConnectBluetooth = async () => {
    setIsConnecting(true);
    try {
      const connected = await bluetoothPrinter.connect();
      setIsBluetoothConnected(connected);
      if (connected) {
        toast.success('Bluetooth printer berhasil terhubung!');
      } else {
        toast.error('Gagal terhubung ke printer Bluetooth');
      }
    } catch (error) {
      console.error('Bluetooth connection error:', error);
      toast.error('Terjadi kesalahan saat menghubungkan Bluetooth');
      setIsBluetoothConnected(false);
    } finally {
      setIsConnecting(false);
    }
  };

  const handlePrintOnly = async () => {
    const receipt = await handleCreateInvoice();
    if (!receipt) return;

    if (!isBluetoothConnected) {
      toast.error('Bluetooth printer belum terhubung!');
      return;
    }

    try {
      const receiptText = formatThermalReceipt(receipt, formatPrice);
      const printed = await bluetoothPrinter.print(receiptText);
      
      if (printed) {
        toast.success('Nota berhasil dicetak!');
      } else {
        toast.error('Gagal mencetak nota');
      }
    } catch (error) {
      console.error('Print error:', error);
      toast.error('Terjadi kesalahan saat mencetak');
    }
  };

  const handlePrintInvoice = async () => {
    const receipt = await handleCreateInvoice();
    if (!receipt) return;

    try {
      // Connect to thermal printer
      const connected = await bluetoothPrinter.connect();
      if (!connected) {
        toast.error('Gagal terhubung ke printer thermal');
        return;
      }

      // Format and print receipt
      const receiptText = formatThermalReceipt(receipt, formatPrice);
      const printed = await bluetoothPrinter.print(receiptText);
      
      if (printed) {
        toast.success('Nota berhasil dicetak!');
      } else {
        toast.error('Gagal mencetak nota');
      }
    } catch (error) {
      console.error('Print error:', error);
      toast.error('Terjadi kesalahan saat mencetak');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Add Item Form */}
      <div className="lg:col-span-2">
        <Card className="pos-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ReceiptIcon className="h-5 w-5" />
              Nota Manual - Input Barang
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Fotocopy Section */}
            <div className="space-y-4">
              <h4 className="font-semibold flex items-center gap-2">
                <Copy className="h-4 w-4" />
                Fotocopy
              </h4>
              {photocopyProducts.length > 0 && (
                <div className="border rounded-lg p-4 bg-muted/50">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label>Jenis Fotocopy</Label>
                      <Select value={currentPhotocopy.productId} onValueChange={(value) => setCurrentPhotocopy(prev => ({ ...prev, productId: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih jenis fotocopy" />
                        </SelectTrigger>
                        <SelectContent>
                          {photocopyProducts.map(product => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.name} - {formatPrice(product.sellPrice)}/lembar
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="photocopyTotal">Total Harga</Label>
                      <Input
                        id="photocopyTotal"
                        type="number"
                        min="0"
                        placeholder="0"
                        value={currentPhotocopy.total || ''}
                        onChange={(e) => setCurrentPhotocopy(prev => ({ ...prev, total: Number(e.target.value) || 0 }))}
                        onKeyDown={(e) => e.key === 'Enter' && addPhotocopyItem()}
                      />
                    </div>
                    <div className="flex items-end">
                      <Button onClick={addPhotocopyItem} className="w-full">
                        <Plus className="h-4 w-4 mr-2" />
                        Tambah Fotocopy
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Regular Items Section */}
            <div className="space-y-4">
              <h4 className="font-semibold flex items-center gap-2">
                <ReceiptIcon className="h-4 w-4" />
                Barang/Jasa Lain
              </h4>
              
              <div className="flex items-center gap-4 mb-4">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={currentItem.isPhotocopy}
                    onChange={(e) => setCurrentItem(prev => ({ 
                      ...prev, 
                      isPhotocopy: e.target.checked,
                      name: e.target.checked ? 'Fotocopy' : '',
                      unitPrice: e.target.checked ? 0 : prev.unitPrice,
                      quantity: e.target.checked ? 1 : prev.quantity
                    }))}
                    className="rounded"
                  />
                  <Copy className="h-4 w-4" />
                  Fotocopy (input harga total langsung)
                </label>
              </div>
              
              {currentItem.isPhotocopy ? (
                // Fotocopy input - hanya nama dan total harga
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="itemName">Nama Item</Label>
                    <Input
                      id="itemName"
                      placeholder="Fotocopy"
                      value={currentItem.name}
                      onChange={(e) => setCurrentItem(prev => ({ ...prev, name: e.target.value }))}
                      onKeyDown={(e) => e.key === 'Enter' && addItem()}
                    />
                  </div>
                  <div>
                    <Label htmlFor="totalPrice">Total Harga Fotocopy</Label>
                    <Input
                      id="totalPrice"
                      type="number"
                      min="0"
                      placeholder="0"
                      value={currentItem.unitPrice || ''}
                      onChange={(e) => setCurrentItem(prev => ({ ...prev, unitPrice: Number(e.target.value) || 0 }))}
                      onKeyDown={(e) => e.key === 'Enter' && addItem()}
                    />
                  </div>
                </div>
              ) : (
                // Regular item input - nama, jumlah, harga satuan
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="itemName">Nama Barang/Jasa</Label>
                    <Input
                      id="itemName"
                      placeholder="Masukkan nama barang atau jasa (misal: Pulpen, Buku, dll)"
                      value={currentItem.name}
                      onChange={(e) => setCurrentItem(prev => ({ ...prev, name: e.target.value }))}
                      onKeyDown={(e) => e.key === 'Enter' && addItem()}
                    />
                  </div>
                  <div>
                    <Label htmlFor="quantity">Jumlah</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="0"
                      value={currentItem.quantity || ''}
                      onChange={(e) => setCurrentItem(prev => ({ ...prev, quantity: Number(e.target.value) || 0 }))}
                      placeholder="Jumlah"
                    />
                  </div>
                  <div>
                    <Label htmlFor="unitPrice">Harga Satuan</Label>
                    <Input
                      id="unitPrice"
                      type="number"
                      min="0"
                      placeholder="0"
                      value={currentItem.unitPrice || ''}
                      onChange={(e) => setCurrentItem(prev => ({ ...prev, unitPrice: Number(e.target.value) || 0 }))}
                      onKeyDown={(e) => e.key === 'Enter' && addItem()}
                    />
                  </div>
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Total: {currentItem.isPhotocopy ? 
                    formatPrice(currentItem.unitPrice || 0) : 
                    formatPrice(currentItem.quantity * currentItem.unitPrice)
                  }
                </div>
                <Button onClick={addItem} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Tambah Item
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Items List */}
        {items.length > 0 && (
          <Card className="pos-card mt-4">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Daftar Item</span>
                <Badge variant="secondary">{items.length} item</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium flex items-center gap-2">
                        {item.name}
                        {item.isPhotocopy && <Badge variant="secondary" className="text-xs">Fotocopy</Badge>}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {item.isPhotocopy ? 
                          `1 × ${formatPrice(item.total)}` :
                          `${formatPrice(item.unitPrice || 0)} × ${item.quantity}`
                        }
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!item.isPhotocopy && (
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateItemQuantity(item.id, item.quantity - 1)}
                            className="h-6 w-6 p-0"
                          >
                            -
                          </Button>
                          <span className="text-sm w-8 text-center">{item.quantity}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateItemQuantity(item.id, item.quantity + 1)}
                            className="h-6 w-6 p-0"
                          >
                            +
                          </Button>
                        </div>
                      )}
                      <div className="font-semibold min-w-[80px] text-right">
                        {formatPrice(item.total)}
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeItem(item.id)}
                        className="h-6 w-6 p-0 text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Invoice Summary */}
      <div>
        <Card className="pos-card">
          <CardHeader>
            <CardTitle>Ringkasan Nota</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Metode Pembayaran</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
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

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Percent className="w-4 h-4" />
                Diskon
              </Label>
              <div className="flex gap-2">
                <Select value={discountType} onValueChange={(value: 'amount' | 'percent') => setDiscountType(value)}>
                  <SelectTrigger className="w-20">
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
                />
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-destructive">
                  <span>Diskon:</span>
                  <span>-{formatPrice(discountAmount)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>Total:</span>
                <span className="text-primary">{formatPrice(total)}</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Bluetooth className="w-4 h-4" />
                Bluetooth Printer
              </Label>
              <Button
                variant="outline"
                className="w-full"
                onClick={handleConnectBluetooth}
                disabled={isConnecting}
              >
                <Bluetooth className="w-4 h-4 mr-2" />
                {isConnecting ? 'Menghubungkan...' : 
                 isBluetoothConnected ? 'Terhubung' : 'Sambungkan Bluetooth'}
              </Button>
              {isBluetoothConnected && (
                <div className="text-xs text-green-600 flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Printer siap digunakan
                </div>
              )}
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-2">
              <Button 
                onClick={handleCreateInvoice} 
                className="w-full"
                disabled={items.length === 0}
              >
                <ReceiptIcon className="h-4 w-4 mr-2" />
                Buat Nota
              </Button>
              <Button 
                onClick={handlePrintOnly} 
                className="w-full"
                disabled={items.length === 0 || !isBluetoothConnected}
                variant="outline"
              >
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
            </div>

            <div className="text-xs text-muted-foreground text-center">
              Nota manual akan tercatat di laporan penjualan hari ini
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};