'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export default function PostCommentForm({ postId }: { postId: string }) {
  const [form, setForm] = useState({ name: '', email: '', comment: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/comment', {
        method: 'POST',
        body: JSON.stringify({ ...form, postId }),
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Something went wrong.');
      }

      setSubmitted(true);
      setForm({ name: '', email: '', comment: '' });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return <p className="text-green-600 font-medium">Thank you for your comment!</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-6">
      <Input
        placeholder="Your name"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        required
      />
      <Input
        placeholder="Your email (optional)"
        type="email"
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
      />
      <Textarea
        placeholder="Write your comment..."
        rows={4}
        value={form.comment}
        onChange={(e) => setForm({ ...form, comment: e.target.value })}
        required
      />
      <Button type="submit" disabled={submitting}>
        {submitting ? 'Submitting...' : 'Submit Comment'}
      </Button>

      {error && <p className="text-red-500 text-sm">{error}</p>}
    </form>
  );
}