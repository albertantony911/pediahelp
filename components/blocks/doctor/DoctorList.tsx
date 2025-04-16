'use client';

import { useState, useEffect } from 'react';
import DoctorProfileCard from '@/components/blocks/doctor/DoctorProfile';
import DoctorSearch from '@/components/blocks/doctor/DoctorSearch';
import { Search } from 'lucide-react';
import { Doctor } from '@/types';

const ITEMS_PER_PAGE = 6;

interface DoctorListProps {
  allDoctors: Doctor[];
  filteredBySpecialty?: Doctor[];
}

export default function DoctorList({
  allDoctors,
  filteredBySpecialty,
}: DoctorListProps) {
  const [filteredDoctors, setFilteredDoctors] = useState<Doctor[]>(filteredBySpecialty || allDoctors);
  const [filterLoading, setFilterLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    console.log('DoctorList received doctors:', {
      allDoctors: allDoctors.map(d => ({
        name: d.name,
        experienceYears: d.experienceYears,
      })),
      filteredBySpecialty: filteredBySpecialty?.map(d => ({
        name: d.name,
        experienceYears: d.experienceYears,
      })),
    });
    setFilteredDoctors(filteredBySpecialty || allDoctors);
    setCurrentPage(1);
  }, [filteredBySpecialty, allDoctors]);

  const handleFilterChange = (results: Doctor[]) => {
    setFilterLoading(true);
    setTimeout(() => {
      console.log('Filtered doctors:', results.map(d => ({
        name: d.name,
        experienceYears: d.experienceYears,
      })));
      setFilteredDoctors(results);
      setCurrentPage(1);
      setFilterLoading(false);
    }, 300);
  };

  const resetFilters = () => {
    setFilteredDoctors(allDoctors);
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(filteredDoctors.length / ITEMS_PER_PAGE);
  const paginatedDoctors = filteredDoctors.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <>
      <div className="sticky top-0 z-20 py-4 -mx-4 px-4 bg-white dark:bg-zinc-900">
        <DoctorSearch
          allDoctors={allDoctors}
          onFilterChange={handleFilterChange}
          initialSearchQuery=""
        />
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-center mb-4 text-gray-900">OUR DOCTORS</h2>

        {filterLoading ? (
          <div className="text-center py-8 text-gray-600">Filtering doctors...</div>
        ) : paginatedDoctors.length > 0 ? (
          <div className="flex flex-col gap-6">
            {paginatedDoctors.map((doctor) => {
              console.log(`Rendering DoctorProfileCard for ${doctor.name}:`, {
                experienceYears: doctor.experienceYears,
                type: typeof doctor.experienceYears,
              });
              return (
                <DoctorProfileCard
                  key={doctor._id}
                  name={doctor.name}
                  specialty={doctor.specialty}
                  photo={doctor.photo}
                  languages={doctor.languages}
                  appointmentFee={doctor.appointmentFee}
                  nextAvailableSlot={doctor.nextAvailableSlot}
                  rating={doctor.averageRating}
                  reviewCount={doctor.reviewCount || 0}
                  slug={doctor.slug.current}
                  expertise={doctor.expertise}
                  experienceYears={doctor.experienceYears} // Use top-level experienceYears
                />
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg text-gray-900 mb-2">No doctors found</p>
            <p className="text-sm text-gray-500 mb-4">
              Try a different name or select a specialty.
            </p>
            <button
              onClick={resetFilters}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Reset Filters
            </button>
          </div>
        )}

        {totalPages > 1 && !filterLoading && (
          <div className="flex justify-center gap-2 mt-8">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
            >
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-1 rounded ${
                  currentPage === page
                    ? 'bg-green-700 text-white'
                    : 'bg-green-500 text-white hover:bg-green-600'
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </>
  );
}