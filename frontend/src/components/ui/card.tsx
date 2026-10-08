import type { ComponentProps } from 'react';
import { cn } from '../../lib/utils';

export function Card({ className, ...props }: ComponentProps<'section'>) {
  return <section data-slot="card" className={cn('card', className)} {...props} />;
}
