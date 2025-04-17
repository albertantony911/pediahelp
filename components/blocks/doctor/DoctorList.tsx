'use client';

import { useState, useEffect } from 'react';
import DoctorProfileCard from '@/components/blocks/doctor/DoctorProfile';
import DoctorSearch from '@/components/blocks/doctor/DoctorSearch';
import { Search } from 'lucide-react';
import { Doctor, Review } from '@/types';

const ITEMS_PER_PAGE = 6;

interface DoctorListProps {
  allDoctorsWithReviews: { doctor: Doctor; reviews: Review[] }[];
  filteredBySpecialty?: { doctor: Doctor; reviews: Review[] }[];
}

export default function DoctorList({
  allDoctorsWithReviews,
  filteredBySpecialty,
}: DoctorListProps) {
  const [filteredDoctors, setFilteredDoctors] = useState<{ doctor: Doctor; reviews: Review[] }[]>(filteredBySpecialty || allDoctorsWithReviews);
  const [filterLoading, setFilterLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setFilteredDoctors(filteredBySpecialty || allDoctorsWithReviews);
    setCurrentPage(1);
  }, [filteredBySpecialty, allDoctorsWithReviews]);

  const handleFilterChange = (results: Doctor[]) => {
    setFilterLoading(true);
    setTimeout(() => {
      const matchedDoctors = allDoctorsWithReviews.filter((item) =>
        results.some((r) => r._id === item.doctor._id)
      );
      setFilteredDoctors(matchedDoctors);
      setCurrentPage(1);
      setFilterLoading(false);
    }, 300);
  };

  const resetFilters = () => {
    setFilteredDoctors(allDoctorsWithReviews);
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
          allDoctors={allDoctorsWithReviews.map((item) => item.doctor)}
          onFilterChange={handleFilterChange}
          initialSearchQuery=""
        />
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-center mb-4 text-gray-900">
          OUR DOCTORS
        </h2>

        {filterLoading ? (
          <div className="text-center py-8 text-gray-600">Filtering doctors...</div>
        ) : paginatedDoctors.length > 0 ? (
          <div className="flex flex-col gap-6">
            {paginatedDoctors.map((item) => {
              const { doctor, reviews } = item;
              const { _id, name, specialty, photo, appointmentFee, slug, expertise, experienceYears, nextAvailableSlot, languages, whatsappNumber } = doctor;

              if (process.env.NODE_ENV !== 'production') {
                console.debug(`DoctorListCard: ${name}`, {
                  whatsappNumber,
                  isValid: typeof whatsappNumber === 'string' && /^\+91\d{10}$/.test(whatsappNumber),
                });
              }

              return (
                <DoctorProfileCard
                  key={_id}
                  name={name}
                  specialty={specialty}
                  photo={photo}
                  appointmentFee={appointmentFee}
                  reviews={reviews} // Pass reviews for dynamic calculation
                  slug={slug.current}
                  expertise={expertise}
                  experienceYears={experienceYears}
                  nextAvailableSlot={nextAvailableSlot}
                  languages={languages}
                  whatsappNumber={whatsappNumber}
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