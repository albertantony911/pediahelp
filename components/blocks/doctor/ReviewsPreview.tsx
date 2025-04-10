import { groq } from 'next-sanity'
import { useEffect, useState } from 'react'
import { Card, Text, Stack, Heading } from '@sanity/ui'
import { client } from '@/sanity/lib/client'

interface Review {
  _id: string
  name: string
  rating: number
  comment: string
  submittedAt: string
}

export default function ReviewsPreview({ doctorId }: { doctorId: string }) {
  const [reviews, setReviews] = useState<Review[]>([])

  useEffect(() => {
    client
      .fetch(
        groq`*[_type == "review" && doctor._ref == $id] | order(submittedAt desc){
          _id, name, rating, comment, submittedAt
        }`,
        { id: doctorId }
      )
      .then(setReviews)
  }, [doctorId])

  return (
    <Stack space={4} padding={4}>
      <Heading size={1}>Doctor Reviews</Heading>
      {reviews.length === 0 && <Text muted>No reviews yet.</Text>}
      {reviews.map((review) => (
        <Card key={review._id} padding={3} radius={2} shadow={1}>
          <Stack space={2}>
            <Text weight="semibold">{review.name}</Text>
            <Text muted>{'⭐'.repeat(review.rating)}</Text>
            <Text size={1}>{review.comment}</Text>
          </Stack>
        </Card>
      ))}
    </Stack>
  )
}