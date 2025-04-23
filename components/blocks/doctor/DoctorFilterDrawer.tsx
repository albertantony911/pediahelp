'use client';

import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';

interface DoctorFilterDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function DoctorFilterDrawer({
  open,
  onOpenChange,
}: DoctorFilterDrawerProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="px-6 pb-8 pt-6 rounded-t-2xl border-t border-muted bg-background">
        <DrawerHeader>
          <DrawerTitle className="text-xl font-bold">Filter Doctors</DrawerTitle>
        </DrawerHeader>

        <div className="mt-6 space-y-4">
          {/* 🛠️ Add real filters here */}
          <p className="text-muted-foreground">
            Specialty, consultation fee, available now, etc. coming soon.
          </p>
        </div>

        <div className="mt-8 flex justify-end">
          <DrawerClose asChild>
            <Button variant="outline">Close</Button>
          </DrawerClose>
        </div>
      </DrawerContent>
    </Drawer>
  );
}