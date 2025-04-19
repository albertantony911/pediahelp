'use client';

import { useState, useEffect } from 'react';
import DoctorProfileCard from '@/components/blocks/doctor/DoctorProfile';
import { Search } from 'lucide-react';
import { Doctor, Review } from '@/types';

const ITEMS_PER_PAGE = 6;

interface DoctorListProps {
  allDoctorsWithReviews: { doctor: Doctor; reviews: Review[] }[];
  filteredBySpecialty?: { doctor: Doctor; reviews: Review[] }[];
  loading?: boolean;
}

export default function DoctorList({
  allDoctorsWithReviews,
  filteredBySpecialty,
  loading = false,
}: DoctorListProps) {
  const [filteredDoctors, setFilteredDoctors] = useState(allDoctorsWithReviews);
  const [filterLoading, setFilterLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setFilteredDoctors(filteredBySpecialty || allDoctorsWithReviews);
    setCurrentPage(1);
  }, [filteredBySpecialty, allDoctorsWithReviews]);

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
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold text-center mb-4 text-gray-900">
        OUR DOCTORS
      </h2>

      {filterLoading || loading ? (
        <div className="text-center py-8 text-gray-600">Loading doctors...</div>
      ) : paginatedDoctors.length > 0 ? (
        <div className="flex flex-col gap-6">
          {paginatedDoctors.map(({ doctor, reviews }) => (
            <DoctorProfileCard
              key={doctor._id}
              name={doctor.name}
              specialty={doctor.specialty}
              photo={doctor.photo}
              appointmentFee={doctor.appointmentFee}
              reviews={reviews}
              slug={doctor.slug.current}
              expertise={doctor.expertise}
              experienceYears={doctor.experienceYears}
              nextAvailableSlot={doctor.nextAvailableSlot}
              languages={doctor.languages}
              whatsappNumber={doctor.whatsappNumber}
            />
          ))}
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

      {totalPages > 1 && !filterLoading && !loading && (
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
  );
}