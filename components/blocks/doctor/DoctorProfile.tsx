'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FaWhatsapp } from 'react-icons/fa';
import {
  Star,
  Wallet,
  User,
  Share2,
  CalendarDays,
} from 'lucide-react';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Doctor, Review } from '@/types';
import { calculateAverageRating } from '@/lib/ratingUtils';
import { cn } from '@/lib/utils';

// Define types for calculateAverageRating
interface RatingResult {
  averageRating: number | null;
  reviewCount: number;
}

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

  const { averageRating, reviewCount }: RatingResult = calculateAverageRating(reviews);
  const displayRating = typeof averageRating === 'number' && !isNaN(averageRating) && reviewCount > 0 ? averageRating.toFixed(1) : null;
  const displayExperience = typeof experienceYears === 'number' && experienceYears > 0 ? `${experienceYears}+ yrs` : '';

  if (!name || !specialty || !slugString || !appointmentFee) return null;

  return (
    <Card className="rounded-3xl p-4 sm:p-5 shadow-lg hover:shadow-xl transition-shadow duration-300 bg-white max-w-[40rem] mx-auto w-full">
      <div className="flex sm:flex-row flex-col gap-4 sm:gap-6 sm:min-h-[160px]">
        <DoctorPhoto
          name={name}
          photoUrl={photoUrl}
          slug={slugString}
        />
        <div className="flex-1 flex flex-col gap-2">
          <DoctorHeader
            name={name}
            specialty={specialty}
            experience={displayExperience}
            slug={slugString}
            appointmentFee={appointmentFee}
            photoUrl={photoUrl}
            rating={displayRating}
          />
          {Array.isArray(expertise) && expertise.length > 0 && (
            <div className="mx-1 mt-1 flex items-start gap-2 text-sm sm:text-base text-gray-800">
              <span>
                <strong>Expertise:</strong> {expertise.filter(Boolean).join(', ')}
              </span>
            </div>
          )}
          <div className="mt-2 flex flex-row gap-2 w-full sm:flex-1">
            {whatsappNumber && /^\+91\d{10}$/.test(whatsappNumber) ? (
              <Button
                variant="whatsapp"
                href={`https://wa.me/${whatsappNumber.replace('+', '')}?text=${encodeURIComponent(
                  `Hi, I'd like to book a consultation with ${name} via PediaHelp.`
                )}`}
                external
                className=""
              >
                <FaWhatsapp className="w-5 h-5 mr-1" />
                WhatsApp
              </Button>
            ) : (
              <Button
                variant="whatsapp"
                disabled
                className="sm:flex-1 px-5 py-2.5"
              >
                Message
              </Button>
            )}
            <Button
              asChild
              variant="default"
              className="w-2/3"
            >
              <Link href={`/consultation/${slugString}/booking`}>
                Book Appointment
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

function DoctorPhoto({
  name,
  photoUrl,
  slug,
}: {
  name: string;
  photoUrl?: string;
  slug: string;
}) {
  return (
    <Link href={`/consultation/${slug}`} className="hidden sm:block w-[150px] aspect-[0.8] relative">
      <div className="h-full rounded-2xl overflow-hidden bg-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200">
        {photoUrl ? (
          <Image
            src={photoUrl}
            alt={`Dr. ${name}`}
            width={150}
            height={320}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <User className="w-6 h-6" />
          </div>
        )}
      </div>
    </Link>
  );
}

function DoctorHeader({
  name,
  specialty,
  experience,
  photoUrl,
  slug,
  appointmentFee,
  rating,
}: {
  name: string;
  specialty: string;
  experience: string;
  photoUrl?: string;
  slug: string;
  appointmentFee: number;
  rating: string | null;
}) {
  return (
    <>
      {/* Mobile */}
      <div className="flex sm:hidden items-start gap-3 mx-1 mt-1">
        <Link href={`/consultation/${slug}`} className="aspect-[0.8] w-[74px] rounded-lg overflow-hidden bg-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200">
          {photoUrl ? (
            <Image
              src={photoUrl}
              alt={`Dr. ${name}`}
              width={110}
              height={160}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <User className="w-5 h-5" />
            </div>
          )}
        </Link>
        <div className="flex-1 flex flex-col gap-1 ml-1">
          <h2 className="text-xl font-semibold text-gray-700">{name}</h2>
          <div className="text-sm text-gray-500 flex items-center gap-1.5">
            <span>{specialty}, {experience}</span>
            {rating && (
              <span className="flex items-center gap-1">
                <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                {rating}
              </span>
            )}
          </div>
          <div className="flex flex-nowrap items-center gap-1.5 mt-2 overflow-x-auto">
            <ProfileLink slug={slug} />
            <ShareProfilePill slug={slug} />
            <Pill icon={<Wallet className="w-3.5 h-3.5 text-gray-500" />} text={`₹${appointmentFee}`} />
          </div>
        </div>
      </div>

      {/* Desktop */}
      <div className="hidden sm:flex flex-col gap-0 text-sm">
        <div className="flex flex-row gap-2">
          <h2 className="text-xl font-bold text-gray-700">{name}, </h2>
          <div className="flex items-center gap-1 text-base text-gray-500">
            <span>{specialty}</span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 mt-1.5 overflow-visible">
          <ProfileLink slug={slug} />
          <ShareProfilePill slug={slug} />
          <Pill icon={<Wallet className="w-4 h-4 text-gray-500" />} text={`₹${appointmentFee}`} className="text-base text-gray-500" />
          {experience && (
            <Pill
              icon={<CalendarDays className="w-4 h-4 text-gray-500" />}
              text={experience}
              className="text-base text-gray-500"
            />
          )}
          {rating && (
            <Pill
              icon={<Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />}
              text={rating}
              className="text-base text-gray-500"
            />
          )}
        </div>
      </div>
    </>
  );
}

function Pill({ icon, text, className = '' }: { icon: React.ReactNode; text: string; className?: string }) {
  return (
    <div className={`flex items-center gap-1.5 px-1 py-1 rounded-full text-xs text-gray-500 font-medium whitespace-nowrap transition-colors duration-150 max-w-[140px] truncate ${className}`}>
      {icon}
      <span className="truncate">{text}</span>
    </div>
  );
}

function ProfileLink({ slug }: { slug: string }) {
  return (
    <Button
      asChild
      variant="outline"
      className="text-xs sm:text-[12px] px-2 text-gray-500 sm:px-1.75 py-1 sm:py-1 border-gray-400 active:bg-mid-shade active:text-white hover:bg-mid-shade hover:text-white active:scale-95"
    >
      <Link href={`/consultation/${slug}`} className="flex items-center gap-1 sm:gap-0.75">
        <User className="w-3.5 h-3.5" />
        Profile
      </Link>
    </Button>
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
    <Button
      onClick={handleShare}
      variant="outline"
      className={`text-xs sm:text-[12px] px-2 text-gray-500 sm:px-1.75 py-1 sm:py-1 border-gray-400 active:bg-mid-shade active:text-white hover:bg-mid-shade hover:text-white active:scale-95 ${isPressed ? 'scale-95 bg-[#264E5B] text-white shadow-inner' : ''}`}
      aria-label={copied ? 'Link copied to clipboard' : 'Share doctor profile'}
    >
      <Share2 className={`w-3.5 h-3.5 ${copied ? 'animate-pulse' : ''}`} />
      {copied ? 'Copied!' : 'Share'}
    </Button>
  );
}