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
    <div className="grid gap-5 mt-8">
      {reviews.map((review) => (
        <Card
          key={review._id}
          className="border border-muted bg-background shadow-sm rounded-xl transition hover:shadow-md"
        >
          <CardHeader className="pb-1">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold text-foreground">
                  {review.name}
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(review.submittedAt), { addSuffix: true })}
                </p>
              </div>
              <div className="text-sm text-yellow-500 font-medium">
                {'⭐'.repeat(review.rating)}
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
              {review.comment}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}