import type { ComponentProps } from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';
import type { VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

// Cấu trúc shadcn/Radix; dùng màu và kích thước của thiết kế QForge.
const variants = cva('button', {
  variants: { variant: { default: '', secondary: 'secondary', destructive: 'danger' }, size: { default: '', sm: 'small', full: 'full' } },
  defaultVariants: { variant: 'default', size: 'default' },
});
export function Button({ className, variant, size, asChild = false, type, ...props }: ComponentProps<'button'> & VariantProps<typeof variants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : 'button';
  return <Comp data-slot="button" className={cn(variants({ variant, size }), className)} {...(!asChild ? { type: type ?? 'button' } : {})} {...props} />;
}
