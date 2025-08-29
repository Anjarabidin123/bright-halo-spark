import { useState } from 'react';
import { Product } from '@/types/pos';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { Copy, Calculator } from 'lucide-react';

interface PhotocopyDialogProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  onAddToCart: (product: Product, quantity: number, customPrice?: number) => void;
}

export const PhotocopyDialog = ({ isOpen, onClose, product, onAddToCart }: PhotocopyDialogProps) => {
  const [quantity, setQuantity] = useState(1);
  const [customPrice, setCustomPrice] = useState('');
  const [useCustomPrice, setUseCustomPrice] = useState(false);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getTieredPrice = (qty: number) => {
    if (qty >= 1000) return 260;
    if (qty >= 400) return 275;
    if (qty >= 150) return 285;
    return product.sellPrice;
  };

  const finalPrice = useCustomPrice && customPrice ? 
    parseFloat(customPrice) : getTieredPrice(quantity);
  const totalPrice = finalPrice * quantity;

  const handleSubmit = () => {
    const priceToUse = useCustomPrice && customPrice ? 
      parseFloat(customPrice) : getTieredPrice(quantity);
    onAddToCart(product, quantity, priceToUse);
    onClose();
    setQuantity(1);
    setCustomPrice('');
    setUseCustomPrice(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Copy className="h-5 w-5" />
            Fotocopy A4
          </DialogTitle>
          <DialogDescription>
            Masukkan jumlah lembar fotocopy dan pilih harga
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Quantity Input */}
          <div>
            <Label htmlFor="quantity">Jumlah Lembar</Label>
            <Input
              id="quantity"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              placeholder="Masukkan jumlah lembar"
              min="1"
              className="text-lg"
            />
          </div>

          {/* Tiered Pricing Display */}
          <Card className="p-4 bg-secondary/20">
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              Harga Otomatis Berdasarkan Quantity
            </h4>
            <div className="space-y-2 text-sm">
              <div className={`flex justify-between p-2 rounded ${quantity < 150 ? 'bg-primary/20 font-semibold' : ''}`}>
                <span>1 - 149 lembar</span>
                <span>{formatPrice(product.sellPrice)}</span>
              </div>
              <div className={`flex justify-between p-2 rounded ${quantity >= 150 && quantity < 400 ? 'bg-primary/20 font-semibold' : ''}`}>
                <span>150 - 399 lembar</span>
                <span>{formatPrice(285)}</span>
              </div>
              <div className={`flex justify-between p-2 rounded ${quantity >= 400 && quantity < 1000 ? 'bg-primary/20 font-semibold' : ''}`}>
                <span>400 - 999 lembar</span>
                <span>{formatPrice(275)}</span>
              </div>
              <div className={`flex justify-between p-2 rounded ${quantity >= 1000 ? 'bg-primary/20 font-semibold' : ''}`}>
                <span>1000+ lembar</span>
                <span>{formatPrice(260)}</span>
              </div>
            </div>
          </Card>

          {/* Custom Price Option */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="useCustomPrice"
                checked={useCustomPrice}
                onChange={(e) => setUseCustomPrice(e.target.checked)}
                className="rounded border border-input"
              />
              <Label htmlFor="useCustomPrice" className="text-sm">
                Gunakan harga custom
              </Label>
            </div>
            
            {useCustomPrice && (
              <Input
                type="number"
                value={customPrice}
                onChange={(e) => setCustomPrice(e.target.value)}
                placeholder="Harga per lembar (Rp)"
                min="0"
                step="50"
              />
            )}
          </div>

          {/* Summary */}
          <Card className="p-4 bg-primary/10">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Quantity:</span>
                <span className="font-semibold">{quantity} lembar</span>
              </div>
              <div className="flex justify-between">
                <span>Harga per lembar:</span>
                <span className="font-semibold">{formatPrice(finalPrice)}</span>
              </div>
              <div className="border-t pt-2">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span className="text-primary">{formatPrice(totalPrice)}</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Batal
            </Button>
            <Button className="flex-1" variant="success" onClick={handleSubmit}>
              Tambah ke Keranjang
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};