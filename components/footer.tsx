'use client';

import Link from 'next/link';
import { FaFacebookF, FaInstagram, FaXTwitter, FaYoutube } from 'react-icons/fa6';
import { cn } from '@/lib/utils';

const footerSections = [
  {
    heading: 'Explore',
    links: [
      { label: 'Home', href: '/' },
      { label: 'About', href: '/about' },
      { label: 'Consultation', href: '/consultation' },
      { label: 'Contact', href: '/contact' },
    ],
  },
  {
    heading: 'Resources',
    links: [
      { label: 'Blogs', href: '/resources' },
      { label: 'Childcare', href: '/resources' },
      { label: 'Lactation', href: '/resources' },
      { label: 'FAQs', href: '/faq' },
    ],
  },
];

const companyLinks = [
  { label: 'Careers', href: '/careers' },
  { label: 'Privacy Policy', href: '/privacy-policy' },
  { label: 'Terms & Conditions', href: '/terms-and-conditions' },
  {
    label: 'Cookies',
    href: '#',
    onClick: () => {
      if (typeof window !== 'undefined' && (window as any).resetCookieConsent) {
        (window as any).resetCookieConsent();
      }
    },
  },
];

const specialities = [
  { label: 'Respiratory & Sleep', href: '/specialities/respiratory-sleep' },
  { label: 'Lactation Support', href: '/specialities/lactation-support' },
  { label: 'Gastroenterology', href: '/specialities/gastroenterology' },
  { label: 'Nephrology', href: '/specialities/nephrology' },
  { label: 'Endocrinology', href: '/specialities/endocrinology' },
  { label: 'Neurology', href: '/specialities/neurology' },
  { label: 'Neonatology', href: '/specialities/neonatology' },
];

export default function Footer() {
  return (
    <footer
      className={cn(
        'w-full bg-white px-10 py-10 max-sm:mb-20',
        ' text-sm text-zinc-500',
        '[padding-bottom:calc(env(safe-area-inset-bottom)+2rem)]'
      )}
    >
      <div className="max-w-7xl mx-auto space-y-10 lg:pr-10">
        {/* Top Row: Logo and Links */}
        <div className="flex flex-col lg:flex-row justify-between gap-10 lg:gap-0">
          {/* Left: Logo Block */}
          <div className="flex-1 max-w-sm">
            <Link
              href="/"
              className="text-xl font-bold text-zinc-800 tracking-tight hover:text-[var(--primary)] transition"
            >
              PediaHelp
            </Link>
            <p className="text-xs mt-2 leading-snug text-zinc-500">
              Expert care & a sprinkle of joy for every parent.
            </p>
            <div className="mt-4 flex gap-3 flex-wrap">
              {[
                { Icon: FaFacebookF, href: '#', label: 'Facebook' },
                { Icon: FaInstagram, href: '#', label: 'Instagram' },
                { Icon: FaXTwitter, href: '#', label: 'X (Twitter)' },
                { Icon: FaYoutube, href: '#', label: 'YouTube' },
              ].map(({ Icon, href, label }) => (
                <Link
                  key={label}
                  href={href}
                  aria-label={label}
                  className="text-zinc-500 hover:text-[var(--primary)] transition"
                >
                  <Icon className="w-4 h-4" />
                </Link>
              ))}
            </div>
          </div>

          {/* Right: Link Blocks */}
          <div className=" flex flex-row lg:justify-between gap-10 flex-wrap max-sm:border-t border-zinc-200 pt-6 lg:pt-0">
            {/* Explore & Resources */}
            {[...footerSections].map(({ heading, links }) => (
              <div key={heading} className="min-w-[120px]">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-800 mb-3">
                  {heading}
                </h3>
                <ul className="space-y-1.5">
                  {links.map(({ label, href }) => (
                    <li key={label}>
                      <Link
                        href={href}
                        className="hover:text-[var(--primary)] transition hover:underline underline-offset-4"
                      >
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            <div className="flex-row lg:flex-row-reverse flex gap-10">
              {/* Specialities - 2-column layout */}
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-800 mb-3">
                  Specialities
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-10 gap-y-2">
                  {specialities.map(({ label, href }) => (
                    <Link
                      key={label}
                      href={href}
                      className="text-sm hover:text-[var(--primary)] transition hover:underline underline-offset-4"
                    >
                      {label}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Company block (with Cookies trigger) */}
              <div className="min-w-[120px]">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-800 mb-3">
                  Company
                </h3>
                <ul className="space-y-1.5">
                  {companyLinks.map(({ label, href, onClick }) => (
                    <li key={label}>
                      {onClick ? (
                        <button
                          onClick={onClick}
                          className="hover:text-[var(--primary)] transition hover:underline underline-offset-4 text-left w-full"
                        >
                          {label}
                        </button>
                      ) : (
                        <Link
                          href={href}
                          className="hover:text-[var(--primary)] transition hover:underline underline-offset-4"
                        >
                          {label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Row */}
        <div className="pt-6 flex flex-col sm:flex-row justify-between items-start gap-4 text-xs text-zinc-500 border-t border-zinc-200 ">
          <p>© {new Date().getFullYear()} PediaHelp. All rights reserved.</p>
          <p>
            Powered by{' '}
            <Link
              href="https://blackwoodbox.com"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-[var(--primary)] transition"
            >
              Blackwoodbox.com
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}