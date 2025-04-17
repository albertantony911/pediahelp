'use client';

import { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface Comment {
  _id: string;
  name: string;
  comment: string;
  submittedAt: string;
}

export default function PostComments({ postId }: { postId: string }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchComments() {
      try {
        const res = await fetch(`/api/comment?postId=${postId}`);
        const data = await res.json();
        setComments(data.comments || []);
      } catch (err) {
        console.error('Failed to load comments', err);
      } finally {
        setLoading(false);
      }
    }

    fetchComments();
  }, [postId]);

  if (loading) return <p className="text-sm text-muted-foreground">Loading comments...</p>;

  if (comments.length === 0) {
    return <p className="text-sm text-muted-foreground">No comments yet.</p>;
  }

  return (
    <div className="grid gap-4">
      {comments.map((c) => (
        <Card key={c._id}>
          <CardHeader className="pb-1">
            <CardTitle className="text-base font-semibold">{c.name}</CardTitle>
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(c.submittedAt), { addSuffix: true })}
            </p>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground whitespace-pre-line">
            {c.comment}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}