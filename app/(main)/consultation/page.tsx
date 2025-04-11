"use client"; // Add this directive to make the page a client component

import React, { useState, useEffect } from 'react'
import DoctorProfileCard from '@/components/blocks/doctor/DoctorProfile'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Stethoscope, HeartPulse, Brain, BadgePlus, Baby, Bone, Headphones, Eye } from 'lucide-react'
import { createClient } from '@sanity/client'
import type { SanityDocument } from '@sanity/client'

interface Doctor extends SanityDocument {
  name: string
  specialty: string
  photo?: { asset?: { url: string } } // Updated to match resolved URL
  slug: { current: string }
  languages?: string[]
  appointmentFee?: number
  nextAvailableSlot?: string
  rating?: string
  reviewCount?: number
  expertise?: string[]
  experience?: string
}

const specialtyIcons: Record<string, React.ReactNode> = {
  Cardiology: <HeartPulse className="w-6 h-6 text-green-500" />,
  Neurology: <Brain className="w-6 h-6 text-green-500" />,
  Ophthalmology: <Eye className="w-6 h-6 text-green-500" />,
  Dentistry: <BadgePlus className="w-6 h-6 text-green-500" />,
  Pediatrics: <Baby className="w-6 h-6 text-green-500" />,
  Orthopedics: <Bone className="w-6 h-6 text-green-500" />,
  Psychiatry: <Headphones className="w-6 h-6 text-green-500" />,
}

const specialties = Object.keys(specialtyIcons)

const client = createClient({
  projectId: 'lez7cr3f', // Replace with your Sanity project ID
  dataset: 'production', // Replace with your dataset name
  apiVersion: '2023-10-01',
  useCdn: false, // Set to true for production if okay with cached data
})

export default function ConsultationPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredDoctors, setFilteredDoctors] = useState<Doctor[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const data = await client.fetch<Doctor[]>(
          `*[_type == "doctor"] | order(orderRank asc) {
            name,
            specialty,
            photo { asset->{url} }, // Updated to resolve the URL
            slug,
            languages,
            appointmentFee,
            nextAvailableSlot,
            expertise,
            experience
          }`
        );
        console.log('Fetched doctors with photos:', data); // Debug log
        setFilteredDoctors(data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching doctors:', error);
        setLoading(false);
      }
    };
    fetchDoctors();
  }, [])

  const handleSearch = () => {
    const filtered = filteredDoctors.filter((doctor) =>
      doctor.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    setFilteredDoctors(filtered)
  }

  const handleSpecialtyFilter = (specialty: string) => {
    const filtered = filteredDoctors.filter((doctor) =>
      doctor.specialty.toLowerCase() === specialty.toLowerCase()
    )
    setFilteredDoctors(filtered)
  }

  if (loading) return <div className="text-center py-8 text-white">Loading doctors...</div>

  return (
    <div className="min-h-screen bg-teal-900 text-white px-4 py-8">
      {/* Header */}
      <h1 className="text-3xl font-bold text-center mb-6">FIND YOUR DOCTOR</h1>

      {/* Specialty Filters */}
      <div className="flex space-x-4 overflow-x-auto pb-4 justify-center">
        {specialties.map((specialty) => (
          <Button
            key={specialty}
            onClick={() => handleSpecialtyFilter(specialty)}
            className="min-w-max px-4 py-2 bg-green-100 text-teal-900 rounded-full flex items-center gap-2 hover:bg-green-200 transition"
          >
            {specialtyIcons[specialty] || <Stethoscope className="w-6 h-6 text-green-500" />}
            <span className="capitalize">{specialty.toLowerCase()}</span>
          </Button>
        ))}
      </div>

      {/* Search Bar */}
      <div className="flex items-center space-x-4 mb-6 max-w-md mx-auto">
        <Input
          type="text"
          placeholder="Search by doctor's name"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 bg-white text-teal-900 placeholder-teal-400 rounded-full px-4 py-2"
        />
        <Button
          onClick={handleSearch}
          className="bg-green-500 text-white rounded-full px-4 py-2 hover:bg-green-600 transition"
        >
          Search
        </Button>
      </div>

      {/* Doctors List */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-center mb-4">OUR DOCTORS</h2>
        {filteredDoctors.length > 0 ? (
          filteredDoctors.map((doctor) => (
            <DoctorProfileCard
              key={doctor.slug.current}
              name={doctor.name}
              specialty={doctor.specialty}
              photoUrl={doctor.photo?.asset?.url || '/default-photo.jpg'} // Use resolved URL
              languages={doctor.languages}
              appointmentFee={doctor.appointmentFee || 0}
              nextAvailableSlot={doctor.nextAvailableSlot || 'N/A'}
              rating="4.8"
              reviewCount={9}
              slug={doctor.slug.current}
              expertise={doctor.expertise?.join(', ') || 'General Practice'}
              experience={doctor.experience || '8+ years'}
            />
          ))
        ) : (
          <p className="text-center">No doctors found based on your search or filter.</p>
        )}
      </div>
    </div>
  )
}