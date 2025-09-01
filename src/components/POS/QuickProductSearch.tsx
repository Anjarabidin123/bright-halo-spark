import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, Package } from 'lucide-react';
import { Product } from '@/types/pos';

interface QuickProductSearchProps {
  products: Product[];
  onAddToCart: (product: Product, quantity?: number) => void;
  formatPrice: (price: number) => string;
}

export const QuickProductSearch = ({ products, onAddToCart, formatPrice }: QuickProductSearchProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredProducts = products
    .filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .slice(0, 5); // Limit to 5 results

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, filteredProducts.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && filteredProducts[selectedIndex]) {
      e.preventDefault();
      handleSelectProduct(filteredProducts[selectedIndex]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const handleSelectProduct = (product: Product) => {
    onAddToCart(product, 1);
    setSearchTerm('');
    setSelectedIndex(0);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <Button
        size="sm"
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-left justify-start"
      >
        <Plus className="h-3 w-3 mr-2" />
        Tambah Produk Cepat
      </Button>

      {isOpen && (
        <Card className="absolute top-full left-0 right-0 z-50 mt-1 shadow-lg">
          <CardContent className="p-3">
            <div className="relative mb-3">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                ref={inputRef}
                placeholder="Cari produk..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setSelectedIndex(0);
                }}
                onKeyDown={handleKeyDown}
                className="pl-9"
              />
            </div>

            {searchTerm.length > 0 && (
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {filteredProducts.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground text-sm">
                    <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    Produk tidak ditemukan
                  </div>
                ) : (
                  filteredProducts.map((product, index) => (
                    <div
                      key={product.id}
                      className={`p-2 rounded cursor-pointer transition-colors ${
                        index === selectedIndex 
                          ? 'bg-primary text-primary-foreground' 
                          : 'hover:bg-muted'
                      }`}
                      onClick={() => handleSelectProduct(product)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">
                            {product.name}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs opacity-75">
                              {formatPrice(product.sellPrice)}
                            </span>
                            {product.category && (
                              <Badge 
                                variant="secondary" 
                                className={`text-xs ${
                                  index === selectedIndex ? 'bg-primary-foreground/20' : ''
                                }`}
                              >
                                {product.category}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="ml-2">
                          {product.stock > 0 ? (
                            <Badge 
                              variant={product.stock <= 10 ? "destructive" : "outline"}
                              className={`text-xs ${
                                index === selectedIndex ? 'bg-primary-foreground/20' : ''
                              }`}
                            >
                              {product.stock}
                            </Badge>
                          ) : product.isPhotocopy ? (
                            <Badge 
                              variant="secondary"
                              className={`text-xs ${
                                index === selectedIndex ? 'bg-primary-foreground/20' : ''
                              }`}
                            >
                              Service
                            </Badge>
                          ) : (
                            <Badge 
                              variant="destructive"
                              className={`text-xs ${
                                index === selectedIndex ? 'bg-primary-foreground/20' : ''
                              }`}
                            >
                              Habis
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {searchTerm.length === 0 && (
              <div className="text-center text-xs text-muted-foreground py-2">
                Ketik untuk mencari produk...
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};