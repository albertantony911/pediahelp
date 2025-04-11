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
  specialty: string;
  photo?: { asset?: { _id: string; url: string } };
  slug: { current: string };
  languages?: string[];
  appointmentFee: number;
  nextAvailableSlot?: string;
  about?: string; // Added missing field
  expertise?: string[];
  qualifications?: {
    experienceYears?: number;
    education?: string[];
    achievements?: string[];
    publications?: string[];
    others?: string[];
  };
  averageRating?: number | null;
  reviewCount?: number;
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
  appointmentFee: number;
  nextAvailableSlot?: string;
  rating?: number | null;
  reviewCount?: number;
  slug: string;
  expertise?: string[];
  experienceYears?: number;
}