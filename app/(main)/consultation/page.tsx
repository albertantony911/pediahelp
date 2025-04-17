'use client';

import { useState, useEffect } from 'react';
import { groq } from 'next-sanity';
import { client } from '@/sanity/lib/client';
import DoctorList from '@/components/blocks/doctor/DoctorList';
import SpecialtyFilter from '@/components/blocks/doctor/SpecialtyFilter';
import { Doctor, Review } from '@/types';

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
        whatsappNumber,
        qualifications {
          education,
          achievements,
          publications,
          others
        }
      }`
    );
    console.log('Fetched doctors:', doctors);
    console.log('Fetched doctors:', JSON.stringify(doctors, null, 2));

    // Fetch reviews for each doctor
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
  const [allDoctorsWithReviews, setAllDoctorsWithReviews] = useState<{ doctor: Doctor; reviews: Review[] }[]>([]);
  const [filteredBySpecialty, setFilteredBySpecialty] = useState<{ doctor: Doctor; reviews: Review[] }[] | undefined>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDoctors() {
      const data = await getDoctors();
      setAllDoctorsWithReviews(data);
      setLoading(false);
    }
    loadDoctors();
  }, []);

  const handleSpecialtyFilter = (specialty: string) => {
    const filtered = allDoctorsWithReviews.filter(
      (item) => item.doctor.specialty.toLowerCase() === specialty.toLowerCase()
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

  if (!allDoctorsWithReviews.length) {
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
    <div className="min-h-screen bg-white text-gray-300 px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-6">FIND YOUR DOCTOR</h1>
      <SpecialtyFilter onFilter={handleSpecialtyFilter} onReset={resetSpecialtyFilter} />
      <DoctorList allDoctorsWithReviews={allDoctorsWithReviews} filteredBySpecialty={filteredBySpecialty} />
    </div>
  );
}