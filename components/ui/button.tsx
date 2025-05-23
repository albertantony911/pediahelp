'use client';

import * as React from 'react';
import Link from 'next/link';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-3xl font-medium cursor-pointer transform transition-transform duration-150 ease-out hover:scale-[1.1] active:scale-[0.95] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap',
  {
    variants: {
      variant: {
        default:
          'bg-[var(--dark-shade)] text-white border border-transparent hover:brightness-110',
        secondary:
          'bg-[var(--mid-shade)] text-white border border-transparent hover:brightness-110',
        ghost:
          'bg-transparent text-white border border-white hover:brightness-110',
        outline:
          'bg-transparent text-[var(--dark-shade)] border border-[var(--mid-shade)] hover:brightness-110',
        destructive:
          'bg-red-500 text-white hover:bg-red-600',
        link:
          'text-[var(--dark-shade)] underline-offset-4 hover:underline',
        whatsapp:
          'bg-white text-[var(--mid-shade)] border border-[var(--mid-shade)] hover:bg-[#1EBE5D] hover:text-white focus-visible:ring-[#25D366]/50',
      },
      size: {
        sm: 'px-5 py-2 text-sm',
        default: 'px-6 py-3 text-sm sm:text-base',
        lg: 'px-7 py-3.5 text-base',
        icon: 'p-2.5',
      },
      fullWidth: {
        true: 'w-full',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
      fullWidth: false,
    },
  }
);

type ButtonBaseProps = {
  asChild?: boolean;
  external?: boolean;
  href?: string;
  fullWidth?: boolean;
} & VariantProps<typeof buttonVariants>;

type ButtonProps =
  | (React.ButtonHTMLAttributes<HTMLButtonElement> & ButtonBaseProps)
  | (React.AnchorHTMLAttributes<HTMLAnchorElement> & ButtonBaseProps);

export const Button = React.forwardRef<
  HTMLButtonElement | HTMLAnchorElement,
  ButtonProps
>(
  (
    {
      className,
      variant,
      size,
      fullWidth,
      asChild = false,
      href,
      external,
      children,
      ...props
    },
    ref
  ) => {
    const classes = cn(buttonVariants({ variant, size, fullWidth }), className);

    const Comp = asChild ? Slot : 'button';

    // External <a>
    if (href && external) {
      return (
        <a
          ref={ref as React.Ref<HTMLAnchorElement>}
          href={href}
          className={classes}
          target="_blank"
          rel="noopener noreferrer"
          {...(props as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
        >
          {children}
        </a>
      );
    }

    // Internal <Link>
    if (href && !asChild) {
      return (
        <Link href={href} className={classes}>
          {children}
        </Link>
      );
    }

    // Button or Slot
    return (
      <Comp
        ref={ref as React.Ref<HTMLButtonElement>}
        className={classes}
        {...(props as React.ButtonHTMLAttributes<HTMLButtonElement>)}
      >
        {children}
      </Comp>
    );
  }
);

Button.displayName = 'Button';

export { buttonVariants };