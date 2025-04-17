'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export default function CommentForm({ postId }: { postId: string }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name || !comment) {
      setError('Name and comment are required.');
      return;
    }

    try {
      const res = await fetch('/api/comment', {
        method: 'POST',
        body: JSON.stringify({ name, email, comment, postId }),
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error || 'Something went wrong');
      }

      setSubmitted(true);
      setName('');
      setEmail('');
      setComment('');
    } catch (err: any) {
      setError(err.message || 'Submission failed');
    }
  };

  if (submitted) {
    return (
      <p className="text-green-600 text-sm mt-4">
        🎉 Thank you! Your comment has been submitted.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-6">
      <Input
        placeholder="Your name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />
      <Input
        placeholder="Your email (optional)"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <Textarea
        placeholder="Write your comment..."
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={4}
        required
      />
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <Button type="submit">Submit Comment</Button>
    </form>
  );
}