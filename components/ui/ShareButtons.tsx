'use client';

import {
  FaXTwitter,
  FaFacebook,
  FaLinkedin,
  FaWhatsapp,
  FaEnvelope,
  FaShare,
} from 'react-icons/fa6';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Tooltip } from 'react-tooltip';

interface ShareButtonsProps {
  url: string;
  title: string;
  className?: string;
}

export default function ShareButtons({ url, title, className = '' }: ShareButtonsProps) {
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const shareLinks = {
    x: `https://x.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    linkedin: `https://www.linkedin.com/shareArticle?mini=true&url=${encodedUrl}&title=${encodedTitle}`,
    whatsapp: `https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}`,
    email: `mailto:?subject=${encodedTitle}&body=${encodedUrl}`,
  };

  const handleNativeShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title,
          text: title,
          url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success('Link copied to clipboard');
      }
    } catch (err) {
      toast.error('Failed to share');
      console.error('Share failed:', err);
    }
  };

  return (
    <div className={`mt-8 flex items-center gap-4 flex-wrap ${className}`}>
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
        Share this:
      </span>
      {[
        { href: shareLinks.x, icon: FaXTwitter, label: 'X (Twitter)' },
        { href: shareLinks.facebook, icon: FaFacebook, label: 'Facebook' },
        { href: shareLinks.linkedin, icon: FaLinkedin, label: 'LinkedIn' },
        { href: shareLinks.whatsapp, icon: FaWhatsapp, label: 'WhatsApp' },
        { href: shareLinks.email, icon: FaEnvelope, label: 'Email' },
      ].map(({ href, icon: Icon, label }) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Share on ${label}`}
          data-tooltip-id={`tip-${label}`}
          data-tooltip-content={label}
          className="text-gray-600 hover:text-primary transition-colors"
        >
          <motion.div whileTap={{ scale: 0.85 }} whileHover={{ scale: 1.1 }}>
            <Icon className="h-5 w-5" />
          </motion.div>
          <Tooltip id={`tip-${label}`} place="bottom" />
        </a>
      ))}

      {/* Native share or fallback */}
      <button
        onClick={handleNativeShare}
        aria-label="Native share or copy link"
        data-tooltip-id="tip-native"
        data-tooltip-content="Share or Copy"
        className="text-gray-600 hover:text-primary transition-colors"
      >
        <motion.div whileTap={{ scale: 0.85 }} whileHover={{ scale: 1.1 }}>
          <FaShare className="h-5 w-5" />
        </motion.div>
        <Tooltip id="tip-native" place="bottom" />
      </button>
    </div>
  );
}