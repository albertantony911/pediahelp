import { notFound } from 'next/navigation';
import { client } from '@/sanity/lib/client';
import { groq } from 'next-sanity';
import DoctorProfileCard from '@/components/blocks/doctor/DoctorProfile';
import PostCard from '@/components/blocks/blog/PostCard';
import { Doctor, PostWithDoctor } from '@/types';

interface DoctorPageData {
  doctor: Doctor | null;
  posts: PostWithDoctor[];
}

const doctorPostsQuery = groq`
  {
    "doctor": *[_type == "doctor" && slug.current == $slug][0]{
      _id,
      name,
      specialty,
      photo { asset->{ url } },
      slug,
      expertise,
      experienceYears,
      whatsappNumber,
      appointmentFee,
      reviews[] { _id, name, rating, comment, submittedAt }
    },
    "posts": *[_type == "post" && doctor._ref == *[_type == "doctor" && slug.current == $slug][0]._id] | order(publishedAt desc){
      _id,
      title,
      slug,
      excerpt,
      publishedAt,
      mainImage { asset->{ url } }
    }
  }
`;

// Update the props type to handle params as a Promise
type DoctorPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function DoctorBlogPage({ params }: DoctorPageProps) {
  const { slug } = await params; // Resolve the Promise
  const data: DoctorPageData = await client.fetch(doctorPostsQuery, { slug });
  const { doctor, posts } = data;

  if (!doctor) return notFound();

  console.log('Fetched doctor data:', JSON.stringify(data, null, 2)); // Debug log

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 space-y-8">
      <DoctorProfileCard {...doctor} reviews={doctor.reviews || []} />
      <h2 className="text-2xl font-semibold text-gray-900 mt-6 mb-4">
        Articles by {doctor.name || 'Unknown Doctor'}
      </h2>
      {posts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <PostCard key={post._id} post={post} />
          ))}
        </div>
      ) : (
        <p className="text-gray-600 text-sm">No articles found.</p>
      )}
    </div>
  );
}