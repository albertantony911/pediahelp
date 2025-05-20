'use client';

import * as React from 'react';
import * as AccordionPrimitive from '@radix-ui/react-accordion';
import { ChevronDownIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

// === Accordion Root ===
const Accordion = React.forwardRef<
  never,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Root>
>((props, _ref) => (
  <AccordionPrimitive.Root data-slot="accordion" {...props} />
));

Accordion.displayName = 'Accordion';

// === Accordion Item ===
const AccordionItem = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>
>(({ className, ...props }, ref) => (
  <AccordionPrimitive.Item
    ref={ref}
    data-slot="accordion-item"
    className={cn('last:border-b-0', className)}
    {...props}
  />
));

AccordionItem.displayName = 'AccordionItem';

// === Accordion Trigger ===
const AccordionTrigger = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Header className="flex">
    <AccordionPrimitive.Trigger
      ref={ref}
      data-slot="accordion-trigger"
      className={cn(
        'ring-ring/10 dark:ring-ring/20 dark:outline-ring/40 outline-ring/50 flex flex-1 items-start justify-between gap-2 rounded-md py-2 text-left lg:text-lg text-base font-bold transition-all hover:underline focus-visible:ring-4 focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50 [&[data-state=open]>svg]:rotate-180',
        className
      )}
      {...props}
    >
      {children}
      <ChevronDownIcon className="text-white pointer-events-none size-4 shrink-0 translate-y-0.5 transition-transform duration-200" />
    </AccordionPrimitive.Trigger>
  </AccordionPrimitive.Header>
));

AccordionTrigger.displayName = 'AccordionTrigger';

// === Accordion Content ===
const AccordionContent = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Content
    ref={ref}
    data-slot="accordion-content"
    className="data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down overflow-hidden lg:text-lg text-white/80 text-base"
    {...props}
  >
    <div className={cn('pb-2', className)}>{children}</div>
  </AccordionPrimitive.Content>
));

AccordionContent.displayName = 'AccordionContent';

// === Export all ===
export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };