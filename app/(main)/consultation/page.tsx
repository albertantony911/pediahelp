'use client';

import { useState, useEffect } from 'react';
import { groq } from 'next-sanity';
import { client } from '@/sanity/lib/client';
import DoctorList from '@/components/blocks/doctor/DoctorList';
import SpecialtyFilter from '@/components/blocks/doctor/SpecialtyFilter';
import { Doctor } from '@/types';


async function getDoctors(): Promise<Doctor[]> {
  try {
const doctors = await client.fetch<Doctor[]>(
  groq`*[_type == "doctor"] | order(orderRank asc) {
    _id,
    name,
    specialty,
    experienceYears, // ✅ added here
    photo { asset->{ _id, url } },
    slug,
    languages,
    appointmentFee,
    nextAvailableSlot,
    averageRating,
    expertise,
    whatsappNumber,
    qualifications {
      education,
      achievements,
      publications,
      others
    },
    "reviewCount": count(*[_type == "review" && doctor._ref == ^._id && approved == true])
  }`
);
      console.log('Fetched doctors:', doctors);
      console.log('Fetched doctors:', JSON.stringify(doctors, null, 2));
    return doctors;
  } catch (error) {
    console.error('Error fetching doctors:', error);
    return [];
  }
}

export default function ConsultationPageWrapper() {
  const [allDoctors, setAllDoctors] = useState<Doctor[]>([]);
  const [filteredBySpecialty, setFilteredBySpecialty] = useState<Doctor[] | undefined>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDoctors() {
      const data = await getDoctors();
      setAllDoctors(data);
      setLoading(false);
    }
    loadDoctors();
  }, []);

  const handleSpecialtyFilter = (specialty: string) => {
    const filtered = allDoctors.filter(
      (doc) => doc.specialty.toLowerCase() === specialty.toLowerCase()
    );
    setFilteredBySpecialty(filtered);
  };

  const resetSpecialtyFilter = () => {
    setFilteredBySpecialty(undefined);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white text-gray-300 px-4 py-8">
        <h1 className="text-3xl font-bold text-center mb-6">FIND YOUR DOCTOR</h1>
        <div className="text-center py-8 text-white">Loading doctors...</div>
      </div>
    );
  }

  if (!allDoctors.length) {
    return (
      <div className="min-h-screen bg-white text-gray-300 max-w-lg px-4 py-8">
        <h1 className="text-3xl font-bold text-center mb-6">FIND YOUR DOCTOR</h1>
        <div className="text-center py-8 text-red-400">
          Failed to load doctors. Please try again later.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-gray-300  px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-6">FIND YOUR DOCTOR</h1>
      <SpecialtyFilter onFilter={handleSpecialtyFilter} onReset={resetSpecialtyFilter} />
      <DoctorList allDoctors={allDoctors} filteredBySpecialty={filteredBySpecialty} />
    </div>
  );
}