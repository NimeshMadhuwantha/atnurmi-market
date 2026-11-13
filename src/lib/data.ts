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
  description: string;
  tone: string;
  note?: string;
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
};

export const categories = [
  "All",
  "Canvas Art",
  "Watercolour",
  "Colour Pencil",
  "Pencil Art",
  "Graphic Art",
  "Digital Art",
] as const;

export const artworks: Artwork[] = [
  {
    id: "blue-hour-coast",
    name: "Blue Hour Coast",
    artist: "Ari Senara",
    artistId: "ari-senara",
    category: "Canvas Art",
    price: 18500,
    size: "60 × 45 cm",
    medium: "Acrylic on canvas",
    materials: "Artist-grade acrylic, stretched cotton canvas",
    rating: 4.9,
    reviews: 28,
    delivery: "Free islandwide delivery",
    description: "A quiet meeting of sea and sky, layered by hand in deep ocean blues and soft mineral highlights.",
    tone: "ocean",
    note: "Signed original. Certificate of authenticity included.",
  },
  {
    id: "silent-gaze",
    name: "Silent Gaze",
    artist: "Nethmi Perera",
    artistId: "nethmi-perera",
    category: "Pencil Art",
    price: 8900,
    size: "A3 · 29.7 × 42 cm",
    medium: "Graphite pencil",
    materials: "Archival graphite on 220gsm acid-free paper",
    rating: 4.8,
    reviews: 41,
    delivery: "Cash on delivery",
    description: "A detailed graphite portrait study exploring light, texture, and the quiet strength of expression.",
    tone: "graphite",
  },
  {
    id: "garden-after-rain",
    name: "Garden After Rain",
    artist: "Savi Jayasekara",
    artistId: "savi-jayasekara",
    category: "Watercolour",
    price: 11200,
    size: "40 × 30 cm",
    medium: "Watercolour",
    materials: "Professional pigment on 300gsm cotton paper",
    rating: 4.7,
    reviews: 19,
    delivery: "Global delivery",
    description: "Loose botanical washes preserve the luminous calm of a tropical garden moments after rainfall.",
    tone: "garden",
  },
  {
    id: "golden-koi",
    name: "Golden Koi",
    artist: "Dinu Alwis",
    artistId: "dinu-alwis",
    category: "Colour Pencil",
    price: 13600,
    size: "A3 · 29.7 × 42 cm",
    medium: "Colour pencil",
    materials: "Wax-based pencils on textured archival board",
    rating: 5,
    reviews: 16,
    delivery: "Free islandwide delivery",
    description: "Richly layered colour-pencil work inspired by movement, good fortune, and reflected light.",
    tone: "koi",
  },
  {
    id: "midnight-orbit",
    name: "Midnight Orbit",
    artist: "Mika Fernando",
    artistId: "mika-fernando",
    category: "Graphic Art",
    price: 7200,
    size: "50 × 70 cm print",
    medium: "Digital mixed media",
    materials: "Museum-grade giclée print, 250gsm matte stock",
    rating: 4.9,
    reviews: 34,
    delivery: "Global delivery",
    description: "A limited-edition graphic composition balancing cosmic scale with crisp editorial geometry.",
    tone: "orbit",
  },
  {
    id: "cinnamon-fields",
    name: "Cinnamon Fields",
    artist: "Ari Senara",
    artistId: "ari-senara",
    category: "Canvas Art",
    price: 24900,
    size: "75 × 55 cm",
    medium: "Oil on canvas",
    materials: "Oil pigment on linen canvas",
    rating: 4.9,
    reviews: 22,
    delivery: "Insured delivery",
    description: "Earth, light, and distance meet in a warm Sri Lankan landscape painted in patient, tactile layers.",
    tone: "earth",
  },
];

export const artists: Artist[] = [
  { id: "ari-senara", name: "Ari Senara", initials: "AS", rating: 4.9, reviews: 50, specialties: ["Original Art", "Canvas"], location: "Galle, Sri Lanka", whatsapp: "94769963432", tone: "ocean" },
  { id: "nethmi-perera", name: "Nethmi Perera", initials: "NP", rating: 4.8, reviews: 41, specialties: ["Pencil Art", "Portraits"], location: "Colombo, Sri Lanka", whatsapp: "94769963432", tone: "graphite" },
  { id: "savi-jayasekara", name: "Savi Jayasekara", initials: "SJ", rating: 4.7, reviews: 19, specialties: ["Watercolour", "Custom Art"], location: "Kandy, Sri Lanka", whatsapp: "94769963432", tone: "garden" },
  { id: "mika-fernando", name: "Mika Fernando", initials: "MF", rating: 4.9, reviews: 34, specialties: ["Digital Art", "Graphic Art"], location: "Matara, Sri Lanka", whatsapp: "94769963432", tone: "orbit" },
];

export const formatPrice = (price: number) => `LKR ${new Intl.NumberFormat("en-LK").format(price)}`;

