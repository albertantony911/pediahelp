import { notFound } from 'next/navigation';
import { groq } from 'next-sanity';
import { client } from '@/sanity/lib/client';

import DoctorReview from '@/components/blocks/forms/feedback-form';
import DoctorReviews from '@/components/blocks/doctor/DoctorReviews';
import DoctorProfileCard from '@/components/blocks/doctor/DoctorProfile';
import Logo from '@/components/logo';
import { MapPin, Wallet } from 'lucide-react';

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
} from 'lucide-react';

import type { Doctor, Review } from '@/types';

export const revalidate = 86400;

/* ------------------- Data ------------------- */

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

export async function generateStaticParams() {
  const slugs: string[] = await client.fetch(
    groq`*[_type == "doctor" && defined(slug.current)][].slug.current`
  );
  return slugs.map((slug) => ({ slug }));
}

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

/* ------------------- Page ------------------- */

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
  const languagesCompact = (() => {
    if (!languages.length) return '—';
    const max = 6;
    const shownList = languages.slice(0, max);
    const extra = languages.length > max ? ` +${languages.length - max}` : '';
    return `${shownList.join(', ')}${extra}`;
  })();

  return (
    <>
      {/* Mobile-only SVG Logo */}
      <div className="w-full flex justify-center items-center bg-dark-shade lg:hidden">
        <Logo />
      </div>

      {/* Intro Section */}
      <div className="w-full bg-dark-shade">
        <div className="max-w-2xl mx-auto px-4 md:px-6 md:pt-36">
          <div className="rounded-2xl border border-white/15 bg-white/5 backdrop-blur-md shadow-[0_8px_30px_rgba(0,0,0,0.25)]">
           
            <div className="px-6 py-6 text-center">

            <p className="text-base md:text-lg text-gray-200">
              Trusted pediatric specialists on Pediahelp, verified and ready to support your child’s health with confidence.
            </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full bg-dark-shade">
        <div className="max-w-2xl mx-auto px-4 md:px-6 py-10 space-y-8">

          {/* 1) Doctor card */}
          <div className="animate-fade-in">
            <DoctorProfileCard {...doctor} reviews={reviews} />
          </div>

          {/* 2) Quick facts row (always 3 cols) */}
          <div className="grid grid-cols-3 gap-3 animate-fade-in">
            <TranslucentInfo
              label="Experience"
              value={
                typeof doctor.experienceYears === 'number' && doctor.experienceYears > 0
                  ? `${doctor.experienceYears}+ yrs`
                  : '—'
              }
            />
            <TranslucentInfo
              label="Consultation"
              value={doctor.appointmentFee ? `₹${doctor.appointmentFee}` : '—'}
            />
            <TranslucentInfo
              label="Languages"
              value={languagesCompact}
              valueClassName="text-[11px] leading-snug text-white/90"
            />
          </div>

          {/* 3) About the Doctor (glass + white inner block, WITH title) */}
          {doctor.about && (
            <div className="rounded-2xl bg-white/10 dark:bg-gray-800/10 backdrop-blur-md border border-white/20 dark:border-gray-500/20 shadow-lg transition-shadow hover:shadow-xl animate-fade-in">
              <div className="px-5 py-4">
                <h3 className="text-lg font-semibold text-gray-100">About the Doctor</h3>
              </div>
              <div className="p-5 pt-0">
                <WhiteBlock>
                  <p className="font-normal font-sans text-sm md:text-base leading-6 md:leading-7 tracking-normal text-gray-700 dark:text-gray-300  ">
                    {doctor.about}
                  </p>
                </WhiteBlock>
              </div>
            </div>
          )}

          {/* 4) Qualifications & Experience */}
          {(education.length || achievements.length || publications.length || others.length) > 0 && (
            <div className="rounded-2xl bg-white/10 dark:bg-gray-800/10 backdrop-blur-md border border-white/20 dark:border-gray-500/20 shadow-lg transition-shadow hover:shadow-xl animate-fade-in">
              <div className="px-5 py-4">
                <h3 className="text-lg font-semibold text-gray-100">Qualifications & Experience</h3>
              </div>
              <div className="p-5 pt-0 space-y-4">
                {education.length > 0 && (
                  <WhiteBlock
                    icon={<GraduationCap className="w-5 h-5 text-gray-600" />}
                    title="Education"
                    items={education}
                  />
                )}
                {achievements.length > 0 && (
                  <WhiteBlock
                    icon={<Award className="w-5 h-5 text-gray-600" />}
                    title="Achievements"
                    items={achievements}
                  />
                )}
                {publications.length > 0 && (
                  <WhiteBlock
                    icon={<BookOpenCheck className="w-5 h-5 text-gray-600" />}
                    title="Publications"
                    items={publications}
                  />
                )}
                {others.length > 0 && (
                  <WhiteBlock
                    icon={<MoreHorizontal className="w-5 h-5 text-gray-600" />}
                    title="Other Highlights"
                    items={others}
                  />
                )}
              </div>
            </div>
          )}

          {/* 5) Ratings & Reviews */}
          <Card className="bg-white/10 dark:bg-gray-800/10 backdrop-blur-md border border-white/20 dark:border-gray-500/20 shadow-lg hover:shadow-xl transition-shadow rounded-2xl animate-fade-in">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-100">
                Reviews from Parents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DoctorReviews reviews={reviews.slice(0, 3)} />
              {reviews.length > 3 && (
                <button className="mt-4 text-base text-gray-200 hover:underline">
                  See More Reviews
                </button>
              )}
            </CardContent>
          </Card>

          {/* 6) Review Form */}
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

/* ------------------- UI Helpers ------------------- */

function TranslucentInfo({
  label,
  value,
  children,
  valueClassName = '',
}: {
  label: string;
  value: string;
  children?: React.ReactNode;
  valueClassName?: string;
}) {
  return (
    <div className="rounded-2xl bg-white/10 dark:bg-gray-800/20 backdrop-blur-md border border-white/15 shadow-md px-4 py-3 flex flex-col items-center justify-center text-center min-h-[72px]">
      <div className="text-[11px] font-medium text-gray-200 tracking-wide uppercase">{label}</div>
      {value && (
        <div className={['mt-0.5 font-semibold text-white truncate max-w-full', valueClassName || 'text-sm'].join(' ')}>
          {value}
        </div>
      )}
      {children}
    </div>
  );
}

function WhiteBlock({
  icon,
  title,
  items,
  children,
}: {
  icon?: React.ReactNode;
  title?: string;
  items?: string[];
  children?: React.ReactNode;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-4 shadow-sm">
      {(icon || title) && (
        <div className="flex items-center gap-2 mb-2">
          {icon && <div className="p-1.5 rounded-md bg-gray-100 dark:bg-gray-700">{icon}</div>}
          {title && <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{title}</span>}
        </div>
      )}

      {Array.isArray(items) ? (
        <ul className="ml-4 list-disc space-y-1 text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
          {items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      ) : (
        <div className="text-gray-700 dark:text-gray-300">{children}</div>
      )}
    </div>
  );
}