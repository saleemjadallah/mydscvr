import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '../../utils/cn';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'popular' | 'ai' | 'success' | 'processing' | 'completed' | 'info';
  size?: 'sm' | 'md' | 'lg';
}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'info', size = 'md', children, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-semibold rounded-full transition-all duration-200';

    const variants = {
      popular: 'bg-gradient-to-r from-secondary-500 to-secondary-700 text-white shadow-lg shadow-secondary-500/30',
      ai: 'bg-gradient-to-r from-secondary-500 to-primary-600 text-white shadow-lg',
      success: 'bg-green-50 text-green-700 border border-green-200',
      processing: 'bg-amber-50 text-amber-700 border border-amber-200',
      completed: 'bg-green-50 text-green-700 border border-green-200',
      info: 'bg-primary-50 text-primary-700 border border-primary-200',
    };

    const sizes = {
      sm: 'px-2 py-1 text-xs',
      md: 'px-4 py-1.5 text-sm',
      lg: 'px-6 py-2 text-base',
    };

    return (
      <span
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

export default Badge;
