import React, { createContext, useContext, ReactNode } from 'react';
import { usePOS } from '@/hooks/usePOS';
import { CartItem, Product, Receipt } from '@/types/pos';

interface POSContextType {
  products: Product[];
  cart: CartItem[];
  receipts: Receipt[];
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (productId: string, updates: Partial<Product>) => void;
  addToCart: (product: Product, quantity?: number, customPrice?: number) => void;
  updateCartQuantity: (productId: string, quantity: number, finalPrice?: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  processTransaction: (paymentMethod?: string, discount?: number) => Receipt | null;
  formatPrice: (price: number) => string;
}

const POSContext = createContext<POSContextType | undefined>(undefined);

export const POSProvider = ({ children }: { children: ReactNode }) => {
  const posHook = usePOS();

  return (
    <POSContext.Provider value={posHook}>
      {children}
    </POSContext.Provider>
  );
};

export const usePOSContext = () => {
  const context = useContext(POSContext);
  if (context === undefined) {
    throw new Error('usePOSContext must be used within a POSProvider');
  }
  return context;
};