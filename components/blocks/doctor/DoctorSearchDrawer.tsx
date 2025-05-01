'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerTitle,
  DrawerHeader,
  DrawerFooter,
  DrawerClose,
} from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import DoctorList from '@/components/blocks/doctor/DoctorList'
import DoctorSearch from '@/components/blocks/doctor/DoctorSearch'
import { client } from '@/sanity/lib/client'
import { groq } from 'next-sanity'
import type { Doctor, Review } from '@/types'

type Props = {
  children: React.ReactNode
}

export function DoctorSearchDrawer({ children }: Props) {
  const [allDoctors, setAllDoctors] = useState<Doctor[]>([])
  const [filteredDoctors, setFilteredDoctors] = useState<Doctor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Fetch all doctors on mount
  useEffect(() => {
    async function loadDoctors() {
      try {
        const data = await getDoctors()
        setAllDoctors(data)
      } catch (err) {
        setError('Failed to load doctors. Please try again later.')
      } finally {
        setLoading(false)
      }
    }

    loadDoctors()
  }, [])

  // Update filtered doctor list
  const handleFilterChange = useCallback((filtered: Doctor[]) => {
    setFilteredDoctors(filtered)
  }, [])

  // Handle scroll-up gesture to close drawer
  const handleScroll = () => {
    if (!scrollRef.current) return
    if (scrollRef.current.scrollTop < -30) {
      const closeBtn = document.querySelector('[data-drawer-close]')
      if (closeBtn instanceof HTMLElement) closeBtn.click()
    }
  }

  return (
    <Drawer>
      <DrawerTrigger asChild>{children}</DrawerTrigger>

      <DrawerContent className="max-h-[90vh] overflow-hidden rounded-t-[2.5rem] shadow-2xl">
        {/* ✅ Accessibility title (visually hidden) */}
        <DrawerTitle className="sr-only">Search for Doctors</DrawerTitle>

        <div className="mx-auto w-full max-w-2xl flex flex-col h-[90vh]">
          {/* === Loading / Error States === */}
          {loading ? (
            <div className="text-center text-gray-400 py-8">Loading doctors...</div>
          ) : error || !allDoctors.length ? (
            <div className="text-center text-red-400 py-8">
              {error || 'No doctors found.'}
            </div>
          ) : (
            <>
              {/* === Sticky Search Header === */}
              <DrawerHeader className="sticky top-0 z-20 flex flex-col items-center bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60 border-b pt-3 pb-2">
                <p className="text-xs text-muted-foreground tracking-wide mb-2">
                  Pull down to close
                </p>
                <div className="w-full px-4">
                  <DoctorSearch
                    allDoctors={allDoctors}
                    onFilterChange={handleFilterChange}
                  />
                </div>
              </DrawerHeader>

              {/* === Scrollable Doctor List === */}
              <div
                ref={scrollRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto px-4 pt-4 scrollbar-hide"
              >
                <DoctorList
                  allDoctors={allDoctors}
                  filteredDoctors={
                    filteredDoctors.length ? filteredDoctors : undefined
                  }
                />
              </div>

              {/* === Sticky Footer with Close === */}
              <DrawerFooter className="sticky bottom-0 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60 px-4 py-6 border-t">
                <DrawerClose asChild>
                  <Button
                    variant="outline"
                    className="w-full font-semibold hover:bg-muted transition"
                    data-drawer-close
                  >
                    Close
                  </Button>
                </DrawerClose>
              </DrawerFooter>
            </>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  )
}

async function getDoctors(): Promise<Doctor[]> {
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
        searchKeywords,
        whatsappNumber,
        qualifications {
          education,
          achievements,
          publications,
          others
        }
      }`
    )

    const doctorsWithReviews = await Promise.all(
      doctors.map(async (doctor) => {
        const reviews = await client.fetch<Review[]>(
          groq`*[_type == "review" && doctor._ref == $id && approved == true] | order(submittedAt desc) {
            _id, name, rating, comment, submittedAt
          }`,
          { id: doctor._id }
        )
        return { ...doctor, reviews }
      })
    )

    return doctorsWithReviews
  } catch (error) {
    console.error('Error fetching doctors:', error)
    return []
  }
}