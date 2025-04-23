'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import algoliasearch from 'algoliasearch/lite';
import { InstantSearch, Configure } from 'react-instantsearch';
import { groq } from 'next-sanity';
import { client } from '@/sanity/lib/client';

import SpecialtyFilter from '@/components/blocks/doctor/SpecialtyFilter';
import DoctorList from '@/components/blocks/doctor/DoctorList';
import DoctorSearchAlgolia from '@/components/blocks/doctor/DoctorSearchAlgolia';

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

export default function ConsultationPageWrapper() {
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
      <div className="min-h-screen bg-dark-shade text-gray-300 px-4 py-8">
        <div className="text-center py-8 text-gray-600">Loading doctors...</div>
      </div>
    );
  }

  if (error || !allDoctors.length) {
    return (
      <div className="min-h-screen bg-dark-shade text-gray-300 max-w-lg px-4 py-8">
        <div className="text-center py-8 text-red-400">
          {error || 'Failed to load doctors. Please try again later.'}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-shade text-gray-300 px-4 py-8">
      <InstantSearch searchClient={searchClient} indexName="doctors_index">
        <Configure
          filters={selectedSpecialty ? `keywords:${selectedSpecialty.toLowerCase()}` : ''}
          hitsPerPage={12}
        />

        {/* Search bar comes first */}
        <div className="sticky top-0 z-20 py-4 -mx-4 px-4 bg-dark-shade ">
          <DoctorSearchAlgolia onFilterChange={handleFilterChange} />
        </div>

        {/* Then specialty filter */}
        <SpecialtyFilter />

        {/* Doctor list */}
        <DoctorList
          allDoctors={allDoctors}
          filteredDoctors={displayedDoctors === allDoctors ? undefined : displayedDoctors}
          loading={loading}
        />
      </InstantSearch>
    </div>
  );
}