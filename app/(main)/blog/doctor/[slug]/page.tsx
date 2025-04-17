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
      image { asset->{ url } },
      mainImage { asset->{ url } }
    }
  }
`;

export default async function DoctorBlogPage({ params }: { params: { slug: string } }) {
  const data: DoctorPageData = await client.fetch(doctorPostsQuery, { slug: params.slug });
  const { doctor, posts } = data;

  if (!doctor) return notFound();

  console.log('Fetched doctor data:', JSON.stringify(data, null, 2)); // Debug log

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 space-y-8">
      <DoctorProfileCard
        name={doctor.name || 'Unknown Doctor'}
        specialty={doctor.specialty || 'N/A'}
        photo={doctor.photo || undefined}
        appointmentFee={doctor.appointmentFee || 0}
        reviews={doctor.reviews || []}
        slug={doctor.slug.current}
        expertise={doctor.expertise || []}
        experienceYears={doctor.experienceYears || 0}
        whatsappNumber={doctor.whatsappNumber || ''}
      />

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