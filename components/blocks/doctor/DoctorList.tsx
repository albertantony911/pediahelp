'use client';

import { useState, useEffect } from 'react';
import DoctorProfileCard from '@/components/blocks/doctor/DoctorProfile';
import { Search } from 'lucide-react';
import type { Doctor } from '@/types';

const ITEMS_PER_PAGE = 7;

interface DoctorListProps {
  allDoctors: Doctor[]; // ✅ direct use of Doctor[]
  filteredDoctors?: Doctor[];
  loading?: boolean;
}

export default function DoctorList({
  allDoctors,
  filteredDoctors,
  loading = false,
}: DoctorListProps) {
  const [doctors, setDoctors] = useState<Doctor[]>(filteredDoctors || allDoctors);
  const [currentPage, setCurrentPage] = useState(1);

  // Reset doctors and page when filters change
  useEffect(() => {
    setDoctors(filteredDoctors || allDoctors);
    setCurrentPage(1);
  }, [filteredDoctors, allDoctors]);

  const resetFilters = () => {
    setDoctors(allDoctors);
    setCurrentPage(1);
  };

  const totalPages = Math.ceil((doctors?.length || 0) / ITEMS_PER_PAGE);

  const paginatedDoctors = doctors.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="space-y-6 mt-7">
      

      {loading ? (
        <div className="text-center py-8 text-gray-600">Loading doctors...</div>
      ) : paginatedDoctors.length > 0 ? (
        <div className="flex flex-col gap-6">
          {paginatedDoctors.map((doctor) => (
            <DoctorProfileCard key={doctor._id} {...doctor} />
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-lg text-gray-900 mb-2">No doctors found</p>
          <p className="text-sm text-gray-500 mb-4">Try a different name or select a specialty.</p>
          <button
            onClick={resetFilters}
            className="px-4 py-2 bg-green-600 text-white rounded-full font-medium transition hover:bg-green-700 active:scale-95 active:shadow-inner"
          >
            Reset Filters
          </button>
        </div>
      )}

      {totalPages > 1 && !loading && (
        <div className="flex justify-center gap-2 mt-8 flex-wrap">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 rounded-full bg-green-500 text-white font-medium hover:bg-green-600 active:scale-95 active:shadow-inner transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`px-4 py-2 rounded-full font-medium transition active:scale-95 ${
                currentPage === page
                  ? 'bg-green-700 text-white shadow-inner'
                  : 'bg-green-500 text-white hover:bg-green-600'
              }`}
            >
              {page}
            </button>
          ))}

          <button
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 rounded-full bg-green-500 text-white font-medium hover:bg-green-600 active:scale-95 active:shadow-inner transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}