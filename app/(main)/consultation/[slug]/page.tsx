import { notFound } from 'next/navigation';
import { groq } from 'next-sanity';
import { client } from '@/sanity/lib/client';

import DoctorReview from '@/components/blocks/forms/feedback-form';
import DoctorReviews from '@/components/blocks/doctor/DoctorReviews';
import DoctorProfileCard from '@/components/blocks/doctor/DoctorProfile';
import Logo from '@/components/logo';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import {
  GraduationCap,
  Award,
  BookOpenCheck,
  MoreHorizontal,
  User,
} from 'lucide-react';

import type { Doctor, Review } from '@/types';

export const revalidate = 86400;

// 1. Fetch the doctor by slug
const getDoctorBySlug = async (slug: string): Promise<Doctor | null> => {
  try {
    return await client.fetch(
      groq`*[_type == "doctor" && slug.current == $slug][0]{
        _id,
        name,
        slug,
        email,
        phone,
        photo { asset->{ _id, url } },
        specialty,
        location,
        languages,
        appointmentFee,
        nextAvailableSlot,
        about,
        expertise,
        authoredArticles[]->{ title, slug },
        bookingId,
        externalApiId,
        qualifications,
        averageRating,
        experienceYears,
        whatsappNumber
      }`,
      { slug }
    );
  } catch (error) {
    console.error(`Error fetching doctor: ${slug}`, error);
    return null;
  }
};

// 2. Build static params from slugs
export async function generateStaticParams() {
  const slugs: string[] = await client.fetch(
    groq`*[_type == "doctor" && defined(slug.current)][].slug.current`
  );
  return slugs.map((slug) => ({ slug }));
}

// 3. Generate metadata for SEO
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const doctor = await getDoctorBySlug(slug);

  return doctor
    ? {
        title: `${doctor.name} | Book Pediatric Consultation`,
        description: doctor.about || '',
      }
    : {
        title: 'Doctor not found | Pediahelp',
        description: 'We could not find the doctor you were looking for.',
      };
}

// 4. Main Page Component
export default async function DoctorPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const doctor = await getDoctorBySlug(slug);
  if (!doctor) return notFound();

  const doctorId = doctor._id.replace(/^drafts\./, '');

  let reviews: Review[] = [];
  try {
    reviews = await client.fetch(
      groq`*[_type == "review" && doctor._ref == $id && approved == true] | order(submittedAt desc){
        _id, name, rating, comment, submittedAt
      }`,
      { id: doctorId }
    );
  } catch (error) {
    console.error('Failed to fetch reviews:', error);
  }

  const {
    education = [],
    achievements = [],
    publications = [],
    others = [],
  } = doctor.qualifications || {};

  const languages = Array.isArray(doctor.languages) ? doctor.languages : [];

  return (
    <>
      {/* Mobile-only SVG Logo */}
      <div className="w-full flex justify-center items-center bg-white lg:hidden">
        <Logo />
      </div>

      {/* Title Section (Meet the Doctor) */}
      <div className="w-full bg-gradient-to-b from-dark-shade to-gray-800 lg:pt-40">
        <div className="max-w-5xl mx-auto px-4 py-8 text-center text-gray-100">
          <h1 className="text-3xl md:text-4xl font-bold mb-2 animate-fade-in">
            Meet {doctor.name}
          </h1>
          <p className="text-lg md:text-xl text-gray-300 animate-fade-in">
            Your Trusted {doctor.specialty || 'Pediatric Specialist'}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full bg-dark-shade">
        <div className="max-w-3xl mx-auto px-4 md:px-6 py-10 space-y-8">
          {/* Doctor Profile (Unchanged) */}
          <div className="border border-gray-100 shadow-md rounded-2xl animate-fade-in">
            <DoctorProfileCard {...doctor} reviews={reviews} />
          </div>

          {/* About the Doctor */}
          {doctor.about && (
            <Card className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-md hover:shadow-lg transition-shadow rounded-2xl animate-fade-in">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  About the Doctor
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-base text-gray-700 dark:text-gray-300 whitespace-pre-line">{doctor.about}</p>
              </CardContent>
            </Card>
          )}

          {/* Qualifications & Experience */}
          <Card className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-md hover:shadow-lg transition-shadow rounded-2xl animate-fade-in">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Qualifications & Experience
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 text-base text-gray-700 dark:text-gray-300">
              {education.length > 0 && (
                <QualificationBlock icon={<GraduationCap className="w-5 h-5 text-gray-600 dark:text-gray-300 p-1 rounded-full bg-gray-200 dark:bg-gray-700" />} title="Education" items={education} />
              )}
              {achievements.length > 0 && (
                <QualificationBlock icon={<Award className="w-5 h-5 text-gray-600 dark:text-gray-300 p-1 rounded-full bg-gray-200 dark:bg-gray-700" />} title="Achievements" items={achievements} />
              )}
              {publications.length > 0 && (
                <QualificationBlock icon={<BookOpenCheck className="w-5 h-5 text-gray-600 dark:text-gray-300 p-1 rounded-full bg-gray-200 dark:bg-gray-700" />} title="Publications" items={publications} />
              )}
              {others.length > 0 && (
                <QualificationBlock icon={<MoreHorizontal className="w-5 h-5 text-gray-600 dark:text-gray-300 p-1 rounded-full bg-gray-200 dark:bg-gray-700" />} title="Other Highlights" items={others} />
              )}
              {languages.length > 0 && (
                <QualificationBlock icon={<User className="w-5 h-5 text-gray-600 dark:text-gray-300 p-1 rounded-full bg-gray-200 dark:bg-gray-700" />} title="Languages Known" items={languages} />
              )}
            </CardContent>
          </Card>

          {/* Ratings & Reviews (Glassmorphism Effect) */}
          <Card className="bg-white/10 dark:bg-gray-800/10 backdrop-blur-md border border-white/20 dark:border-gray-500/20 shadow-lg hover:shadow-xl transition-shadow rounded-2xl animate-fade-in">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Ratings & Reviews
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DoctorReviews reviews={reviews.slice(0, 3)} />
              {reviews.length > 3 && (
                <button className="mt-4 text-base text-gray-600 dark:text-gray-300 hover:underline">
                  See More Reviews
                </button>
              )}
            </CardContent>
          </Card>

          {/* Review Form (Submit Your Feedback) (Glassmorphism Effect) */}
          <div className="mx-auto animate-fade-in">
            <DoctorReview doctorId={doctorId} />
          </div>
        </div>
      </div>

      {/* Wave Divider */}
      <div className="w-screen h-[100px] relative">
        <img
          src="/waves/dark-to-white-desktop-1.svg"
          alt="Wave divider desktop"
          className="hidden lg:block w-full h-full object-cover absolute top-0 left-0"
        />
        <img
          src="/waves/dark-to-white-mobile-1.svg"
          alt="Wave divider mobile"
          className="lg:hidden w-full h-full object-cover absolute top-0 left-0"
        />
      </div>
    </>
  );
}

// Reusable QualificationBlock
function QualificationBlock({
  icon,
  title,
  items,
}: {
  icon: React.ReactNode;
  title: string;
  items: string[];
}) {
  return (
    <div>
      <div className="flex items-center gap-3 font-medium text-gray-900 dark:text-gray-100 mb-2">
        {icon}
        <span className="text-base">{title}</span>
      </div>
      <ul className="ml-4 list-disc space-y-1 text-gray-700 dark:text-gray-300 text-base leading-relaxed">
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </div>
  );
}