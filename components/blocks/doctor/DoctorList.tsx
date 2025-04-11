// components/blocks/doctor/DoctorList.tsx
'use client';

import { useState, useEffect } from 'react';
import DoctorProfileCard from '@/components/blocks/doctor/DoctorProfile';
import DoctorSearch from '@/components/blocks/doctor/DoctorSearch';
import { Button } from '@/components/ui/button';
import {
  Stethoscope,
  HeartPulse,
  Brain,
  BadgePlus,
  Baby,
  Bone,
  Headphones,
  Eye,
  Search,
} from 'lucide-react';
import { Doctor, DoctorProfileCardProps } from '@/types'; // Corrected import

const specialtyIcons: Record<string, React.ReactNode> = {
  Cardiology: <HeartPulse className="w-4 h-4 text-green-500" />,
  Neurology: <Brain className="w-4 h-4 text-green-500" />,
  Ophthalmology: <Eye className="w-4 h-4 text-green-500" />,
  Dentistry: <BadgePlus className="w-4 h-4 text-green-500" />,
  Pediatrics: <Baby className="w-4 h-4 text-green-500" />,
  Orthopedics: <Bone className="w-4 h-4 text-green-500" />,
  Psychiatry: <Headphones className="w-4 h-4 text-green-500" />,
};

const specialties = Object.keys(specialtyIcons);
const ITEMS_PER_PAGE = 6;

export default function DoctorList({ allDoctors }: { allDoctors: Doctor[] }) {
  const [filteredDoctors, setFilteredDoctors] = useState<Doctor[]>(allDoctors);
  const [filterLoading, setFilterLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setFilteredDoctors(allDoctors);
  }, [allDoctors]);

  const handleFilterChange = (results: Doctor[]) => {
    setFilterLoading(true);
    setTimeout(() => {
      setFilteredDoctors(results);
      setCurrentPage(1);
      setFilterLoading(false);
    }, 300);
  };

  const handleSpecialtyFilter = (specialty: string) => {
    setFilterLoading(true);
    setTimeout(() => {
      const filtered = allDoctors.filter(
        (doctor) => doctor.specialty.toLowerCase() === specialty.toLowerCase()
      );
      setFilteredDoctors(filtered);
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
      <div className="flex flex-wrap gap-4 justify-center mb-6 overflow-x-auto sm:hidden">
        {specialties.map((specialty) => (
          <Button
            key={specialty}
            onClick={() => handleSpecialtyFilter(specialty)}
            className="min-w-max px-4 py-2 bg-green-100 text-teal-900 rounded-full flex items-center gap-2 hover:bg-green-200 transition"
            aria-label={`Filter by ${specialty}`}
          >
            {specialtyIcons[specialty] || <Stethoscope className="w-4 h-4 text-green-500" />}
            <span className="capitalize">{specialty.toLowerCase()}</span>
          </Button>
        ))}
        <Button
          onClick={resetFilters}
          className="min-w-max px-4 py-2 bg-gray-100 text-teal-900 rounded-full hover:bg-gray-200 transition"
          aria-label="Show all specialties"
        >
          All Specialties
        </Button>
      </div>

      <div className="sticky top-0 bg-teal-900 z-20 py-4 -mx-4 px-4">
        <DoctorSearch
          allDoctors={allDoctors}
          onFilterChange={handleFilterChange}
          initialSearchQuery=""
        />
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-center mb-4">OUR DOCTORS</h2>
        {filterLoading ? (
          <div className="text-center py-8">Filtering doctors...</div>
        ) : paginatedDoctors.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {paginatedDoctors.map((doctor) => (
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
                experienceYears={doctor.qualifications?.experienceYears || 0}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg mb-2">No doctors found</p>
            <p className="text-sm text-gray-300 mb-4">
              Try a different name or select a specialty.
            </p>
            <Button
              onClick={resetFilters}
              className="bg-green-500 text-white hover:bg-green-600"
            >
              Reset Filters
            </Button>
          </div>
        )}

        {totalPages > 1 && filteredDoctors.length > 1 && !filterLoading && (
          <div className="flex justify-center gap-2 mt-8">
            <Button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="bg-green-500 text-white hover:bg-green-600"
            >
              Previous
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={
                  currentPage === page
                    ? 'bg-green-700 text-white'
                    : 'bg-green-500 text-white hover:bg-green-600'
                }
              >
                {page}
              </Button>
            ))}
            <Button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="bg-green-500 text-white hover:bg-green-600"
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </>
  );
}