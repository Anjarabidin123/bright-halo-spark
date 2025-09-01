import { useState, useCallback } from 'react';
import { Product, CartItem, Receipt, POSState } from '@/types/pos';
import { toast } from '@/hooks/use-toast';

const initialProducts: Product[] = [
  { id: '1', name: 'Fotocopy A4', costPrice: 200, sellPrice: 300, stock: 0, category: 'Fotocopy', isPhotocopy: true },
  { id: '2', name: 'Pulpen Standar', costPrice: 2000, sellPrice: 3000, stock: 50, category: 'Alat Tulis' },
  { id: '3', name: 'Pensil 2B', costPrice: 1500, sellPrice: 2500, stock: 100, category: 'Alat Tulis' },
  { id: '4', name: 'Kertas A4 (Rim)', costPrice: 45000, sellPrice: 55000, stock: 20, category: 'Kertas' },
  { id: '5', name: 'Penggaris 30cm', costPrice: 3000, sellPrice: 5000, stock: 30, category: 'Alat Tulis' },
  { id: '6', name: 'Spidol Boardmarker', costPrice: 8000, sellPrice: 12000, stock: 25, category: 'Alat Tulis' },
  { id: '7', name: 'Kertas HVS A4 (Pack)', costPrice: 8000, sellPrice: 12000, stock: 40, category: 'Kertas' },
  { id: '8', name: 'Correction Pen/Tip-Ex', costPrice: 4000, sellPrice: 7000, stock: 15, category: 'Alat Tulis' },
];

