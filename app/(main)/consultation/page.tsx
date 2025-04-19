'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import algoliasearch from 'algoliasearch/lite';
import { InstantSearch, Configure } from 'react-instantsearch';
import { groq } from 'next-sanity';
import { client } from '@/sanity/lib/client';
import SpecialtyFilter from '@/components/blocks/doctor/SpecialtyFilter';
import DoctorList from '@/components/blocks/doctor/DoctorList';
import DoctorSearchAlgolia from '@/components/blocks/doctor/DoctorSearchAlgolia';
import { Doctor, Review } from '@/types';

const searchClient = algoliasearch(
  process.env.NEXT_PUBLIC_ALGOLIA_APP_ID!,
  process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY!
);

async function getDoctors(): Promise<{ doctor: Doctor; reviews: Review[] }[]> {
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
        return { doctor, reviews };
      })
    );

    return doctorsWithReviews;
  } catch (error) {
    console.error('Error fetching doctors:', error);
    return [];
  }
}

export default function ConsultationPageWrapper() {
  const [allDoctorsWithReviews, setAllDoctorsWithReviews] = useState<
    { doctor: Doctor; reviews: Review[] }[]
  >([]);
  const [selectedSpecialty, setSelectedSpecialty] = useState<string | null>(null);
  const [searchHits, setSearchHits] = useState<{ objectID: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all doctors on mount
  useEffect(() => {
    async function loadDoctors() {
      try {
        const data = await getDoctors();
        setAllDoctorsWithReviews(data);
      } catch (err) {
        setError('Failed to load doctors. Please try again later.');
      } finally {
        setLoading(false);
      }
    }
    loadDoctors();
  }, []);

  // Memoize filtered doctors based on specialty
  const filteredBySpecialty = useMemo(() => {
    if (!selectedSpecialty) return undefined;
    return allDoctorsWithReviews.filter(
      (item) => item.doctor.specialty.toLowerCase() === selectedSpecialty.toLowerCase()
    );
  }, [allDoctorsWithReviews, selectedSpecialty]);

  // Stabilize onFilterChange with useCallback
  const handleFilterChange = useCallback((hits: { objectID: string }[]) => {
    setSearchHits(hits);
  }, []); // Empty dependency array ensures it doesn't change

  // Derive final doctor list based on search and specialty
  const displayedDoctors = useMemo(() => {
    if (searchHits.length === 0) return filteredBySpecialty || allDoctorsWithReviews;
    return allDoctorsWithReviews.filter((item) =>
      searchHits.some((hit) => hit.objectID === item.doctor.slug.current)
    );
  }, [searchHits, filteredBySpecialty, allDoctorsWithReviews]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white text-gray-300 px-4 py-8">
        <h1 className="text-3xl font-bold text-center mb-6">FIND YOUR DOCTOR</h1>
        <div className="text-center py-8 text-gray-600">Loading doctors...</div>
      </div>
    );
  }

  if (error || !allDoctorsWithReviews.length) {
    return (
      <div className="min-h-screen bg-white text-gray-300 max-w-lg px-4 py-8">
        <h1 className="text-3xl font-bold text-center mb-6">FIND YOUR DOCTOR</h1>
        <div className="text-center py-8 text-red-400">
          {error || 'Failed to load doctors. Please try again later.'}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-gray-300 px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-6">FIND YOUR DOCTOR</h1>

      <SpecialtyFilter
        onFilter={(val) => setSelectedSpecialty(val)}
        onReset={() => setSelectedSpecialty(null)}
      />

      <InstantSearch searchClient={searchClient} indexName="doctors_index">
        <Configure
          filters={selectedSpecialty ? `keywords:${selectedSpecialty.toLowerCase()}` : ''}
          hitsPerPage={12}
        />

        <div className="sticky top-0 z-20 py-4 -mx-4 px-4 bg-white dark:bg-zinc-900">
          <DoctorSearchAlgolia onFilterChange={handleFilterChange} />
        </div>

        <DoctorList
          allDoctorsWithReviews={allDoctorsWithReviews}
          filteredBySpecialty={displayedDoctors === allDoctorsWithReviews ? undefined : displayedDoctors}
          loading={loading}
        />
      </InstantSearch>
    </div>
  );
}