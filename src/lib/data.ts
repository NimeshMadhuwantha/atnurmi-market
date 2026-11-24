export type Artwork = {
  id: string;
  name: string;
  artist: string;
  artistId: string;
  category: string;
  price: number;
  size: string;
  medium: string;
  materials: string;
  rating: number;
  reviews: number;
  delivery: string;
  deliveryCharge?: number;
  description: string;
  tone: string;
  note?: string;
  imageUrls?: string[];
};

export type Artist = {
  id: string;
  name: string;
  initials: string;
  rating: number;
  reviews: number;
  specialties: string[];
  location: string;
  whatsapp: string;
  tone: string;
  photoUrl?: string;
};

export const categories = ["All", "Canvas Art", "Watercolour", "Colour Pencil", "Pencil Art", "Graphic Art", "Digital Art"] as const;
export const formatPrice = (price: number) => `LKR ${new Intl.NumberFormat("en-LK").format(price)}`;

