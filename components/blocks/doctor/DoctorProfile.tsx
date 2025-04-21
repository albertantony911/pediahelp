'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FaWhatsapp } from 'react-icons/fa';
import {
  Star,
  Wallet,
  User,
  HeartPulse,
  Baby,
  Brain,
  Syringe,
  Eye,
  BadgePlus,
  Stethoscope,
  Share2,
} from 'lucide-react';

import { Card } from '@/components/ui/card';
import type { Doctor, Review } from '@/types';
import { calculateAverageRating } from '@/lib/ratingUtils';

const specialtyIcons: Record<string, React.ReactNode> = {
  cardiology: <HeartPulse className="w-4 h-4 text-red-500" />,
  neonatology: <Baby className="w-4 h-4 text-pink-500" />,
  neurology: <Brain className="w-4 h-4 text-purple-500" />,
  immunology: <Syringe className="w-4 h-4 text-blue-500" />,
  ophthalmology: <Eye className="w-4 h-4 text-cyan-500" />,
  dentistry: <BadgePlus className="w-4 h-4 text-yellow-600" />,
};

export default function DoctorProfileCard({
  name,
  specialty,
  photo,
  appointmentFee,
  reviews = [],
  slug,
  expertise = [],
  experienceYears,
  whatsappNumber,
}: Doctor & { reviews?: Review[] }) {
  const slugString = typeof slug === 'object' ? slug.current : slug;
  const photoUrl = photo?.asset?.url;
  const specialtyKey = specialty.toLowerCase().replace(/\s+/g, '');
  const specialtyIcon = specialtyIcons[specialtyKey] || <Stethoscope className="w-4 h-4 text-gray-500" />;

  const { averageRating, reviewCount } = calculateAverageRating(reviews);
  const displayRating = typeof averageRating === 'number' && !isNaN(averageRating) ? averageRating.toFixed(1) : 'N/A';
  const displayExperience = typeof experienceYears === 'number' && experienceYears > 0 ? `, ${experienceYears}+ years` : '';

  if (!name || !specialty || !slugString || !appointmentFee) return null;

  return (
    <Card className="rounded-3xl p-4 shadow-md bg-white max-w-4xl mx-auto w-full">
      <div className="flex sm:flex-row flex-col gap-4 sm:min-h-[160px]">
        <DoctorPhoto name={name} photoUrl={photoUrl} />
        <div className="flex-1 flex flex-col gap-2">
          <DoctorHeader
            name={name}
            specialty={specialty}
            experience={displayExperience}
            slug={slugString}
            rating={displayRating}
            reviewCount={reviewCount}
            appointmentFee={appointmentFee}
            photoUrl={photoUrl}
            specialtyIcon={specialtyIcon}
          />
          {Array.isArray(expertise) && expertise.length > 0 && (
            <div className="mt-2 ml-2 flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 text-sm font-medium text-gray-900">
                <HeartPulse className="w-4 h-4 text-rose-500" />
                <span>Expertise in:</span>
              </div>
              {expertise.map((item, i) => (
                <span
                  key={i}
                  className="bg-gray-100 text-gray-800 text-sm px-3 py-1 rounded-full font-medium whitespace-nowrap"
                >
                  {item?.trim() || 'N/A'}
                </span>
              ))}
            </div>
          )}
          <div className="mt-3 flex flex-row gap-2 w-full">
            {whatsappNumber && /^\+91\d{10}$/.test(whatsappNumber) ? (
              <a
                href={`https://wa.me/${whatsappNumber.replace('+', '')}?text=${encodeURIComponent(
                  `Hi, I'd like to book a consultation with ${name} via PediaHelp.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-[40%] sm:w-auto flex items-center justify-center gap-2 border border-green-600 text-green-700 bg-white px-5 py-2.5 rounded-full text-sm sm:text-base font-semibold hover:bg-green-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-150 ease-out"
              >
                <FaWhatsapp className="w-4 h-4 sm:w-5 sm:h-5" />
                WhatsApp
              </a>
            ) : (
              <button
                type="button"
                disabled
                className="w-[40%] sm:w-auto border border-gray-300 text-gray-400 px-5 py-2.5 rounded-full text-sm sm:text-base font-semibold cursor-not-allowed"
                title={whatsappNumber ? 'Invalid WhatsApp number' : 'No WhatsApp available'}
              >
                Message
              </button>
            )}

            <Link
              href={`/consultation/${slugString}/booking`}
              className="w-2/3 sm:w-auto bg-gray-900 text-white px-6 py-2.5 rounded-full text-sm sm:text-base font-semibold text-center hover:bg-white hover:text-gray-900 hover:border-gray-900 border border-transparent transition-all duration-150 ease-out"
            >
              Book Appointment
            </Link>
          </div>
        </div>
      </div>
    </Card>
  );
}

function DoctorPhoto({ name, photoUrl }: { name: string; photoUrl?: string }) {
  return (
    <div className="hidden sm:block w-[150px]">
      <div className="h-full rounded-xl overflow-hidden bg-gray-100">
        {photoUrl ? (
          <Image src={photoUrl} alt={`Dr. ${name}`} width={150} height={320} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <User className="w-6 h-6" />
          </div>
        )}
      </div>
    </div>
  );
}

function DoctorHeader({
  name,
  specialty,
  experience,
  photoUrl,
  slug,
  rating,
  reviewCount,
  appointmentFee,
  specialtyIcon,
}: {
  name: string;
  specialty: string;
  experience: string;
  photoUrl?: string;
  slug: string;
  rating: string;
  reviewCount: number;
  appointmentFee: number;
  specialtyIcon: React.ReactNode;
}) {
  return (
    <>
      {/* Mobile */}
      <div className="flex sm:hidden items-start gap-3">
        <div className="aspect-[3/4] w-[110px] rounded-lg overflow-hidden bg-gray-100">
          {photoUrl ? (
            <Image src={photoUrl} alt={`Dr. ${name}`} width={110} height={160} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <User className="w-5 h-5" />
            </div>
          )}
        </div>
        <div className="flex-1 flex flex-col gap-1">
          <h2 className="text-xl font-bold text-gray-900">{name}</h2>
          <div className="text-sm text-gray-700">
            {specialty}
            {experience}
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-1.5">
            <ProfileLink slug={slug} />
            <ShareProfilePill slug={slug} />
            <Pill icon={<Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />} text={`${rating} (${reviewCount})`} />
            <Pill icon={<Wallet className="w-3.5 h-3.5 text-gray-500" />} text={`₹${appointmentFee}`} />
          </div>
        </div>
      </div>

      {/* Desktop */}
      <div className="hidden sm:flex flex-col gap-1">
        <div className="flex flex-row gap-3">
          <h2 className="text-xl font-semibold text-gray-900">{name}</h2>
          <div className="flex items-center gap-1.5 text-base text-gray-700">
            {specialtyIcon}
            <span>{specialty}{experience}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 mt-2">
          <Pill icon={<Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />} text={`${rating} (${reviewCount})`} />
          <ProfileLink slug={slug} />
          <ShareProfilePill slug={slug} />
          <Pill icon={<Wallet className="w-4 h-4 text-gray-500" />} text={`₹${appointmentFee}`} />
        </div>
      </div>
    </>
  );
}

function Pill({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-1.5 bg-gray-100 px-3 py-1 rounded-full text-xs sm:text-sm text-gray-800 font-medium whitespace-nowrap hover:bg-gray-200 transition-colors duration-150">
      {icon}
      <span>{text}</span>
    </div>
  );
}

function ProfileLink({ slug }: { slug: string }) {
  return (
    <Link
      href={`/consultation/${slug}`}
      className="flex items-center justify-center gap-1.5 border border-blue-600 text-blue-700 bg-white px-3 py-1 rounded-full text-xs sm:text-sm font-medium hover:bg-blue-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      <User className="w-4 h-4" />
      View Profile
    </Link>
  );
}

function ShareProfilePill({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [isPressed, setIsPressed] = useState(false);

  useEffect(() => {
    setShareUrl(`${window.location.origin}/consultation/${slug}`);
  }, [slug]);

  const handleShare = async () => {
    setIsPressed(true);
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Check out this doctor on PediaHelp',
          text: 'Found this doctor on PediaHelp – thought you might be interested!',
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (err) {
      console.error(`Share failed for ${slug}:`, err);
    } finally {
      setTimeout(() => setIsPressed(false), 150);
    }
  };

  return (
    <button
      onClick={handleShare}
      className={`flex items-center justify-center gap-1.5 border border-blue-600 text-blue-700 bg-white px-3 py-1 rounded-full text-xs sm:text-sm font-medium hover:bg-blue-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${isPressed ? 'scale-95 bg-blue-700 text-white shadow-inner' : ''} transition-all duration-150 ease-out`}
      aria-label={copied ? 'Link copied to clipboard' : 'Share doctor profile'}
    >
      <Share2 className={`w-4 h-4 ${copied ? 'animate-pulse' : ''}`} />
      {copied ? 'Copied!' : 'Share'}
    </button>
  );
}