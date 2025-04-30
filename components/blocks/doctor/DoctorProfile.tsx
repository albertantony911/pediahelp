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
import { Button } from '@/components/ui/button';

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
        <DoctorPhoto name={name} photoUrl={photoUrl} rating={displayRating} reviewCount={reviewCount} />
        <div className="flex-1 flex flex-col gap-2">
          <DoctorHeader
            name={name}
            specialty={specialty}
            experience={displayExperience}
            slug={slugString}
            appointmentFee={appointmentFee}
            photoUrl={photoUrl}
            specialtyIcon={specialtyIcon}
            rating={displayRating}
            reviewCount={reviewCount}
          />
          {Array.isArray(expertise) && expertise.length > 0 && (
            <div className="mt-1.5 mx-1 flex Witems-start gap-2 text-sm text-gray-800">
              <span>
                <strong>Expertise:</strong> {expertise.filter(Boolean).join(', ')}
              </span>
            </div>
          )}
          <div className="mt-2 flex flex-row gap-2 w-full">
            {whatsappNumber && /^\+91\d{10}$/.test(whatsappNumber) ? (
              <Button
                variant="whatsapp"
                href={`https://wa.me/${whatsappNumber.replace('+', '')}?text=${encodeURIComponent(
                  `Hi, I'd like to book a consultation with ${name} via PediaHelp.`
                )}`}
                external
                className="w-[40%] sm:w-auto flex items-center justify-center px-5 py-2.5"
              >
                <FaWhatsapp className="w-5 h-5 mr-1" />
                WhatsApp
              </Button>
            ) : (
              <Button
                variant="secondary"
                disabled
                className="w-[40%] sm:w-auto px-5 py-2.5"
              >
                Message
              </Button>
            )}

            <Button
              asChild
              variant="default"
              className="w-2/3 sm:w-auto px-6 py-2.5"
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

function DoctorPhoto({ name, photoUrl, rating, reviewCount }: { name: string; photoUrl?: string; rating: string; reviewCount: number }) {
  return (
    <div className="hidden sm:block w-[150px] relative">
      <div className="h-full rounded-xl overflow-hidden bg-gray-100 drop-shadow-dark-shade" >
        {photoUrl ? (
          <Image src={photoUrl} alt={`Dr. ${name}`} width={150} height={320} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <User className="w-6 h-6" />
          </div>
        )}
        <div
          className="absolute bottom-0 left-0 right-0 text-white text-sm font-medium py-1.5 px-2 rounded-b-xl flex items-center justify-center gap-1.5"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}
        >
          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
          <span>{`${rating} (${reviewCount})`}</span>
        </div>
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
  appointmentFee,
  specialtyIcon,
  rating,
  reviewCount,
}: {
  name: string;
  specialty: string;
  experience: string;
  photoUrl?: string;
  slug: string;
  appointmentFee: number;
  specialtyIcon: React.ReactNode;
  rating: string;
  reviewCount: number;
}) {
  return (
    <>
      {/* Mobile */}
      <div className="flex sm:hidden items-start gap-3 mx-1 mt-1">
        <div className="aspect-[0.8]  w-[74px] rounded-lg overflow-hidden bg-gray-100 relative">
          {photoUrl ? (
            <Image src={photoUrl} alt={`Dr. ${name}`} width={110} height={160} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <User className="w-5 h-5" />
            </div>
          )}
          <div
            className="absolute bottom-0 left-0 right-0 text-white text-xs font-medium py-1 px-2 rounded-b-lg flex items-center justify-center gap-1"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}
          >
            <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
            <span>{`${rating} (${reviewCount})`}</span>
          </div>
        </div>
        <div className="flex-1 flex flex-col gap-1 ml-1">
          <h2 className="text-xl font-bold text-gray-900">{name}</h2>
          <div className="text-sm text-gray-700">
            {specialty}
            {experience}
          </div>
          <div className="flex flex-nowrap items-center gap-1.5 mt-2 overflow-x-auto">
            <ProfileLink slug={slug} />
            <ShareProfilePill slug={slug} />
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
        <div className="flex flex-nowrap items-center gap-2 mt-2 overflow-x-auto">
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
    <div className="flex items-center gap-1.5  px-1 py-1 rounded-full text-xs sm:text-sm text-gray-800 font-medium whitespace-nowrap  transition-colors duration-150">
      {icon}
      <span>{text}</span>
    </div>
  );
}


function ProfileLink({ slug }: { slug: string }) {
  return (
    <Button
      asChild
      variant="secondary"
      className="text-xs sm:text-sm px-3 py-1"
    >
      <Link href={`/consultation/${slug}`} className="flex items-center gap-1.5">
        <User className="w-4 h-4" />
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
      variant="secondary"
      className={`text-xs sm:text-sm px-3 py-1 flex items-center gap-1.5 ${isPressed ? 'scale-95 bg-[#264E5B] text-white shadow-inner' : ''}`}
      aria-label={copied ? 'Link copied to clipboard' : 'Share doctor profile'}
    >
      <Share2 className={`w-4 h-4 ${copied ? 'animate-pulse' : ''}`} />
      {copied ? 'Copied!' : 'Share'}
    </Button>
  );
}