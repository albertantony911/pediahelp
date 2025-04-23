'use client';

import { useState, useEffect } from 'react';
import { Share2 } from 'lucide-react';

type ShareButtonProps = {
  slug: string;
  title: string;
};

export default function ShareButton({ slug, title }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState('');

  useEffect(() => {
    setShareUrl(`${window.location.origin}/blog/${slug}`);
  }, [slug]);

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Check out "${title}" on PediaHelp`,
          text: `Read this insightful blog post on PediaHelp!`,
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (err) {
      console.error(`Share failed for ${slug}:`, err);
    }
  };

  return (
    <button
      onClick={handleShare}
      className="bg-white/90 dark:bg-gray-800/90 text-gray-800 dark:text-gray-200 text-sm font-medium px-4 py-2 rounded-full shadow-md flex items-center gap-2 hover:bg-white dark:hover:bg-gray-700 transition-colors duration-150"
      aria-label={copied ? 'Link copied to clipboard' : 'Share blog post'}
    >
      <Share2 className={`w-4 h-4 ${copied ? 'animate-pulse' : ''}`} />
      {copied ? 'Copied!' : 'Share'}
    </button>
  );
}