import { groq } from 'next-sanity';
import { client } from '@/sanity/lib/client';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import OTPReviewForm from '@/components/blocks/forms/OTPReviewForm';

// 1. Define Types
interface Doctor {
  _id: string;
  name: string;
  slug: { current: string };
  photo?: {
    asset?: {
      _id: string;
      url: string;
    };
  };
  specialty: string;
  designation: string;
  location: string;
  languages?: string[];
  appointmentFee: number;
  nextAvailableSlot: string;
  about: string;
  ratings?: number;
  reviews?: string[];
  authoredArticles?: { title: string; slug: { current: string } }[];
  bookingId?: string;
  externalApiId?: string;
}

interface Review {
  _id: string;
  name: string;
  rating: number;
  comment: string;
  submittedAt: string;
}

// 2. Fetch Doctor by Slug
const getDoctorBySlug = async (slug: string): Promise<Doctor | null> => {
  try {
    return await client.fetch(
      groq`*[_type == "doctor" && slug.current == $slug][0]{
        _id,
        name,
        slug,
        photo {
          asset -> {
            _id,
            url
          }
        },
        specialty,
        designation,
        location,
        languages,
        appointmentFee,
        nextAvailableSlot,
        about,
        ratings,
        reviews,
        authoredArticles[]->{
          title,
          slug
        },
        bookingId,
        externalApiId
      }`,
      { slug }
    );
  } catch (error) {
    console.error(`Failed to fetch doctor with slug "${slug}":`, error);
    return null;
  }
};

// 3. Generate Static Params for Pre-rendering
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

// 4. Generate Metadata for SEO
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
    title: `${doctor.name} | Book Pediatric Consultation`,
    description: doctor.about || '',
  };
}

// 5. Doctor Page Component
export default async function DoctorPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const doctor: Doctor | null = await getDoctorBySlug(slug);

  if (!doctor) return notFound();

  // Normalize the doctor ID by removing the "drafts." prefix
  const doctorId = doctor._id.replace(/^drafts\./, '');

  // Fetch reviews for this doctor
  let reviews: Review[] = [];
  if (doctorId) {
    try {
      reviews = await client.fetch(
        groq`*[_type == "review" && doctor._ref == $id && approved == true] | order(submittedAt desc){
          _id,
          name,
          rating,
          comment,
          submittedAt
        }`,
        { id: doctorId }
      );
    } catch (error) {
      console.error(`Failed to fetch reviews for doctor with ID "${doctorId}":`, error);
      reviews = []; // Fallback to empty array
    }
  } else {
    console.error(`Doctor with slug "${slug}" is missing an _id field.`);
  }

  // Calculate the average rating
  const averageRating =
    reviews.length > 0
      ? (
          reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
        ).toFixed(1)
      : 'N/A';

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Profile Section */}
      <div className="flex flex-col md:flex-row items-center gap-6">
        <div className="w-40 h-40 relative rounded-full overflow-hidden">
          {doctor.photo?.asset?.url && (
            <Image
              src={doctor.photo.asset.url}
              alt={doctor.name}
              width={160}
              height={160}
              className="rounded-full object-cover"
            />
          )}
        </div>
        <div>
          <h1 className="text-2xl font-bold">{doctor.name}</h1>
          <p className="text-sm text-gray-600">{doctor.designation}</p>
          <p className="text-sm text-blue-600">{doctor.specialty}</p>
          {/* Display Average Rating */}
          <p className="text-sm mt-1 text-yellow-600">
            Average Rating: {averageRating} {averageRating !== 'N/A' && '⭐'} ({reviews.length} reviews)
          </p>
          <p className="text-sm mt-1">Languages: {doctor.languages?.join(', ') ?? 'Not specified'}</p>
          <p className="text-sm mt-1">Location: {doctor.location}</p>
          <p className="text-sm mt-1">Fee: ₹{doctor.appointmentFee}</p>
          <p className="text-sm mt-1 text-green-600">
            Next Available: {doctor.nextAvailableSlot ?? 'Not available'}
          </p>
        </div>
      </div>
      
      {/* CTA Buttons */}
      <div className="mt-10 flex gap-4">
        <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition">
          Book Consultation
        </button>
        <button className="border border-blue-600 text-blue-600 px-6 py-2 rounded-lg hover:bg-blue-50 transition">
          Ask Your Doctor
        </button>
      </div>
          
      {/* About Section */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-2">About the Doctor</h2>
        <p className="text-gray-700">{doctor.about ?? 'No information available.'}</p>
      </div>



      {/* Reviews Section */}
      <div className="mt-12">
        <h3 className="text-lg font-semibold mb-2">Ratings & Reviews</h3>
        {reviews.length === 0 ? (
          <p className="text-sm text-gray-500">No reviews yet.</p>
        ) : (
          <ul className="space-y-4">
            {reviews.map((review) => (
              <li key={review._id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{review.name}</p>
                  <p className="text-yellow-600">⭐ {review.rating}/5</p>
                </div>
                <p className="text-sm mt-2 text-gray-700">{review.comment}</p>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Review Form */}
      <OTPReviewForm doctorId={doctorId} />
    </div>
  );
}