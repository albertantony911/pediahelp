'use client'

import { cn } from '@/lib/utils'
import { TypographyProvider } from '@/components/ui/theme/typography/TypographyProvider'

export type ThemeVariant = 'dark-shade' | 'mid-shade' | 'light-shade' | 'white'
export type ContainerType = 'default' | 'left' | 'right'

interface ThemeProps {
  variant: ThemeVariant
  children: React.ReactNode
  className?: string
  disableContainer?: boolean
  containerType?: ContainerType
}

const backgroundVariants: Record<ThemeVariant, string> = {
  'dark-shade': 'bg-dark-shade',
  'mid-shade': 'bg-mid-shade',
  'light-shade': 'bg-light-shade',
  white: 'bg-white',
}

const containerVariants: Record<ContainerType, string> = {
  default: 'container max-sm:px-10',
  left: 'left-container',
  right: 'right-container',
}

export function Theme({
  variant,
  children,
  className,
  disableContainer = false,
  containerType = 'default',
}: ThemeProps) {
  const wrapperClass = cn('w-full text-left', backgroundVariants[variant], className)
  const content = (
    <TypographyProvider variant={`${variant}-bg` as const}>
      {children}
    </TypographyProvider>
  )

  return (
    <section className={wrapperClass}>
      {disableContainer ? content : (
        <div className={cn(containerVariants[containerType], 'text-left')}>
          {content}
        </div>
      )}
    </section>
  )
}