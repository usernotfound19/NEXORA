export interface Product {
  id: string;
  title: string;
  slug: string;
  description: string;
  short_description?: string;
  brand: string;
  model?: string;
  sku: string;
  category_id: string;
  supplier_cost: number;
  selling_price: number;
  original_price: number;
  stock_quantity: number;
  status: 'published' | 'draft' | 'archived';
  is_featured: number | boolean;
  is_trending: number | boolean;
  primary_image: string;
  gallery_images: string[];
  specs: Record<string, string>;
  variants: Array<{
    label: string;
    options: string[];
  }>;
  warranty_info?: string;
  sales_count: number;
  profit?: number;
  margin_percent?: number;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  display_order: number;
}

export interface CartItem {
  productId: string;
  product: Product;
  quantity: number;
  selectedVariants: Record<string, string>;
  variantLabel: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_title: string;
  variant_label?: string;
  unit_price: number;
  quantity: number;
  total_price: number;
  product_image?: string;
}

export interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email?: string;
  customer_phone: string;
  division: string;
  district: string;
  address: string;
  postal_code?: string;
  notes?: string;
  subtotal: number;
  shipping_fee: number;
  discount_amount: number;
  total_amount: number;
  payment_method: 'bKash' | 'Nagad' | 'Cash on Delivery';
  payment_status: 'pending' | 'pending_cod' | 'awaiting_verification' | 'verified' | 'failed' | 'refunded';
  trx_id?: string;
  order_status: 'Order Placed' | 'Awaiting Payment Verification' | 'Order Confirmed' | 'Processing' | 'Shipped' | 'Out for Delivery' | 'Delivered' | 'Cancelled';
  courier_name?: string;
  tracking_number?: string;
  admin_notes?: string;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
}

export interface StoreSettings {
  store_name: string;
  direct_call_number: string;
  whatsapp_number: string;
  bkash_payment_number: string;
  nagad_payment_number: string;
  store_owner_email: string;
  initial_admin_username: string;
  shipping_inside_dhaka: string;
  shipping_outside_dhaka: string;
  free_shipping_threshold: string;
  announcement_text: string;
  bkash_instructions: string;
  nagad_instructions: string;
  resend_api_key?: string;
  email_from?: string;
}

export interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  phone?: string;
  role: 'admin' | 'customer';
}

export interface Review {
  id: string;
  product_id: string;
  customer_name: string;
  customer_phone?: string;
  rating: number;
  comment: string;
  is_verified_purchase: number;
  status: string;
  created_at: string;
}

export interface Coupon {
  code: string;
  discount_type: 'percent' | 'fixed';
  discount_value: number;
  calculated_discount: number;
}
