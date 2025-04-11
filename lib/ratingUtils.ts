// lib/ratingUtils.ts
export function calculateAverageRating(reviews: { rating: number }[]): number | null {
  if (!reviews || reviews.length === 0) {
    return null;
  }
  const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
  return Number((sum / reviews.length).toFixed(1));
}