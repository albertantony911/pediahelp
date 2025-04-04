// consultation/[slug]/calendar/page.tsx
import { groq } from 'next-sanity';
import { client } from '@/sanity/lib/client';
import { notFound } from 'next/navigation';

interface Doctor {
  _id: string;
  name: string;
  slug: { current: string };
  bookingId?: string;
}

const getDoctorBySlug = async (slug: string): Promise<Doctor | null> => {
  try {
    return await client.fetch(
      groq`*[_type == "doctor" && slug.current == $slug][0]{
        _id,
        name,
        slug,
        bookingId
      }`,
      { slug }
    );
  } catch (error) {
    console.error(`Failed to fetch doctor with slug "${slug}":`, error);
    return null;
  }
};

export async function generateStaticParams() {
  try {
    const slugs = await client.fetch(
      groq`*[_type == "doctor" && defined(slug.current)][].slug.current`
    );
    return slugs.map((slug: string) => ({ slug }));
  } catch (error) {
    console.error('Failed to generate static params for doctors:', error);
    return [];
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const doctor: Doctor | null = await getDoctorBySlug(slug);

  if (!doctor) {
    return {
      title: 'Doctor not found | Pediahelp',
      description: 'We could not find the doctor you were looking for.',
    };
  }

  return {
    title: `Book a Consultation with ${doctor.name} | Pediahelp`,
    description: `Schedule an appointment with ${doctor.name}.`,
  };
}

export default async function CalendarPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const doctor: Doctor | null = await getDoctorBySlug(slug);

  if (!doctor) return notFound();

  if (!doctor.bookingId) {
    return <div className="text-red-500">Error: No booking ID available for this doctor.</div>;
  }

  const bookingIdMatch = doctor.bookingId.match(/\/i\/([a-zA-Z0-9]+)$/);
  const bookingId = bookingIdMatch ? bookingIdMatch[1] : null;

  if (!bookingId) {
    return <div className="text-red-500">Error: Invalid booking URL format.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold">Book a Consultation with {doctor.name}</h1>
      <iframe
        src={`https://zcal.co/i/${bookingId}`}
        width="100%"
        height="600px"
        title="Booking Calendar"
        className="mt-4"
      />
    </div>
  );
}