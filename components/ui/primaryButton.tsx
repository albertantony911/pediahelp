'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils'; // Or use clsx if you prefer

interface PrimaryButtonProps {
  href?: string;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

export default function PrimaryButton({
  href,
  onClick,
  children,
  className = '',
  disabled = false,
}: PrimaryButtonProps) {
  const baseStyles =
    'inline-flex items-center justify-center rounded-full font-semibold px-6 py-2.5 text-sm sm:text-base transition-all duration-150 ease-out border border-transparent';

  const enabledStyles =
    'bg-gray-900 text-white hover:bg-white hover:text-gray-900 hover:border-gray-900';

  const disabledStyles = 'bg-gray-200 text-gray-400 cursor-not-allowed';

  const buttonClasses = cn(baseStyles, disabled ? disabledStyles : enabledStyles, className);

  if (href && !disabled) {
    return <Link href={href} className={buttonClasses}>{children}</Link>;
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={buttonClasses}
      disabled={disabled}
    >
      {children}
    </button>
  );
}