export interface Product {
  id: string;
  name: string;
  costPrice: number; // Harga kulakan
  sellPrice: number; // Harga jual
  stock: number;
  barcode?: string;
  category?: string;
  isPhotocopy?: boolean; // Special handling untuk fotocopy
}

export interface CartItem {
  product: Product;
  quantity: number;
  finalPrice?: number; // For photocopy tiered pricing
}

export interface Receipt {
  id: string;
  invoiceNumber?: string; // Human-readable invoice code (e.g., inv-123456)
  items: CartItem[];
  subtotal: number;
  discount: number; // Discount amount
  total: number; // After discount, no tax
  profit: number; // Total profit from this transaction
  timestamp: Date;
  paymentMethod?: string;
}

export interface POSState {
  products: Product[];
  cart: CartItem[];
  receipts: Receipt[];
}