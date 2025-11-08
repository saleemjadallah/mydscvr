import { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '../../utils/cn';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  success?: boolean;
  label?: string;
  helperText?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, success, label, helperText, type = 'text', ...props }, ref) => {
    const baseStyles =
      'w-full px-4 py-3 border-2 rounded-lg text-base text-gray-700 bg-white transition-all duration-200 focus:outline-none focus:ring-3 focus:ring-primary-500/10 placeholder:text-gray-400';

    const stateStyles = error
      ? 'border-red-400 focus:border-red-500'
      : success
      ? 'border-accent focus:border-accent'
      : 'border-gray-300 focus:border-primary-500';

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            {label}
          </label>
        )}
        <input
          ref={ref}
          type={type}
          className={cn(baseStyles, stateStyles, className)}
          {...props}
        />
        {helperText && (
          <p
            className={cn(
              'mt-2 text-sm',
              error ? 'text-red-600' : success ? 'text-accent' : 'text-gray-500'
            )}
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
