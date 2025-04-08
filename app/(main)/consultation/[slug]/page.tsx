import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { groq } from 'next-sanity'
import { client } from '@/sanity/lib/client'
import DoctorReview from '@/components/blocks/forms/doctor-review'
import DoctorReviews from '@/components/blocks/DoctorReviews'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@/components/ui/card'

export const revalidate = 86400

interface Doctor {
  _id: string
  name: string
  slug: { current: string }
  photo?: { asset?: { _id: string; url: string } }
  specialty: string
  designation: string
  location: string
  languages?: string[]
  appointmentFee: number
  nextAvailableSlot: string
  about: string
  ratings?: number
  reviews?: string[]
  authoredArticles?: { title: string; slug: { current: string } }[]
  bookingId?: string
  externalApiId?: string
}

interface Review {
  _id: string
  name: string
  rating: number
  comment: string
  submittedAt: string
}

const getDoctorBySlug = async (slug: string): Promise<Doctor | null> => {
  try {
    return await client.fetch(
      groq`*[_type == "doctor" && slug.current == $slug][0]{
        _id, name, slug, photo { asset->{ _id, url } }, specialty, designation, location,
        languages, appointmentFee, nextAvailableSlot, about, ratings, reviews,
        authoredArticles[]->{ title, slug }, bookingId, externalApiId
      }`,
      { slug }
    )
  } catch (error) {
    console.error(`Error fetching doctor: ${slug}`, error)
    return null
  }
}

export async function generateStaticParams() {
  const slugs: string[] = await client.fetch(
    groq`*[_type == "doctor" && defined(slug.current)][].slug.current`
  )
  return slugs.map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const doctor = await getDoctorBySlug(slug)
  return doctor
    ? {
        title: `${doctor.name} | Book Pediatric Consultation`,
        description: doctor.about || ''
      }
    : {
        title: 'Doctor not found | Pediahelp',
        description: 'We could not find the doctor you were looking for.'
      }
}

export default async function DoctorPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const doctor = await getDoctorBySlug(slug)
  if (!doctor) return notFound()

  const doctorId = doctor._id.replace(/^drafts\./, '')

  let reviews: Review[] = []
  try {
    reviews = await client.fetch(
      groq`*[_type == "review" && doctor._ref == $id && approved == true] | order(submittedAt desc){
        _id, name, rating, comment, submittedAt
      }`,
      { id: doctorId }
    )
  } catch (error) {
    console.error('Failed to fetch reviews:', error)
  }

  const averageRating =
    reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : 'N/A'

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-10">
      {/* Doctor Profile Card */}
      <Card>
        <CardHeader className="flex flex-col md:flex-row items-center gap-6">
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
            <CardTitle className="text-2xl">{doctor.name}</CardTitle>
            <p className="text-sm text-muted-foreground">{doctor.designation}</p>
            <p className="text-sm text-blue-600">{doctor.specialty}</p>
            <p className="text-sm mt-1 text-yellow-600">
              Avg. Rating: {averageRating} {averageRating !== 'N/A' && '⭐'} ({reviews.length})
            </p>
            <p className="text-sm mt-1">Languages: {doctor.languages?.join(', ') ?? 'Not specified'}</p>
            <p className="text-sm mt-1">Location: {doctor.location}</p>
            <p className="text-sm mt-1">Fee: ₹{doctor.appointmentFee}</p>
            <p className="text-sm mt-1 text-green-600">
              Next Available: {doctor.nextAvailableSlot ?? 'Not available'}
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mt-4 flex gap-4">
            <Link
              href={`/consultation/${doctor.slug.current}/booking`}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition text-sm"
            >
              Book Consultation
            </Link>
            <button className="border border-blue-600 text-blue-600 px-6 py-2 rounded-md hover:bg-blue-50 transition text-sm">
              Ask Your Doctor
            </button>
          </div>
        </CardContent>
      </Card>

      {/* About Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">About the Doctor</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-700">{doctor.about || 'No information available.'}</p>
        </CardContent>
      </Card>

      {/* Reviews Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Ratings & Reviews</CardTitle>
        </CardHeader>
        <CardContent>
          <DoctorReviews reviews={reviews} />
        </CardContent>
      </Card>

      {/* Review Form */}
      <DoctorReview doctorId={doctorId} />
    </div>
  )
}