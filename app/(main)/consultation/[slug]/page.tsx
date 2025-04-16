import { notFound } from 'next/navigation';
import { groq } from 'next-sanity';
import { client } from '@/sanity/lib/client';

import DoctorReview from '@/components/blocks/forms/doctor-review';
import DoctorReviews from '@/components/blocks/doctor/DoctorReviews';
import DoctorProfileCard from '@/components/blocks/doctor/DoctorProfile';

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

import { Doctor, Review } from '@/types';

export const revalidate = 86400;

const getDoctorBySlug = async (slug: string): Promise<Doctor | null> => {
  try {
    return await client.fetch(
      groq`*[_type == "doctor" && slug.current == $slug][0]{
        _id,
        name,
        slug,
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
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-10">
      <DoctorProfileCard
        name={doctor.name}
        specialty={doctor.specialty}
        photo={doctor.photo}
        appointmentFee={doctor.appointmentFee}
        rating={doctor.averageRating}
        reviewCount={reviews.length}
        slug={doctor.slug.current}
        expertise={doctor.expertise}
        experienceYears={doctor.experienceYears}
        whatsappNumber={doctor.whatsappNumber}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Qualifications & Experience</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 text-sm text-gray-800">
          {education.length > 0 && (
            <QualificationBlock
              icon={<GraduationCap className="w-4 h-4" />}
              title="Education"
              items={education}
            />
          )}
          {achievements.length > 0 && (
            <QualificationBlock
              icon={<Award className="w-4 h-4" />}
              title="Achievements"
              items={achievements}
            />
          )}
          {publications.length > 0 && (
            <QualificationBlock
              icon={<BookOpenCheck className="w-4 h-4" />}
              title="Publications"
              items={publications}
            />
          )}
          {others.length > 0 && (
            <QualificationBlock
              icon={<MoreHorizontal className="w-4 h-4" />}
              title="Other Highlights"
              items={others}
            />
          )}
          {languages.length > 0 && (
            <QualificationBlock
              icon={<User className="w-4 h-4" />}
              title="Languages Known"
              items={languages}
            />
          )}
        </CardContent>
      </Card>

      {doctor.about && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">About the Doctor</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-800 whitespace-pre-line">{doctor.about}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Ratings & Reviews</CardTitle>
        </CardHeader>
        <CardContent>
          <DoctorReviews reviews={reviews} />
        </CardContent>
      </Card>

      <DoctorReview doctorId={doctorId} />
    </div>
  );
}

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
      <div className="flex items-center gap-2 font-semibold text-gray-900 mb-1">
        {icon}
        <span className="text-base">{title}</span>
      </div>
      <ul className="ml-6 list-disc space-y-1 text-gray-700 text-[15px] leading-relaxed">
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </div>
  );
}