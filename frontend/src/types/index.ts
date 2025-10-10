export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  image_url?: string;
  stock_quantity: number;
  created_at: string;
  updated_at: string;
}

export interface CartItem {
  productId: number;
  quantity: number;
  price: number;
  name: string;
  image_url?: string;
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ProductsResponse {
  products: Product[];
  pagination: PaginationInfo;
}

export interface CheckoutData {
  cart: {
    productId: number;
    quantity: number;
    price: number;
  }[];
  billing: {
    name: string;
    email: string;
    address: string;
  };
}

export interface CheckoutResponse {
  message: string;
  orderId: number;
  totalAmount: number;
  transactionId: string;
  items: {
    productName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }[];
  billing: {
    name: string;
    email: string;
    address: string;
  };
  status: string;
  redirectUrl: string;
}
