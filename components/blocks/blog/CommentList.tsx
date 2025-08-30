'use client';

import { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';

type Comment = {
  _id: string;
  name: string;
  comment: string;
  submittedAt: string;
  answer?: string;
  answeredAt?: string;
  answeredBy?: { name?: string; specialty?: string };
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
        <div key={c._id} className="border border-gray-200 rounded-xl p-4 shadow-sm bg-white dark:bg-zinc-900">
          <div className="flex justify-between mb-1">
            <span className="font-semibold text-gray-900">{c.name}</span>
            <span className="text-xs text-gray-500">
              {c.submittedAt ? formatDistanceToNow(new Date(c.submittedAt), { addSuffix: true }) : ''}
            </span>
          </div>
          <p className="text-sm text-gray-800 dark:text-gray-300 whitespace-pre-line">{c.comment}</p>

          {c.answer && (
            <div className="mt-3 border border-emerald-200/70 bg-emerald-50 dark:bg-emerald-950/40 dark:border-emerald-900 rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs uppercase tracking-wide text-emerald-700 dark:text-emerald-300">Answer</span>
                <span className="text-[11px] text-emerald-700/70 dark:text-emerald-300/70">
                  {c.answeredAt ? formatDistanceToNow(new Date(c.answeredAt), { addSuffix: true }) : ''}
                </span>
              </div>
              <p className="text-sm text-emerald-900 dark:text-emerald-100 whitespace-pre-line">{c.answer}</p>
              {(c.answeredBy?.name || c.answeredBy?.specialty) && (
                <div className="mt-2 text-xs text-emerald-800/80 dark:text-emerald-200/80">
                  — {c.answeredBy?.name}
                  {c.answeredBy?.specialty ? `, ${c.answeredBy.specialty}` : ''}
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}