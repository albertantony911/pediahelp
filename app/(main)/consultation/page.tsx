'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import algoliasearch from 'algoliasearch/lite';
import { InstantSearch, Configure } from 'react-instantsearch';
import { useDoctors } from '@/components/providers/DoctorsProvider';
import SpecialtyFilter from '@/components/blocks/doctor/SpecialtyFilter';
import DoctorList from '@/components/blocks/doctor/DoctorList';
import DoctorSearchAlgolia from '@/components/blocks/doctor/DoctorSearchAlgolia';
import { Title, Subtitle, Content } from '@/components/ui/theme/typography';
import { Theme } from '@/components/ui/theme/Theme';
import Logo from '@/components/logo';
import type { Doctor } from '@/types';

const searchClient = algoliasearch(
  process.env.NEXT_PUBLIC_ALGOLIA_APP_ID!,
  process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY!
);

export default function ConsultationPage() {
  const allDoctors = useDoctors(); // Use shared doctors from DoctorsProvider
  const [selectedSpecialty, setSelectedSpecialty] = useState<string | null>(null);
  const [searchHits, setSearchHits] = useState<{ objectID: string }[]>([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Pre-fetch initial Algolia results like DoctorSearchDrawer
  useEffect(() => {
    const index = searchClient.initIndex('doctors_index');
    index
      .search('', { hitsPerPage: 12 })
      .then(({ hits }) => {
        setSearchHits(hits as { objectID: string }[]);
        setIsInitialLoad(false);
      })
      .catch((err) => {
        console.error('Failed to pre-fetch Algolia results:', err);
      });
  }, []);

  // Scroll to top on new search results
  useEffect(() => {
    if (!isInitialLoad && scrollRef.current) {
      scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [searchHits, isInitialLoad]);

  // Handle search filter changes
  const handleFilterChange = useCallback((hits: { objectID: string }[]) => {
    setSearchHits(hits);
    setIsInitialLoad(hits.length === 0); // Reset to initial load when search is cleared
  }, []);

  // Compute displayed doctors
  const displayedDoctors = useMemo(() => {
    if (!allDoctors || allDoctors.length === 0) return []; // Handle loading/empty state
    if (isInitialLoad || (searchHits.length === 0 && !selectedSpecialty)) {
      return allDoctors; // Show all doctors by default
    }

    let filtered = allDoctors;
    if (selectedSpecialty) {
      filtered = allDoctors.filter((doc) =>
        doc.specialty?.toLowerCase() === selectedSpecialty.toLowerCase()
      );
    }

    if (searchHits.length > 0) {
      const idSet = new Set(searchHits.map((hit) => hit.objectID));
      filtered = filtered.filter((doc) => doc.slug?.current && idSet.has(doc.slug.current));
    }

    return filtered;
  }, [allDoctors, searchHits, selectedSpecialty, isInitialLoad]);

  return (
    <>
      <Theme variant="dark-shade">
        <div><Logo /></div>
        <div className="pt-10 lg:pt-48 text-gray-300 text-left sm:text-center max-w-3xl mx-auto">
          <Subtitle>Book an Appointment</Subtitle>
          <Title>Find the right pediatric expert for your child</Title>
          <Content>
            Connect with trusted pediatric specialists who care about your child’s health and well-being.
          </Content>
        </div>
      </Theme>

      <div className="bg-dark-shade text-gray-300 px-4 pb-5 pt-5">
        <InstantSearch searchClient={searchClient} indexName="doctors_index">
          <Configure
            hitsPerPage={12}
            filters={selectedSpecialty ? `specialty:${selectedSpecialty.toLowerCase()}` : ''}
          />

          <div className="sticky top-0 z-20 pt-3 pb-[1px] sm:pt-5 -mx-4 bg-dark-shade px-4">
            <DoctorSearchAlgolia onFilterChange={handleFilterChange} selectedSpecialty={selectedSpecialty} />
          </div>

          <SpecialtyFilter onChange={setSelectedSpecialty} />

          <div ref={scrollRef}>
            <DoctorList
              allDoctors={allDoctors}
              filteredDoctors={displayedDoctors}
              loading={!allDoctors || allDoctors.length === 0} // Use loading state based on allDoctors
            />
          </div>
        </InstantSearch>
      </div>

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