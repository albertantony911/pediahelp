// components/blocks/DoctorReviews.tsx
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDistanceToNow } from 'date-fns'

interface Props {
  reviews: {
    _id: string
    name: string
    rating: number
    comment: string
    submittedAt: string
  }[]
}

export default function DoctorReviews({ reviews }: Props) {
  if (reviews.length === 0) {
    return <p className="text-sm text-muted-foreground">No reviews yet.</p>
  }

  return (
    <div className="grid gap-4">
      {reviews.map((review) => (
        <Card key={review._id} className="shadow-sm border-gray-200">
          <CardHeader className="flex flex-row items-start justify-between pb-2">
            <div>
              <CardTitle className="text-base font-semibold">{review.name}</CardTitle>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(review.submittedAt))} ago
              </p>
            </div>
            <span className="text-yellow-500 font-medium text-sm whitespace-nowrap">
              {'⭐'.repeat(review.rating)}
            </span>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-700 whitespace-pre-line">{review.comment}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}