// lib/ratingUtils.ts
export function calculateAverageRating(reviews: { rating: number }[]) {
  if (!reviews || reviews.length === 0) {
    return { averageRating: null, reviewCount: 0 };
  }
  const validRatings = reviews
    .map((review) => review.rating)
    .filter((rating): rating is number => typeof rating === 'number' && !isNaN(rating));
  if (validRatings.length === 0) {
    return { averageRating: null, reviewCount: reviews.length };
  }
  const sum = validRatings.reduce((acc, rating) => acc + rating, 0);
  const averageRating = Number((sum / validRatings.length).toFixed(1));
  return { averageRating, reviewCount: reviews.length };
}