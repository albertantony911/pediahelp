'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';

interface SecondaryButtonProps {
  href?: string;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

export default function SecondaryButton({
  href,
  onClick,
  children,
  className = '',
  disabled = false,
}: SecondaryButtonProps) {
  const baseStyles =
    'inline-flex items-center justify-center rounded-full font-semibold px-5 py-2.5 text-sm sm:text-base transition-all duration-150 ease-out';

  const enabledStyles =
    'border border-green-600 text-green-700 bg-white hover:bg-green-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-green-500';

  const disabledStyles =
    'border border-gray-300 text-gray-400 cursor-not-allowed';

  const buttonClasses = cn(baseStyles, disabled ? disabledStyles : enabledStyles, className);

  if (href && !disabled) {
    return <Link href={href} className={buttonClasses}>{children}</Link>;
  }

  return (
    <button type="button" onClick={onClick} className={buttonClasses} disabled={disabled}>
      {children}
    </button>
  );
}