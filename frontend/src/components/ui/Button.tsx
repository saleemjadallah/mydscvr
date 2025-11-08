import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '../../utils/cn';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'success' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  asChild?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, disabled, asChild, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center gap-2 font-semibold rounded-lg transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none';

    const variants = {
      primary: 'bg-gradient-to-r from-primary-500 to-primary-700 text-white shadow-lg shadow-primary-500/30 hover:from-primary-600 hover:to-primary-800 hover:shadow-xl hover:shadow-primary-500/40 hover:-translate-y-0.5',
      secondary: 'bg-gradient-to-r from-secondary-500 to-secondary-700 text-white shadow-lg shadow-secondary-500/30 hover:from-secondary-600 hover:to-secondary-800 hover:shadow-xl hover:shadow-secondary-500/40 hover:-translate-y-0.5',
      outline: 'bg-transparent border-2 border-primary-500 text-primary-600 hover:bg-primary-50 hover:border-primary-700 hover:text-primary-700',
      success: 'bg-accent text-white shadow-lg shadow-accent/30 hover:bg-accent/90 hover:shadow-xl hover:shadow-accent/40 hover:-translate-y-0.5',
      ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 hover:text-gray-900',
    };

    const sizes = {
      sm: 'px-4 py-2 text-sm',
      md: 'px-6 py-3 text-base',
      lg: 'px-8 py-4 text-lg',
    };

    const classes = cn(
      baseStyles,
      variants[variant],
      sizes[size],
      isLoading && 'opacity-70 cursor-wait',
      className
    );

    // If asChild is true, clone the child element and apply classes to it
    if (asChild && children) {
      const child = children as any;
      if (child.type) {
        const childProps = {
          ...child.props,
          className: cn(classes, child.props?.className),
        };
        return <child.type {...childProps} />;
      }
    }

    return (
      <button
        ref={ref}
        className={classes}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <svg
              className="animate-spin h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Loading...
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
