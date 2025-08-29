import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, X } from 'lucide-react';
import { Product } from '@/types/pos';

interface AddProductFormProps {
  onAddProduct: (product: Omit<Product, 'id'>) => void;
  onClose: () => void;
}

export const AddProductForm = ({ onAddProduct, onClose }: AddProductFormProps) => {
  const [formData, setFormData] = useState({
    name: '',
    costPrice: '',
    sellPrice: '',
    stock: '',
    category: '',
    barcode: '',
    isPhotocopy: false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.sellPrice || !formData.costPrice || (!formData.stock && !formData.isPhotocopy)) {
      return;
    }

    onAddProduct({
      name: formData.name,
      costPrice: parseFloat(formData.costPrice),
      sellPrice: parseFloat(formData.sellPrice),
      stock: formData.isPhotocopy ? 0 : parseInt(formData.stock),
      category: formData.category || undefined,
      barcode: formData.barcode || undefined,
      isPhotocopy: formData.isPhotocopy,
    });

    setFormData({
      name: '',
      costPrice: '',
      sellPrice: '',
      stock: '',
      category: '',
      barcode: '',
      isPhotocopy: false,
    });
    
    onClose();
  };

  return (
    <Card className="pos-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Tambah Produk Baru
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Nama Produk *</Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Masukkan nama produk"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="costPrice">Harga Kulakan *</Label>
              <Input
                id="costPrice"
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
              <Label htmlFor="sellPrice">Harga Jual *</Label>
              <Input
                id="sellPrice"
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
              <Label htmlFor="stock">Stok {formData.isPhotocopy ? '(Opsional untuk layanan)' : '*'}</Label>
              <Input
                id="stock"
                type="number"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                placeholder="0"
                min="0"
                required={!formData.isPhotocopy}
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
                  <SelectItem value="Laminasi">Pramuka</SelectItem>
                  <SelectItem value="Lainnya">Lainnya</SelectItem>
                </SelectContent>
              </Select>
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
            
            <div className="md:col-span-2">
              <Label htmlFor="barcode">Barcode (Opsional)</Label>
              <Input
                id="barcode"
                type="text"
                value={formData.barcode}
                onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                placeholder="Scan atau masukkan barcode"
              />
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
      </CardContent>
    </Card>
  );
};