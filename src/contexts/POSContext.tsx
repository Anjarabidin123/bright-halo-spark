import React, { createContext, useContext, ReactNode, useState } from 'react';
import { useSupabasePOS } from '@/hooks/useSupabasePOS';
import { usePOS } from '@/hooks/usePOS';
import { CartItem, Product, Receipt } from '@/types/pos';
import { useAuth } from '@/contexts/AuthContext';

interface POSContextType {
  products: Product[];
  cart: CartItem[];
  receipts: Receipt[];
  loading?: boolean;
  addProduct: (product: Omit<Product, 'id'>) => void | Promise<void>;
  updateProduct: (productId: string, updates: Partial<Product>) => void | Promise<void>;
  deleteProduct?: (productId: string) => void | Promise<void>;
  addToCart: (product: Product, quantity?: number, customPrice?: number) => void;
  updateCartQuantity: (productId: string, quantity: number, finalPrice?: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  processTransaction: (paymentMethod?: string, discount?: number) => Receipt | null | Promise<Receipt | null>;
  processManualTransaction?: (cart: CartItem[], paymentMethod?: string, discount?: number) => Promise<Receipt | null>;
  addManualReceipt: (receipt: Receipt) => void;
  formatPrice: (price: number) => string;
}

const POSContext = createContext<POSContextType | undefined>(undefined);

export const POSProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const supabasePOS = useSupabasePOS();
  const localPOS = usePOS();
  const [manualReceipts, setManualReceipts] = useState<Receipt[]>([]);

  const addManualReceipt = (receipt: Receipt) => {
    setManualReceipts(prev => [...prev, receipt]);
  };

  // Use Supabase data when user is logged in, otherwise use local data
  const currentPOS = user ? supabasePOS : localPOS;
  const allReceipts = [...currentPOS.receipts, ...manualReceipts];

  const contextValue = {
    ...currentPOS,
    receipts: allReceipts,
    addManualReceipt,
    processManualTransaction: user ? supabasePOS.processManualTransaction : undefined,
  };

  return (
    <POSContext.Provider value={contextValue}>
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