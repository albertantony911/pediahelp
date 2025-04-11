'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import {
  CalendarDays,
  Languages,
  Star,
  Stethoscope,
  Wallet,
  User,
  HeartPulse,
  Baby,
  Brain,
  Syringe,
  Eye,
  Share2,
  BadgePlus,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { DoctorProfileCardProps } from '@/types';

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
  languages,
  appointmentFee,
  nextAvailableSlot,
  rating,
  reviewCount = 0,
  slug,
  expertise,
  experienceYears,
}: DoctorProfileCardProps) {
  const specialtyKey = specialty.toLowerCase().replace(/\s+/g, '');
  const specialtyIcon = specialtyIcons[specialtyKey] || <Stethoscope className="w-4 h-4 text-gray-500" />;
  const displayRating = rating != null ? rating.toFixed(1) : 'N/A';
  const formattedExperience =
    typeof experienceYears === 'number' && experienceYears >= 0
      ? `, ${experienceYears}+ years`
      : '';
  const photoUrl = photo?.asset?.url;

  return (
    <Card className="rounded-3xl p-4 shadow-md bg-white max-w-4xl mx-auto w-full">
      <div className="flex sm:flex-row flex-col gap-4 sm:min-h-[160px]">
        <DoctorPhoto photoUrl={photoUrl} name={name} />

        <div className="flex-1 flex flex-col gap-2">
          <MobileHeader
            name={name}
            specialty={specialty}
            experience={formattedExperience}
            photoUrl={photoUrl}
            slug={slug}
            displayRating={displayRating}
            reviewCount={reviewCount}
            languages={languages}
            appointmentFee={appointmentFee}
            nextAvailableSlot={nextAvailableSlot}
          />

          <DesktopHeader
            name={name}
            specialty={specialty}
            experience={formattedExperience}
            specialtyIcon={specialtyIcon}
            slug={slug}
            displayRating={displayRating}
            reviewCount={reviewCount}
            languages={languages}
            appointmentFee={appointmentFee}
            nextAvailableSlot={nextAvailableSlot}
          />

          {expertise?.length > 0 && (
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
                  {item.trim()}
                </span>
              ))}
            </div>
          )}

          <div className="mt-3 flex flex-row gap-2 w-full">
            <button className="w-1/3 sm:w-auto border border-gray-300 text-gray-800 px-5 py-2.5 rounded-full text-sm sm:text-base font-semibold hover:bg-gray-50 transition">
              Message
            </button>
            <Link
              href={`/consultation/${slug}/booking`}
              className="w-2/3 sm:w-auto bg-gray-900 text-white px-6 py-2.5 rounded-full text-sm sm:text-base font-semibold text-center hover:bg-gray-800 transition"
            >
              Book Appointment
            </Link>
          </div>
        </div>
      </div>
    </Card>
  );
}

function DoctorPhoto({ photoUrl, name }: { photoUrl?: string; name: string }) {
  return (
    <>
      <div className="hidden sm:block w-[150px]">
        <div className="h-full rounded-xl overflow-hidden bg-gray-100">
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
      </div>
    </>
  );
}

function MobileHeader({
  name,
  specialty,
  experience,
  photoUrl,
  slug,
  displayRating,
  reviewCount,
  languages,
  appointmentFee,
  nextAvailableSlot,
}: any) {
  return (
    <div className="flex sm:hidden items-start gap-3">
      <div className="aspect-[3/4] w-[110px] rounded-lg overflow-hidden bg-gray-100">
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
          <Pill icon={<Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />} text={`${displayRating} (${reviewCount})`} />
          <Pill icon={<Languages className="w-3.5 h-3.5 text-gray-500" />} text={languages?.join(', ') || 'N/A'} />
          <Pill icon={<Wallet className="w-3.5 h-3.5 text-gray-500" />} text={`₹${appointmentFee}`} />
          <Pill icon={<CalendarDays className="w-3.5 h-3.5 text-gray-500" />} text={nextAvailableSlot || 'Not available'} />
        </div>
      </div>
    </div>
  );
}

function DesktopHeader({
  name,
  specialty,
  experience,
  specialtyIcon,
  slug,
  displayRating,
  reviewCount,
  languages,
  appointmentFee,
  nextAvailableSlot,
}: any) {
  return (
    <div className="hidden sm:flex flex-col gap-1">
      <div className="flex flex-row gap-3">
        <h2 className="text-2xl font-semibold text-gray-900">{name}</h2>
        <div className="flex items-center gap-1.5 text-base text-gray-700">
          {specialtyIcon}
          <span>{specialty}{experience}</span>
        </div>
      </div>

      <div className="flex flex-col gap-3 mt-2">
        <div className="flex flex-wrap items-center gap-3">
          <Pill icon={<Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />} text={`${displayRating} (${reviewCount})`} />
          <ProfileLink slug={slug} />
          <ShareProfilePill slug={slug} />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Pill icon={<Languages className="w-4 h-4 text-gray-500" />} text={languages?.join(', ') || 'N/A'} />
          <Pill icon={<Wallet className="w-4 h-4 text-gray-500" />} text={`₹${appointmentFee}`} />
          <Pill icon={<CalendarDays className="w-4 h-4 text-gray-500" />} text={nextAvailableSlot || 'Not available'} />
        </div>
      </div>
    </div>
  );
}

function Pill({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-1.5 bg-gray-100 px-3 py-1 rounded-full text-xs sm:text-sm text-gray-800 font-medium whitespace-nowrap">
      {icon}
      <span>{text}</span>
    </div>
  );
}

function ProfileLink({ slug }: { slug: string }) {
  return (
    <Link
      href={`/consultation/${slug}`}
      className="flex items-center gap-1.5 border border-blue-200 bg-blue-50 text-blue-800 px-3 py-1 rounded-full text-xs sm:text-sm font-medium hover:bg-blue-100 transition"
    >
      <User className="w-4 h-4" />
      View Profile
    </Link>
  );
}

function ShareProfilePill({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const url = `${window.location.origin}/consultation/${slug}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 border border-blue-200 bg-blue-50 text-blue-800 px-3 py-1 rounded-full text-xs sm:text-sm font-medium hover:bg-blue-100 transition"
    >
      <Share2 className="w-4 h-4" />
      {copied ? 'Copied!' : 'Share'}
    </button>
  );
}