export const usePOS = () => {
  const [posState, setPosState] = useState<POSState>({
    products: initialProducts,
    cart: [],
    receipts: [],
  });

  const addProduct = useCallback((product: Omit<Product, 'id'>) => {
    const newProduct: Product = {
      ...product,
      id: Date.now().toString(),
    };
    
    setPosState(prev => ({
      ...prev,
      products: [...prev.products, newProduct],
    }));
    
    toast({
      title: "Produk Ditambahkan",
      description: `${product.name} berhasil ditambahkan ke inventory`,
    });
  }, []);

  const updateProduct = useCallback((productId: string, updates: Partial<Product>) => {
    setPosState(prev => ({
      ...prev,
      products: prev.products.map(p => 
        p.id === productId ? { ...p, ...updates } : p
      ),
    }));
    
    toast({
      title: "Produk Diperbarui",
      description: "Produk berhasil diperbarui",
    });
  }, []);

  const addToCart = useCallback((product: Product, quantity: number = 1, customPrice?: number) => {
    // Special handling for photocopy
    if (product.isPhotocopy) {
      let finalPrice = customPrice || product.sellPrice;
      
      // Apply tiered pricing for photocopy
      if (!customPrice) {
        if (quantity >= 1000) {
          finalPrice = 260;
        } else if (quantity >= 400) {
          finalPrice = 275;
        } else if (quantity >= 150) {
          finalPrice = 285;
        }
      }

      setPosState(prev => {
        const existingItem = prev.cart.find(item => 
          item.product.id === product.id && item.finalPrice === finalPrice
        );
        
        if (existingItem) {
          return {
            ...prev,
            cart: prev.cart.map(item =>
              item.product.id === product.id && item.finalPrice === finalPrice
                ? { ...item, quantity: existingItem.quantity + quantity }
                : item
            ),
          };
        } else {
          return {
            ...prev,
            cart: [...prev.cart, { product, quantity, finalPrice }],
          };
        }
      });
      return;
    }

    // Regular products
    if (product.stock < quantity) {
      toast({
        title: "Stok Tidak Cukup",
        description: `Stok ${product.name} hanya tersisa ${product.stock}`,
        variant: "destructive",
      });
      return;
    }

    setPosState(prev => {
      const existingItem = prev.cart.find(item => item.product.id === product.id);
      
      if (existingItem) {
        const newQuantity = existingItem.quantity + quantity;
        if (newQuantity > product.stock && !product.isPhotocopy) {
          toast({
            title: "Stok Tidak Cukup",
            description: `Total quantity melebihi stok yang tersedia`,
            variant: "destructive",
          });
          return prev;
        }
        
        return {
          ...prev,
          cart: prev.cart.map(item =>
            item.product.id === product.id
              ? { ...item, quantity: newQuantity }
              : item
          ),
        };
      } else {
        return {
          ...prev,
          cart: [...prev.cart, { product, quantity }],
        };
      }
    });
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setPosState(prev => ({
      ...prev,
      cart: prev.cart.filter(item => item.product.id !== productId),
    }));
  }, []);

  const updateCartQuantity = useCallback((productId: string, quantity: number, finalPrice?: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setPosState(prev => {
      const cartItem = prev.cart.find(item => 
        item.product.id === productId && 
        (finalPrice ? item.finalPrice === finalPrice : true)
      );
      if (!cartItem) return prev;

      // Check stock for regular products
      if (!cartItem.product.isPhotocopy && quantity > cartItem.product.stock) {
        toast({
          title: "Stok Tidak Cukup",
          description: `Stok ${cartItem.product.name} hanya tersisa ${cartItem.product.stock}`,
          variant: "destructive",
        });
        return prev;
      }

      // Apply tiered pricing for photocopy when quantity changes
      let newFinalPrice = cartItem.finalPrice;
      if (cartItem.product.isPhotocopy && !finalPrice) {
        if (quantity >= 1000) {
          newFinalPrice = 260;
        } else if (quantity >= 400) {
          newFinalPrice = 275;
        } else if (quantity >= 150) {
          newFinalPrice = 285;
        } else {
          newFinalPrice = cartItem.product.sellPrice;
        }
      }

      return {
        ...prev,
        cart: prev.cart.map(item =>
          item.product.id === productId && (finalPrice ? item.finalPrice === finalPrice : true)
            ? { ...item, quantity, finalPrice: newFinalPrice }
            : item
        ),
      };
    });
  }, [removeFromCart]);

  const clearCart = useCallback(() => {
    setPosState(prev => ({
      ...prev,
      cart: [],
    }));
  }, []);

  const processTransaction = useCallback((paymentMethod: string = 'cash', discount: number = 0) => {
    const { cart, products, receipts } = posState;
    
    if (cart.length === 0) {
      toast({
        title: "Keranjang Kosong",
        description: "Tambahkan produk ke keranjang terlebih dahulu",
        variant: "destructive",
      });
      return null;
    }

    const subtotal = cart.reduce((sum, item) => {
      const price = item.finalPrice || item.product.sellPrice;
      return sum + (price * item.quantity);
    }, 0);
    
    const total = subtotal - discount; // Apply discount, no tax

    // Calculate profit
    const profit = cart.reduce((sum, item) => {
      const sellPrice = item.finalPrice || item.product.sellPrice;
      const costPrice = item.product.costPrice;
      return sum + ((sellPrice - costPrice) * item.quantity);
    }, 0);

    // Generate invoice ID with new format: INV-{counter}{DDMMYY}
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = String(now.getFullYear()).slice(-2);
    const dateStr = `${day}${month}${year}`;
    const counter = receipts.length + 1;
    const invoiceId = `INV-${counter}${dateStr}`;

    const receipt: Receipt = {
      id: invoiceId,
      items: [...cart],
      subtotal,
      discount,
      total,
      profit,
      timestamp: new Date(),
      paymentMethod,
    };

    // Update inventory (skip for photocopy as it's service-based)
    const updatedProducts = products.map(product => {
      if (product.isPhotocopy) return product; // Don't reduce stock for services
      
      const cartItem = cart.find(item => item.product.id === product.id);
      if (cartItem) {
        return {
          ...product,
          stock: product.stock - cartItem.quantity,
        };
      }
      return product;
    });

    setPosState(prev => ({
      ...prev,
      products: updatedProducts,
      cart: [],
      receipts: [...prev.receipts, receipt],
    }));

    toast({
      title: "Transaksi Berhasil",
      description: `Invoice ${receipt.id} berhasil dibuat. Profit: Rp${profit.toLocaleString('id-ID')}`,
    });

    return receipt;
  }, [posState]);

  const formatPrice = (price: number) => {
    return `Rp ${new Intl.NumberFormat('id-ID').format(price)}`;
  };

  return {
    ...posState,
    addProduct,
    updateProduct,
    addToCart,
    removeFromCart,
    updateCartQuantity,
    clearCart,
    processTransaction,
    formatPrice,
  };
};