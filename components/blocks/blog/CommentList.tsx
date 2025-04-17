'use client';

import { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';

type Comment = {
  _id: string;
  name: string;
  comment: string;
  submittedAt: string;
};

export default function CommentList({ postId }: { postId: string }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchComments() {
      const res = await fetch(`/api/comments?postId=${postId}`);
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments || []);
      }
      setLoading(false);
    }
    fetchComments();
  }, [postId]);

  if (loading) return <p className="text-sm text-muted-foreground">Loading comments...</p>;
  if (!comments.length) return <p className="text-sm text-muted-foreground">No comments yet.</p>;

  return (
    <div className="mt-6 space-y-4">
      {comments.map((c) => (
        <div
          key={c._id}
          className="border border-gray-200 rounded-xl p-4 shadow-sm bg-white dark:bg-zinc-900"
        >
          <div className="flex justify-between mb-1">
            <span className="font-semibold text-gray-900">{c.name}</span>
            <span className="text-xs text-gray-500">
              {formatDistanceToNow(new Date(c.submittedAt), { addSuffix: true })}
            </span>
          </div>
          <p className="text-sm text-gray-800 dark:text-gray-300 whitespace-pre-line">
            {c.comment}
          </p>
        </div>
      ))}
    </div>
  );
}