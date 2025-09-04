import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProductGrid } from './ProductGrid';
import { ShoppingCart } from './ShoppingCart';
import { Receipt } from './Receipt';
import { AddProductForm } from './AddProductForm';
import { SalesReport } from './SalesReport';
import { PhotocopyDialog } from './PhotocopyDialog';
import { StockManagement } from './StockManagement';
import { ReceiptHistory } from './ReceiptHistory';
import { ManualInvoice } from './ManualInvoice';
import { ShoppingList } from './ShoppingList';
import { AdminProtection } from '@/components/Auth/AdminProtection';
import { BluetoothManager } from './BluetoothManager';
import { useSupabasePOS } from '@/hooks/useSupabasePOS';
import { useAuth } from '@/contexts/AuthContext';
import { Receipt as ReceiptType, Product } from '@/types/pos';
import { OperatingHours } from '@/components/Auth/OperatingHours';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Store, 
  Package, 
  Receipt as ReceiptIcon, 
  Plus, 
  Search,
  TrendingUp,
  Users,
  DollarSign,
  BarChart3,
  LogOut,
  Settings
} from 'lucide-react';
import { useLocation, Link } from 'react-router-dom';

export const POSInterface = () => {
  const { 
    products, 
    cart, 
    receipts, 
    loading, 
    addProduct, 
    updateProduct,
    deleteProduct,
    addToCart, 
    updateCartQuantity, 
    removeFromCart, 
    clearCart, 
    processTransaction, 
    addManualReceipt,
    formatPrice 
  } = useSupabasePOS();

  const { signOut } = useAuth();
  const location = useLocation();
  const [lastReceipt, setLastReceipt] = useState<ReceiptType | null>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptType | null>(location.state?.viewReceipt || null);
  const [searchTerm, setSearchTerm] = useState('');
  const [photocopyProduct, setPhotocopyProduct] = useState<Product | null>(null);
  const [showPhotocopyDialog, setShowPhotocopyDialog] = useState(false);
  const [currentTab, setCurrentTab] = useState('pos');
  const [showAdminProtection, setShowAdminProtection] = useState(false);
  const [pendingAdminAction, setPendingAdminAction] = useState<string | null>(null);

  // Global Enter key support for thermal printing
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !e.ctrlKey && !e.altKey && !e.shiftKey) {
        // Only trigger if not in an input/textarea/contenteditable element
        const target = e.target as Element;
        if (target && 
            target.tagName !== 'INPUT' && 
            target.tagName !== 'TEXTAREA' && 
            target.getAttribute('contenteditable') !== 'true') {
          
          if (lastReceipt) {
            e.preventDefault();
            handlePrintThermal(lastReceipt);
          } else if (selectedReceipt) {
            e.preventDefault();
            handlePrintThermal(selectedReceipt);
          }
        }
      }
    };

    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, [lastReceipt, selectedReceipt]);

  const handleProcessTransaction = async (paymentMethod?: string, discount?: number) => {
    const receipt = await processTransaction(paymentMethod, discount);
    if (receipt) {
      setLastReceipt(receipt);
    }
    return receipt;
  };

  const handlePhotocopyClick = (product: Product) => {
    setPhotocopyProduct(product);
    setShowPhotocopyDialog(true);
  };

  const handleDashboardClick = (section: string) => {
    switch (section) {
      case 'revenue':
      case 'profit':
        setCurrentTab('reports');
        break;
      case 'products':
        setCurrentTab('stock-management');
        break;
      case 'stock':
        setCurrentTab('low-stock');
        break;
    }
  };

  const handleAdminAction = (action: string) => {
    setPendingAdminAction(action);
    setShowAdminProtection(true);
  };

  const handleAdminSuccess = () => {
    if (pendingAdminAction) {
      setCurrentTab(pendingAdminAction);
      setPendingAdminAction(null);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleViewReceipt = (receipt: ReceiptType) => {
    setSelectedReceipt(receipt);
    setCurrentTab('receipt');
  };

  const handleManualInvoice = (receipt: ReceiptType) => {
    // Add manual invoice to receipts
    addManualReceipt(receipt);
    
    // View the created receipt
    setSelectedReceipt(receipt);
    setCurrentTab('receipt');
  };

  const handlePrintThermal = async (receipt: ReceiptType) => {
    try {
      // Import thermal printer and formatter
      const { hybridThermalPrinter } = await import('@/lib/hybrid-thermal-printer');
      const { formatThermalReceipt } = await import('@/lib/receipt-formatter');
      const { toast } = await import('sonner');
      
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
      handleBrowserPrint(receipt);
    } catch (error) {
      console.error('Print error:', error);
      const { toast } = await import('sonner');
      toast.error('Terjadi kesalahan saat mencetak.');
      toast.error('Thermal printer gagal, menggunakan printer browser...');
      handleBrowserPrint(receipt);
    }
  };

  const handleBrowserPrint = (receipt: ReceiptType) => {
    const printContent = `
===============================
   TOKO ANJAR
===============================
Invoice: ${receipt.id}
Tanggal: ${new Date(receipt.timestamp).toLocaleDateString('id-ID')}
Waktu: ${new Date(receipt.timestamp).toLocaleTimeString('id-ID')}
-------------------------------

${receipt.items.map(item => `
${item.product.name}
${item.quantity} x ${formatPrice(item.finalPrice || item.product.sellPrice)}
${' '.repeat(31 - (item.quantity + ' x ' + formatPrice(item.finalPrice || item.product.sellPrice)).length)}${formatPrice((item.finalPrice || item.product.sellPrice) * item.quantity)}
`).join('')}

-------------------------------
Subtotal: ${' '.repeat(20)}${formatPrice(receipt.subtotal)}${receipt.discount > 0 ? `
Diskon: ${' '.repeat(22)}${formatPrice(receipt.discount)}` : ''}
TOTAL: ${' '.repeat(23)}${formatPrice(receipt.total)}

Metode: ${receipt.paymentMethod?.toUpperCase() || 'TUNAI'}
Profit: ${formatPrice(receipt.profit)}

===============================
    TERIMA KASIH ATAS
    KUNJUNGAN ANDA!
===============================
`;

    // Browser print fallback
    const printWindow = window.open('', '_blank', 'width=300,height=600');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Print Receipt</title>
            <style>
              body {
                font-family: 'Courier New', monospace;
                font-size: 12px;
                line-height: 1.2;
                margin: 0;
                padding: 10px;
                white-space: pre-line;
                width: 280px;
              }
              @media print {
                body { margin: 0; }
                @page { size: 80mm auto; margin: 0; }
              }
            </style>
          </head>
          <body>${printContent}</body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalProducts = products.length;
  const lowStockProducts = products.filter(product => product.stock <= 24 && !product.isPhotocopy).length;
  
  const todayRevenue = receipts
    .filter(receipt => {
      const today = new Date();
      const receiptDate = new Date(receipt.timestamp);
      return receiptDate.toDateString() === today.toDateString();
    })
    .reduce((sum, receipt) => sum + receipt.total, 0);
    
  const todayProfit = receipts
    .filter(receipt => {
      const today = new Date();
      const receiptDate = new Date(receipt.timestamp);
      return receiptDate.toDateString() === today.toDateString();
    })
    .reduce((sum, receipt) => sum + receipt.profit, 0);

  // Photocopy earnings calculation
  const todayPhotocopyEarnings = receipts
    .filter(receipt => {
      const today = new Date();
      const receiptDate = new Date(receipt.timestamp);
      return receiptDate.toDateString() === today.toDateString();
    })
    .reduce((sum, receipt) => {
      const photocopyItems = receipt.items.filter(item => item.product.isPhotocopy || item.product.category === 'Fotocopy');
      return sum + photocopyItems.reduce((itemSum, item) => itemSum + (item.finalPrice || item.product.sellPrice) * item.quantity, 0);
    }, 0);

  // Welcome message based on time
  const getWelcomeMessage = () => {
    const hour = new Date().getHours();
    if (hour < 11) return "Selamat Pagi";
    if (hour < 15) return "Selamat Siang"; 
    if (hour < 19) return "Selamat Sore";
    return "Selamat Malam";
  };

  return (
    <OperatingHours>
      <div className="min-h-screen w-full bg-background">
      {/* Header */}
      <header className="border-b bg-card shadow-sm w-full">
        <div className="w-full px-2 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <Store className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
              <div>
                <h1 className="text-lg sm:text-2xl font-bold">Kasir Toko Anjar</h1>
                <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
                  Jalan Gajah - Dempet (Depan Koramil)
                </p>
                <p className="text-xs sm:text-sm text-primary font-medium">
                  {getWelcomeMessage()}, Admin Kasir
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-4">
              {/* Bluetooth Manager */}
              <BluetoothManager />
              
              {/* Thermal Print Status */}
              {(lastReceipt || selectedReceipt) && (
                <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-md border">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-muted-foreground">
                    Tekan <kbd className="px-1 py-0.5 bg-muted rounded text-xs font-mono">Enter</kbd> untuk print thermal
                  </span>
                </div>
              )}
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
              <div className="text-right text-xs sm:text-sm">
                <div className="font-semibold">Admin Kasir</div>
                <div className="text-muted-foreground hidden sm:block">
                  {new Date().toLocaleDateString('id-ID')}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Dashboard Stats */}
      <div className="w-full px-2 sm:px-4 py-2 sm:py-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-6">
          <Card className="pos-card cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleDashboardClick('revenue')}>
            <CardContent className="flex items-center p-4">
              <DollarSign className="h-8 w-8 text-success mr-3" />
              <div>
                <div className="text-2xl font-bold text-success">
                  {formatPrice(todayRevenue)}
                </div>
                <div className="text-sm text-muted-foreground">Penjualan Hari Ini</div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="pos-card cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleDashboardClick('profit')}>
            <CardContent className="flex items-center p-4">
              <TrendingUp className="h-8 w-8 text-primary mr-3" />
              <div>
                <div className="text-2xl font-bold text-primary">
                  {formatPrice(todayProfit)}
                </div>
                <div className="text-sm text-muted-foreground">Keuntungan Hari Ini</div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="pos-card cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleDashboardClick('profit')}>
            <CardContent className="flex items-center p-4">
              <BarChart3 className="h-8 w-8 text-info mr-3" />
              <div>
                <div className="text-2xl font-bold text-info">
                  {formatPrice(todayPhotocopyEarnings)}
                </div>
                <div className="text-sm text-muted-foreground">Penghasilan Fotocopy</div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="pos-card cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleDashboardClick('stock')}>
            <CardContent className="flex items-center p-4">
              <Users className="h-8 w-8 text-error mr-3" />
              <div>
                <div className="text-2xl font-bold">{lowStockProducts}</div>
                <div className="text-sm text-muted-foreground">Stok Menipis</div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={currentTab} onValueChange={(value) => {
          if (value === 'admin') {
            handleAdminAction(value);
          } else {
            setCurrentTab(value);
          }
        }} className="w-full">
          <TabsList className="grid w-full grid-cols-4 sm:grid-cols-7 gap-1 h-auto p-1">
            <TabsTrigger value="pos" className="text-xs sm:text-sm p-2 sm:p-3">Kasir</TabsTrigger>
            <TabsTrigger value="manual-invoice" className="text-xs sm:text-sm p-2 sm:p-3">Nota Manual</TabsTrigger>
            <TabsTrigger value="shopping-list" className="text-xs sm:text-sm p-2 sm:p-3">Daftar Belanja</TabsTrigger>
            <TabsTrigger value="stock" className="text-xs sm:text-sm p-2 sm:p-3">Stok</TabsTrigger>
            <TabsTrigger value="receipt" className="text-xs sm:text-sm p-2 sm:p-3">Nota</TabsTrigger>
            <TabsTrigger value="reports" className="text-xs sm:text-sm p-2 sm:p-3">Laporan</TabsTrigger>
            <TabsTrigger value="admin" className="text-xs sm:text-sm p-2 sm:p-3">Admin</TabsTrigger>
          </TabsList>

          <TabsContent value="pos" className="space-y-2 sm:space-y-4 mt-2 sm:mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-6">
              <div className="lg:col-span-2 space-y-2 sm:space-y-4">
                <Card className="pos-card">
                  <CardHeader className="pb-2 sm:pb-3">
                    <CardTitle className="flex items-center justify-between text-sm sm:text-base">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 sm:h-5 sm:w-5" />
                        Daftar Produk
                      </div>
                      <Badge variant="secondary" className="text-xs">{filteredProducts.length} produk</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-6">
                    <div className="mb-3 sm:mb-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-2.5 sm:top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Cari produk..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-9 h-8 sm:h-10 text-sm"
                        />
                      </div>
                    </div>
                    <ProductGrid 
                      products={filteredProducts}
                      onAddToCart={addToCart}
                      onPhotocopyClick={handlePhotocopyClick}
                    />
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-2 sm:space-y-4">
                <ShoppingCart
                  cart={cart}
                  updateCartQuantity={updateCartQuantity}
                  removeFromCart={removeFromCart}
                  clearCart={clearCart}
                  processTransaction={handleProcessTransaction}
                  formatPrice={formatPrice}
                  onPrintThermal={handlePrintThermal}
                  onViewReceipt={handleViewReceipt}
                  receipts={receipts}
                  products={products}
                  onAddToCart={addToCart}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="stock" className="space-y-4">
            <Tabs defaultValue="products" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="products">Stok Produk</TabsTrigger>
                <TabsTrigger value="low-stock">Stok Menipis</TabsTrigger>
              </TabsList>
              
              <TabsContent value="products" className="space-y-4">
                <StockManagement 
                  products={products}
                  onUpdateProduct={updateProduct}
                  onDeleteProduct={deleteProduct}
                  formatPrice={formatPrice}
                  showLowStockOnly={false}
                  readOnly={true}
                />
              </TabsContent>
              
              <TabsContent value="low-stock" className="space-y-4">
                <StockManagement 
                  products={products}
                  onUpdateProduct={updateProduct}
                  onDeleteProduct={deleteProduct}
                  formatPrice={formatPrice}
                  showLowStockOnly={true}
                  readOnly={true}
                />
              </TabsContent>
            </Tabs>
          </TabsContent>

          <TabsContent value="manual-invoice" className="space-y-4">
            <ManualInvoice 
              onCreateInvoice={handleManualInvoice}
              formatPrice={formatPrice}
              receipts={receipts}
              onPrintReceipt={handlePrintThermal}
              products={products}
            />
          </TabsContent>

          <TabsContent value="shopping-list" className="space-y-4">
            <ShoppingList />
          </TabsContent>

          <TabsContent value="admin" className="space-y-4">
            <Tabs defaultValue="add-product" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="add-product">Tambah Produk</TabsTrigger>
                <TabsTrigger value="stock-management">Kelola Stok</TabsTrigger>
                <TabsTrigger value="advanced-reports">Laporan Lanjutan</TabsTrigger>
              </TabsList>
              
              <TabsContent value="add-product" className="space-y-4">
                <AddProductForm 
                  onAddProduct={addProduct} 
                  onUpdateProduct={updateProduct}
                  products={products}
                  onClose={() => {}} 
                />
              </TabsContent>
              
              <TabsContent value="stock-management" className="space-y-4">
                <StockManagement 
                  products={products}
                  onUpdateProduct={updateProduct}
                  onDeleteProduct={deleteProduct}
                  formatPrice={formatPrice}
                  showLowStockOnly={false}
                  readOnly={false}
                />
              </TabsContent>
              
              <TabsContent value="advanced-reports" className="space-y-4">
                <SalesReport receipts={receipts} formatPrice={formatPrice} />
              </TabsContent>
            </Tabs>
          </TabsContent>

          <TabsContent value="receipt" className="space-y-4">
            {selectedReceipt ? (
              <Receipt 
                receipt={selectedReceipt} 
                formatPrice={formatPrice} 
                onBack={() => setSelectedReceipt(null)}
              />
            ) : (
              <ReceiptHistory 
                receipts={receipts}
                formatPrice={formatPrice}
                onViewReceipt={handleViewReceipt}
                onPrintReceipt={handlePrintThermal}
                onBackToPOS={() => setSelectedReceipt(null)}
              />
            )}
          </TabsContent>

          <TabsContent value="reports" className="space-y-4">
            <Card className="pos-card">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Ringkasan Penjualan Hari Ini
                  <Link to="/reports">
                    <Button variant="outline" size="sm" className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" />
                      Laporan Lengkap
                    </Button>
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-primary/10 rounded-lg">
                    <div className="text-2xl font-bold text-primary">{formatPrice(todayRevenue)}</div>
                    <div className="text-sm text-muted-foreground">Total Penjualan</div>
                  </div>
                  <div className="text-center p-4 bg-success/10 rounded-lg">
                    <div className="text-2xl font-bold text-success">{formatPrice(todayProfit)}</div>
                    <div className="text-sm text-muted-foreground">Keuntungan</div>
                  </div>
                  <div className="text-center p-4 bg-info/10 rounded-lg">
                    <div className="text-2xl font-bold text-info">{formatPrice(todayPhotocopyEarnings)}</div>
                    <div className="text-sm text-muted-foreground">Fotocopy</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Admin Protection Dialog */}
        <AdminProtection
          isOpen={showAdminProtection}
          onClose={() => setShowAdminProtection(false)}
          onSuccess={handleAdminSuccess}
          title="Akses Admin Diperlukan"
          description="Masukkan kata sandi admin untuk mengakses menu admin"
        />

        {/* Photocopy Dialog */}
        {photocopyProduct && (
          <PhotocopyDialog
            isOpen={showPhotocopyDialog}
            onClose={() => {
              setShowPhotocopyDialog(false);
              setPhotocopyProduct(null);
            }}
            product={photocopyProduct}
            onAddToCart={addToCart}
          />
        )}
      </div>
      </div>
    </OperatingHours>
  );
};
