import React from 'react'

const DeleteReviewButton = ({ reviewId, onRemove }) => {
  const handleDelete = () => {
    onRemove(reviewId)
  }

  return (
    <button onClick={handleDelete} className="text-red-500 flex items-center gap-2">
      Delete Review
    </button>
  )
}

export default DeleteReviewButton