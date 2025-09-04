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
  addToCart: (product: Product, quantity?: number, customPrice?: number) => void;
  updateCartQuantity: (productId: string, quantity: number, finalPrice?: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  processTransaction: (paymentMethod?: string, discount?: number) => Receipt | null | Promise<Receipt | null>;
  addManualReceipt: (receipt: Receipt) => void | Promise<void>;
  formatPrice: (price: number) => string;
}

const POSContext = createContext<POSContextType | undefined>(undefined);

export const POSProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const supabasePOS = useSupabasePOS();
  const localPOS = usePOS();

  const addManualReceipt = async (receipt: Receipt) => {
    // Always use Supabase if user is logged in for consistent data
    if (user && supabasePOS.addManualReceipt) {
      await supabasePOS.addManualReceipt(receipt);
      return;
    }
    // Fallback for local storage when not logged in
    localPOS.addManualReceipt?.(receipt);
  };

  // Always use Supabase when user is logged in for real-time sync
  const currentPOS = user ? supabasePOS : localPOS;

  const contextValue = {
    ...currentPOS,
    addManualReceipt,
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