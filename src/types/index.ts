export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  images: string[];
  category: string;
  stock?: number;
  tags?: string[];
  isNew?: boolean;
  isFeatured?: boolean;
  discount?: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  image?: string;
}

export interface CartItem extends Product {
  quantity: number;
}
