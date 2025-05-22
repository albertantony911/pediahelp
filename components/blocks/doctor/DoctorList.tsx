'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DoctorProfileCard from '@/components/blocks/doctor/DoctorProfile';
import { Search } from 'lucide-react';
import type { Doctor } from '@/types';

const ITEMS_PER_PAGE = 12;

interface DoctorListProps {
  allDoctors?: Doctor[];
  filteredDoctors?: Doctor[];
  loading?: boolean;
}

export default function DoctorList({
  allDoctors = [],
  filteredDoctors,
  loading = false,
}: DoctorListProps) {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [currentPage, setCurrentPage] = useState(0);

  useEffect(() => {
    const baseList = filteredDoctors?.length ? filteredDoctors : allDoctors;
    setDoctors(baseList);
    setCurrentPage(0);
  }, [filteredDoctors, allDoctors]);

  const totalPages = Math.ceil(doctors.length / ITEMS_PER_PAGE);

  const paginatedDoctors = doctors.slice(
    currentPage * ITEMS_PER_PAGE,
    (currentPage + 1) * ITEMS_PER_PAGE
  );

  const onPageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-6 mt-0 mb-10">
      {loading ? (
        <div className="grid gap-6 max-w-4xl mx-auto">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-[180px] bg-gray-200 animate-pulse rounded-3xl"></div>
          ))}
        </div>
      ) : paginatedDoctors.length > 0 ? (
        <div className="flex flex-col gap-6 max-w-4xl mx-auto">
          <AnimatePresence mode="wait">
            {paginatedDoctors.map((doctor) => (
              <motion.div
                key={doctor._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.3 }}
              >
                <DoctorProfileCard {...doctor} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center text-center py-16 text-white/80">
          <Search className="w-12 h-12 text-white/30 mb-4" />
          <p className="text-lg font-medium mb-1">No doctors found</p>
          <p className="text-sm text-white/60">Try a different name or select a different specialty.</p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && !loading && (
        <div className="flex flex-wrap gap-3 sm:gap-4 justify-center items-center max-w-full px-4 py-2 mt-8">
          {/* Previous Button */}
          <button
            onClick={() => onPageChange(Math.max(0, currentPage - 1))}
            disabled={currentPage === 0}
            aria-label="Previous Page"
            className="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center rounded-full border border-gray-300 text-[var(--mid-shade)] bg-white hover:bg-[var(--mid-shade)] hover:text-white hover:scale-110 hover:shadow-lg transition-all duration-300 ease-in-out disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Page Number Buttons */}
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageToShow;
            if (totalPages <= 5) {
              pageToShow = i;
            } else if (currentPage < 2) {
              pageToShow = i;
            } else if (currentPage > totalPages - 3) {
              pageToShow = totalPages - 5 + i;
            } else {
              pageToShow = currentPage - 2 + i;
            }

            return (
              <button
                key={pageToShow}
                onClick={() => onPageChange(pageToShow)}
                aria-label={`Page ${pageToShow + 1}`}
                aria-current={currentPage === pageToShow ? 'page' : undefined}
                className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full text-base font-semibold flex items-center justify-center transition-all duration-300 ease-in-out
                  ${
                    currentPage === pageToShow
                      ? 'bg-[var(--mid-shade)] text-white shadow-lg scale-105'
                      : 'bg-transparent text-gray-400 border border-gray-400 hover:bg-[var(--mid-shade)] hover:text-white hover:scale-105 hover:shadow-md'
                  }`}
              >
                {pageToShow + 1}
              </button>
            );
          })}

          {/* Next Button */}
          <button
            onClick={() => onPageChange(Math.min(totalPages - 1, currentPage + 1))}
            disabled={currentPage === totalPages - 1 || totalPages === 0}
            aria-label="Next Page"
            className="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center rounded-full border border-gray-300 text-[var(--mid-shade)] bg-white hover:bg-[var(--mid-shade)] hover:text-white hover:scale-110 hover:shadow-lg transition-all duration-300 ease-in-out disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
