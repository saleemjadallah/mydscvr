import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '../../utils/cn';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'pricing' | 'feature';
  isPopular?: boolean;
  hover?: boolean;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', isPopular, hover = true, children, ...props }, ref) => {
    const baseStyles = 'bg-white rounded-xl transition-all duration-300';

    const variants = {
      default: 'p-6 border border-gray-200 shadow-sm',
      pricing: 'p-8 border-2 border-gray-200',
      feature: 'p-8 border border-gray-200',
    };

    const hoverStyles = hover
      ? 'hover:shadow-xl hover:-translate-y-1 hover:border-primary-300'
      : '';

    const popularStyles = isPopular
      ? 'border-2 border-transparent bg-clip-padding relative before:absolute before:inset-0 before:-z-10 before:rounded-xl before:bg-gradient-to-br before:from-primary-500 before:to-secondary-600 before:p-[2px]'
      : '';

    return (
      <div
        ref={ref}
        className={cn(baseStyles, variants[variant], hoverStyles, popularStyles, className)}
        {...props}
      >
        {isPopular && (
          <div className="absolute -top-4 left-1/2 -translate-x-1/2">
            <div className="bg-gradient-to-r from-secondary-500 to-secondary-700 text-white px-6 py-2 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg">
              Most Popular
            </div>
          </div>
        )}
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

export default Card;
