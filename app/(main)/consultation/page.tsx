'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import algoliasearch from 'algoliasearch/lite';
import { InstantSearch, Configure } from 'react-instantsearch';
import { groq } from 'next-sanity';
import { client } from '@/sanity/lib/client';

import SpecialtyFilter from '@/components/blocks/doctor/SpecialtyFilter';
import DoctorList from '@/components/blocks/doctor/DoctorList';
import DoctorSearchAlgolia from '@/components/blocks/doctor/DoctorSearchAlgolia';

import { Title, Subtitle, Content } from '@/components/ui/theme/typography';
import { Theme } from '@/components/ui/theme/Theme';
import Logo from '@/components/logo';

import type { Doctor, Review } from '@/types';

const searchClient = algoliasearch(
  process.env.NEXT_PUBLIC_ALGOLIA_APP_ID!,
  process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY!
);

async function getDoctors(): Promise<Doctor[]> {
  try {
    const doctors = await client.fetch<Doctor[]>(
      groq`*[_type == "doctor"] | order(orderRank asc) {
        _id,
        name,
        specialty,
        experienceYears,
        photo { asset->{ _id, url } },
        slug,
        languages,
        appointmentFee,
        nextAvailableSlot,
        expertise,
        searchKeywords,
        whatsappNumber,
        qualifications {
          education,
          achievements,
          publications,
          others
        }
      }`
    );

    const doctorsWithReviews = await Promise.all(
      doctors.map(async (doctor) => {
        const reviews = await client.fetch<Review[]>(
          groq`*[_type == "review" && doctor._ref == $id && approved == true] | order(submittedAt desc) {
            _id, name, rating, comment, submittedAt
          }`,
          { id: doctor._id }
        );
        return { ...doctor, reviews };
      })
    );

    return doctorsWithReviews;
  } catch (error) {
    console.error('Error fetching doctors:', error);
    return [];
  }
}

export default function ConsultationPage() {
  const [allDoctors, setAllDoctors] = useState<Doctor[]>([]);
  const [selectedSpecialty, setSelectedSpecialty] = useState<string | null>(null);
  const [searchHits, setSearchHits] = useState<{ objectID: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDoctors() {
      try {
        const data = await getDoctors();
        setAllDoctors(data);
      } catch (err) {
        setError('Failed to load doctors. Please try again later.');
      } finally {
        setLoading(false);
      }
    }
    loadDoctors();
  }, []);

  const filteredBySpecialty = useMemo(() => {
    if (!selectedSpecialty) return undefined;
    return allDoctors.filter(
      (doc) => doc.specialty.toLowerCase() === selectedSpecialty.toLowerCase()
    );
  }, [allDoctors, selectedSpecialty]);

  const handleFilterChange = useCallback((hits: { objectID: string }[]) => {
    setSearchHits(hits);
  }, []);

  const displayedDoctors = useMemo(() => {
    if (searchHits.length === 0) return filteredBySpecialty || allDoctors;
    return allDoctors.filter((doc) =>
      searchHits.some((hit) => hit.objectID === doc.slug.current)
    );
  }, [searchHits, filteredBySpecialty, allDoctors]);

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-shade text-gray-300 py-8 text-center">
        <p className="text-gray-600">Loading doctors...</p>
      </div>
    );
  }

  if (error || !allDoctors.length) {
    return (
      <div className="min-h-screen bg-dark-shade text-gray-300 py-8 text-center max-w-lg mx-auto">
        <p className="text-red-400">{error || 'Failed to load doctors. Please try again later.'}</p>
      </div>
    );
  }

  return (
    <>
      {/* Mobile Logo */}
      <div className="w-full flex justify-center items-center bg-white lg:hidden">
        <Logo />
      </div>

      {/* Hero section */}
      <Theme variant="dark-shade">
        <div className="pt-10 lg:pt-48 text-gray-300 text-left sm:text-center max-w-3xl mx-auto">
          <Subtitle>Book an Appointment</Subtitle>
          <Title>Find the right pediatric expert for your child</Title>
          <Content>
            Connect with trusted pediatric specialists who care about your child’s health and well-being.
          </Content>
        </div>
      </Theme>

      {/* Search + Filters + Doctors */}
      <div className="bg-dark-shade text-gray-300 px-4 pb-5 pt-5">
        <InstantSearch searchClient={searchClient} indexName="doctors_index">
          <Configure
            filters={selectedSpecialty ? `keywords:${selectedSpecialty.toLowerCase()}` : ''}
            hitsPerPage={12}
          />

          <div className="sticky top-0 z-20 pt-3 pb-[1px] sm:pt-5 -mx-4 bg-dark-shade px-4">
            <DoctorSearchAlgolia onFilterChange={handleFilterChange} />
          </div>

          <SpecialtyFilter />

          <DoctorList
            allDoctors={allDoctors}
            filteredDoctors={displayedDoctors === allDoctors ? undefined : displayedDoctors}
            loading={loading}
          />
        </InstantSearch>
      </div>

      {/* Wave Divider */}
      <div className="w-screen h-[100px] relative">
        <img
          src="/waves/dark-to-white-desktop-1.svg"
          alt="Wave divider desktop"
          className="hidden lg:block w-full h-full object-cover absolute top-0 left-0"
        />
        <img
          src="/waves/dark-to-white-mobile-1.svg"
          alt="Wave divider mobile"
          className="lg:hidden w-full h-full object-cover absolute top-0 left-0"
        />
      </div>
    </>
  );
}