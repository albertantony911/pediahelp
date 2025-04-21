import type { Slug } from "@/sanity.types";

// ✅ Navigation & Breadcrumbs
export type NavItem = {
  label: string;
  href: string;
  target: boolean;
};

export type BreadcrumbLink = {
  label: string;
  href: string;
};

// ✅ Core Review Type
export interface Review {
  _id: string;
  name: string;
  rating: number;
  comment: string;
  submittedAt: string;
}

// ✅ Core Doctor Type (used for all pages)
export interface Doctor {
  _id: string;
  name: string;
  slug: { current: string };
  photo?: { asset?: { _id: string; url: string } };
  specialty: string;
  location?: string;
  languages?: string[];
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
  whatsappNumber?: string;
  reviewCount?: number;
  reviews?: Review[];
}

// ✅ Doctor Card Props (renamed to match actual component)
export interface DoctorProfileCard extends Pick<
  Doctor,
  | 'name'
  | 'specialty'
  | 'photo'
  | 'appointmentFee'
  | 'slug'
  | 'expertise'
  | 'experienceYears'
  | 'whatsappNumber'
  | 'reviews'
  | 'nextAvailableSlot'
  | 'languages'
> {}

// ✅ Blog Post Type (with linked doctor author)
export interface Post {
  _id: string;
  title: string;
  slug: { current: string };
  excerpt?: string;
  publishedAt?: string;
  body?: any;
  image?: { asset?: { url: string } };
  mainImage?: { asset?: { url: string } };
  imageUrl?: string;
  meta_title?: string;
  meta_description?: string;
  ogImage?: { asset?: { url: string } };
  noindex?: boolean;

  categories?: Category[];
  searchKeywords?: string[];

  // Doctor author reference
  doctorAuthor?: Doctor;
}

// ✅ Extended PostWithDoctor Type
export type PostWithDoctor = POST_QUERYResult & { doctorAuthor?: Doctor };

// ✅ Category Type
export interface Category {
  _id: string;
  title: string;
  slug: { current: string };
}

export type BlogPreview = {
  _id: string;
  title: string | null;
  slug: Slug | null;
  excerpt: string | null;
  image?: {
    asset?: {
      _id: string;
      url: string | null;
      metadata?: {
        lqip?: string | null;
        dimensions?: {
          width?: number | null;
          height?: number | null;
        };
      };
    };
    alt?: string | null;
  };
  author?: { name?: string | null };
  categories?: Array<{ _id: string; title?: string | null }>;
};