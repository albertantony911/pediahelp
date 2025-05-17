'use client';

import React, { useEffect, useMemo, useRef, memo } from 'react';
import { CheckCircle, Calendar, Download } from 'lucide-react';
import { useBookingStore } from '@/store/bookingStore';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { tv } from 'tailwind-variants';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import debounce from 'lodash.debounce';
import { Button } from '@/components/ui/button';

const buttonStyles = tv({
  base: 'w-full px-4 py-2.5 text-sm font-semibold rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2',
  variants: {
    intent: {
      primary: 'bg-gradient-to-r from-teal-500 to-teal-600 text-white hover:from-teal-600 hover:to-teal-700 hover:scale-[1.02] hover:shadow-lg',
      secondary: 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200 hover:scale-[1.02]',
    },
  },
});

const StepSuccess = memo(function StepSuccess() {
  const {
    selectedDoctor,
    selectedSlot,
    patient,
    reset,
  } = useBookingStore();

  const primaryButtonRef = useRef<HTMLButtonElement>(null);
  const [isResetting, setIsResetting] = React.useState(false);

  const { formattedDate, formattedTime } = useMemo(() => {
    if (!selectedSlot) return { formattedDate: '', formattedTime: '' };
    const date = new Date(selectedSlot);
    return {
      formattedDate: date.toLocaleDateString('en-IN', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      formattedTime: date.toLocaleTimeString('en-IN', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }),
    };
  }, [selectedSlot]);

  useEffect(() => {
    primaryButtonRef.current?.focus();
  }, []);

  const handleReset = debounce(() => {
    setIsResetting(true);
    reset();
    setIsResetting(false);
  }, 300);

  const generatePdf = async () => {
    if (!selectedDoctor?.name || !selectedSlot) return;

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([480, 320]);

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const { height, width } = page.getSize();

    const drawText = (text: string, x: number, y: number, size = 12, color = rgb(0.1, 0.1, 0.1), bold = false) => {
      page.drawText(text, {
        x,
        y,
        size,
        font: bold ? boldFont : font,
        color,
      });
    };

    const center = (text: string, y: number, size = 14, bold = false) => {
      const textWidth = (bold ? boldFont : font).widthOfTextAtSize(text, size);
      const x = (width - textWidth) / 2;
      drawText(text, x, y, size, undefined, bold);
    };

    center('PediaHelp Appointment Confirmation', height - 40, 14, true);
    center(selectedDoctor.name, height - 70, 13, true);
    center(selectedDoctor.specialty || '', height - 90, 11);
    center(`${formattedDate} at ${formattedTime}`, height - 120, 11, false);
    center(selectedDoctor.location || 'Clinic', height - 140, 10, false);
    center(`Confirmation sent to ${patient?.email || patient?.phone || 'your contact'}`, height - 170, 9);

    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `appointment-${selectedDoctor.name}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-lg mx-auto space-y-8 py-12 px-8 sm:px-6">
      <motion.div
        className="flex flex-col items-center text-center gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          <CheckCircle className="w-14 h-14 text-green-500" />
        </motion.div>
        <h2 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-teal-600 to-blue-600">
          Appointment Confirmed
        </h2>
        <p className="text-gray-500 text-base">
          Thank you! Your appointment has been booked successfully.
        </p>
      </motion.div>

      {selectedDoctor && selectedSlot && (
        <motion.div
          className="relative rounded-2xl border-gray-200 border border-l-teal-500 border-l-4 shadow-lg bg-white overflow-hidden hover:shadow-xl transition-shadow duration-300"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.15 }}
        >
          <div className="flex gap-4 p-6 items-center">
            <img
              src={selectedDoctor.photo?.asset?.url || '/doctor-placeholder.jpg'}
              alt={`Profile photo of ${selectedDoctor.name}`}
              className="w-16 h-16 rounded-xl object-cover border border-gray-200"
            />
            <div className="text-left">
              <div className="font-semibold text-gray-800 text-lg">{selectedDoctor.name}</div>
              {selectedDoctor.specialty && (
                <div className="text-sm text-gray-500">{selectedDoctor.specialty}</div>
              )}
              {selectedDoctor.location && (
                <div className="text-xs text-gray-400 mt-1">{selectedDoctor.location}</div>
              )}
            </div>
          </div>

            <div className="bg-gradient-to-r from-teal-50 to-blue-50 border-t border-dashed px-6 py-4 text-sm rounded-b-xl">
                <div className="flex justify-between items-start">
                    {/* Date */}
                    <div>
                    <div className="text-xs text-muted-foreground">Date</div>
                    <div className="text-sm font-medium text-gray-800">{formattedDate}</div>
                    </div>

                    {/* Time */}
                    <div className="text-right">
                    <div className="text-xs text-muted-foreground">Time</div>
                    <div className="text-sm font-semibold text-gray-800">{formattedTime}</div>
                    </div>
                </div>

                {/* Confirmation Note */}
                <div className="mt-4 border-t border-dashed pt-3 text-center text-xs text-muted-foreground">
                    Confirmation sent to{' '}
                    <span className="font-medium text-gray-800">
                    {patient?.email || patient?.phone || 'your contact'}
                    </span>
                    . You will receive updates via SMS, WhatsApp, and Email.
                </div>
                </div>
        </motion.div>
      )}

      <motion.div
        className="flex flex-col gap-3"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.3 }}
      >
        <Button
          ref={primaryButtonRef}
          className={cn(buttonStyles({ intent: 'primary' }))}
          onClick={handleReset}
          disabled={isResetting}
        >
          {isResetting ? 'Processing...' : 'Book Another Appointment'}
        </Button>
        <Button
          className={cn(buttonStyles({ intent: 'secondary' }))}
          onClick={generatePdf}
        >
          <Download className="w-4 h-4 mr-2" />
          Download PDF
        </Button>
      </motion.div>
    </div>
  );
}, () => true);

export default StepSuccess;