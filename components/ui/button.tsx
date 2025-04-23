'use client';

import * as React from 'react';
import Link from 'next/link';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all duration-150 ease-out disabled:pointer-events-none disabled:opacity-50 active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 shadow-sm whitespace-nowrap',
  {
    variants: {
      variant: {
        default:
          'bg-[var(--dark-shade)] text-white hover:bg-white hover:text-[var(--dark-shade)] hover:border-[var(--dark-shade)] border border-transparent',
        secondary: `
          bg-white text-[var(--dark-shade)] border border-[var(--dark-shade)] 
          hover:bg-[var(--dark-shade)] hover:text-white 
          active:bg-[var(--dark-shade)] active:text-white 
          border-[0.8px]
        `,
        ghost:
          'bg-transparent text-[var(--dark-shade)] hover:bg-[var(--dark-shade)]/10',
        destructive:
          'bg-red-600 text-white hover:bg-red-700',
        outline:
          'bg-transparent border border-gray-300 text-gray-800 hover:bg-gray-100',
        link: 'text-[var(--dark-shade)] underline-offset-4 hover:underline',
        whatsapp: `
          bg-white text-[var(--dark-shade)] border border-[var(--dark-shade)]  
          hover:bg-[#1EBE5D] hover:text-white 
          active:bg-[#1EBE5D] active:text-white 
          active:border-transparent focus-visible:ring-[#25D366]/50
        `,
      },
      size: {
        sm: 'px-4 py-2 text-sm',
        default: 'px-6 py-2.5 text-sm sm:text-base',
        lg: 'px-8 py-3 text-base',
        icon: 'p-2',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

type ButtonBaseProps = {
  asChild?: boolean;
  external?: boolean;
  href?: string;
} & VariantProps<typeof buttonVariants>;

type ButtonProps =
  | (React.ButtonHTMLAttributes<HTMLButtonElement> & ButtonBaseProps)
  | (React.AnchorHTMLAttributes<HTMLAnchorElement> & ButtonBaseProps);

const Button = React.forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>(
  ({ className, variant, size, asChild = false, href, external, ...props }, ref) => {
    const classes = cn(buttonVariants({ variant, size }), className);

    // External <a> (WhatsApp or any full link)
    if (href && external) {
      return (
        <a
          ref={ref as React.Ref<HTMLAnchorElement>}
          href={href}
          className={classes}
          target="_blank"
          rel="noopener noreferrer"
          {...(props as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
        />
      );
    }

    // Internal <Link>
    if (href) {
      return (
        <Link href={href} className={classes}>
          {props.children}
        </Link>
      );
    }

    // Button or <Slot>
    const Comp = asChild ? Slot : 'button';

    return (
      <Comp
        ref={ref as React.Ref<HTMLButtonElement>}
        className={classes}
        {...(props as React.ButtonHTMLAttributes<HTMLButtonElement>)}
      />
    );
  }
);

Button.displayName = 'Button';

export { Button, buttonVariants };