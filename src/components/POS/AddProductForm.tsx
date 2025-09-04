import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, X } from 'lucide-react';
import { Product } from '@/types/pos';
import { QuantitySelector } from './QuantitySelector';
import { toast } from 'sonner';

interface AddProductFormProps {
  onAddProduct: (product: Omit<Product, 'id'>) => void;
  onUpdateProduct: (productId: string, updates: Partial<Product>) => void;
  products: Product[];
  onClose: () => void;
}

export const AddProductForm = ({ onAddProduct, onUpdateProduct, products, onClose }: AddProductFormProps) => {
  const [formData, setFormData] = useState({
    name: '',
    costPrice: '',
    sellPrice: '',
    stock: '',
    category: '',
    isPhotocopy: false,
  });
  const [isService, setIsService] = useState(false);
  const [stockQuantity, setStockQuantity] = useState(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.sellPrice || !formData.costPrice || (!stockQuantity && !formData.isPhotocopy && !isService)) {
      return;
    }

    // Check if product with same name already exists
    const existingProduct = products.find(product => 
      product.name.toLowerCase() === formData.name.toLowerCase()
    );

    if (existingProduct) {
      // Update existing product - only add stock, prices are optional
      const updates: Partial<Product> = {
        stock: existingProduct.stock + stockQuantity
      };
      
      // Only update prices if they are different and provided
      if (formData.costPrice && parseFloat(formData.costPrice) !== existingProduct.costPrice) {
        updates.costPrice = parseFloat(formData.costPrice);
      }
      if (formData.sellPrice && parseFloat(formData.sellPrice) !== existingProduct.sellPrice) {
        updates.sellPrice = parseFloat(formData.sellPrice);
      }
      
      onUpdateProduct(existingProduct.id, updates);
      toast.success(`Stok ${existingProduct.name} berhasil ditambah ${stockQuantity} unit!`);
    } else {
      // Add new product
      onAddProduct({
        name: formData.name,
        costPrice: parseFloat(formData.costPrice),
        sellPrice: parseFloat(formData.sellPrice),
        stock: (formData.isPhotocopy || isService) ? 0 : stockQuantity,
        category: formData.category || undefined,
        isPhotocopy: formData.isPhotocopy,
      });
      toast.success(`Produk ${formData.name} berhasil ditambahkan!`);
    }

    setFormData({
      name: '',
      costPrice: '',
      sellPrice: '',
      stock: '',
      category: '',
      isPhotocopy: false,
    });
    setStockQuantity(0);
    setIsService(false);
    
    onClose();
  };

  return (
    <Card className="pos-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Tambah Produk/Layanan Baru
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="product" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="product">Produk</TabsTrigger>
            <TabsTrigger value="service">Layanan</TabsTrigger>
          </TabsList>
          
          <TabsContent value="product">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nama Produk *</Label>
                  <Input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => {
                      const name = e.target.value;
                      setFormData({ ...formData, name });
                      
                      // Auto-fill prices if product exists
                      const existingProduct = products.find(p => 
                        p.name.toLowerCase() === name.toLowerCase()
                      );
                      if (existingProduct && !formData.costPrice && !formData.sellPrice) {
                        setFormData(prev => ({
                          ...prev,
                          name,
                          costPrice: existingProduct.costPrice.toString(),
                          sellPrice: existingProduct.sellPrice.toString(),
                          category: existingProduct.category || ''
                        }));
                      }
                    }}
                    placeholder="Masukkan nama produk"
                    required
                    list="existing-products"
                  />
                  <datalist id="existing-products">
                    {products.map(product => (
                      <option key={product.id} value={product.name} />
                    ))}
                  </datalist>
                  {products.find(p => p.name.toLowerCase() === formData.name.toLowerCase()) && (
                    <div className="mt-1 text-xs text-info">
                      ℹ️ Produk sudah ada. Hanya menambah stok (harga opsional untuk update).
                    </div>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="costPrice">Harga Kulakan (opsional)</Label>
                  <Input
                    id="costPrice"
                    type="number"
                    value={formData.costPrice}
                    onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                    placeholder="0"
                    min="0"
                    step="100"
                    required={!products.find(p => p.name.toLowerCase() === formData.name.toLowerCase())}
                  />
                </div>
                
                <div>
                  <Label htmlFor="sellPrice">Harga Jual (opsional)</Label>
                  <Input
                    id="sellPrice"
                    type="number"
                    value={formData.sellPrice}
                    onChange={(e) => setFormData({ ...formData, sellPrice: e.target.value })}
                    placeholder="0"
                    min="0"
                    step="100"
                    required={!products.find(p => p.name.toLowerCase() === formData.name.toLowerCase())}
                  />
                </div>
                
                <div>
                  <Label htmlFor="category">Kategori</Label>
                  <Select 
                    value={formData.category} 
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih kategori" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Fotocopy">Fotocopy</SelectItem>
                      <SelectItem value="Alat Tulis">Alat Tulis</SelectItem>
                      <SelectItem value="ATK">ATK</SelectItem>
                      <SelectItem value="Kertas">Kertas</SelectItem>
                      <SelectItem value="Pramuka">Pramuka</SelectItem>
                      <SelectItem value="Lainnya">Lainnya</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="md:col-span-2">
                  <Label>Jumlah Stok *</Label>
                  <QuantitySelector
                    quantity={stockQuantity}
                    productName={formData.name}
                    category={formData.category}
                    onQuantityChange={setStockQuantity}
                    showUnitSelector={true}
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isPhotocopy"
                    checked={formData.isPhotocopy}
                    onChange={(e) => setFormData({ ...formData, isPhotocopy: e.target.checked })}
                    className="rounded border border-input"
                  />
                  <Label htmlFor="isPhotocopy" className="text-sm">
                    Layanan Fotocopy (Tiered Pricing)
                  </Label>
                </div>
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1" variant="success">
                  <Plus className="w-4 h-4 mr-2" />
                  Tambah Produk
                </Button>
                <Button type="button" variant="outline" onClick={onClose}>
                  Batal
                </Button>
              </div>
            </form>
          </TabsContent>
          
          <TabsContent value="service">
            <form onSubmit={(e) => { setIsService(true); handleSubmit(e); }} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="serviceName">Nama Layanan *</Label>
                  <Input
                    id="serviceName"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Masukkan nama layanan"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="serviceCost">Biaya Operasional *</Label>
                  <Input
                    id="serviceCost"
                    type="number"
                    value={formData.costPrice}
                    onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                    placeholder="0"
                    min="0"
                    step="100"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="servicePrice">Harga Layanan *</Label>
                  <Input
                    id="servicePrice"
                    type="number"
                    value={formData.sellPrice}
                    onChange={(e) => setFormData({ ...formData, sellPrice: e.target.value })}
                    placeholder="0"
                    min="0"
                    step="100"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="serviceCategory">Kategori</Label>
                  <Select 
                    value={formData.category} 
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih kategori" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Fotocopy">Fotocopy</SelectItem>
                      <SelectItem value="Laminasi">Laminasi</SelectItem>
                      <SelectItem value="Jilid">Jilid</SelectItem>
                      <SelectItem value="Scan">Scan</SelectItem>
                      <SelectItem value="Lainnya">Lainnya</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1" variant="success">
                  <Plus className="w-4 h-4 mr-2" />
                  Tambah Layanan
                </Button>
                <Button type="button" variant="outline" onClick={onClose}>
                  Batal
                </Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};