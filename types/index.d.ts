export type NavItem = {
  label: string;
  href: string;
  target: boolean;
};

export type BreadcrumbLink = {
  label: string;
  href: string;
};



export interface Doctor {
  _id: string;
  name: string;
  slug: { current: string };
  photo?: { asset?: { _id: string; url: string } };
  specialty: string;
  location?: string;
  languages?: string[]; // ✅ add this if not already
  appointmentFee: number;
  nextAvailableSlot?: string;
  about?: string;
  expertise?: string[];
  authoredArticles?: { title: string; slug: { current: string } }[];
  bookingId?: string;
  externalApiId?: string;
  qualifications?: {
    education?: string[];
    achievements?: string[];
    publications?: string[];
    others?: string[];
  };
  averageRating?: number;
  experienceYears?: number;
  whatsappNumber?: string; // ✅ add this too
  reviewCount?: number;
  reviews?: Review[]; 
}

export interface Review {
  _id: string;
  name: string;
  rating: number;
  comment: string;
  submittedAt: string;
}

export interface DoctorProfileCardProps {
  name: string;
  specialty: string;
  photo?: { asset?: { url: string } };
  languages?: string[];
  appointmentFee?: number;
  nextAvailableSlot?: string;
  rating?: number | null;
  reviewCount?: number;
  slug: string;
  expertise?: string[];
  experienceYears?: number;
  whatsappNumber?: string;
  reviews?: Review[];
  
}


export interface PostWithDoctor {
  _id: string;
  title: string;
  slug: { current: string };
  excerpt: string;
  publishedAt: string;
  image?: { asset?: { url: string } };
  mainImage?: { asset?: { url: string } };
  categories?: Category[];
  searchKeywords?: string[];
  imageUrl?: string;
  body?: any;

  meta_title?: string;
  meta_description?: string;
  ogImage?: { asset?: { url: string } };

  doctor?: Pick<
    Doctor,
    | '_id'
    | 'name'
    | 'slug'
    | 'photo'
    | 'specialty'
    | 'experienceYears'
    | 'expertise'
    | 'whatsappNumber'
    | 'reviews'
    | 'appointmentFee'
  >;
}

export interface Category {
  _id: string;
  title: string;
}