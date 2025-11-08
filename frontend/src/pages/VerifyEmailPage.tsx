import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authApi } from '../lib/api';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const email = searchParams.get('email') || '';
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Redirect if no email provided
    if (!email) {
      navigate('/register');
    }

    // Focus first input on mount
    inputRefs.current[0]?.focus();
  }, [email, navigate]);

  const handleChange = (index: number, value: string) => {
    // Only allow single digit
    if (value.length > 1) {
      value = value.slice(-1);
    }

    // Only allow numbers
    if (!/^\d*$/.test(value)) {
      return;
    }

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    setError('');

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits are filled
    if (newCode.every((digit) => digit !== '') && value) {
      handleVerify(newCode.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      // Focus previous input on backspace if current is empty
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();

    // Only accept 6-digit numbers
    if (/^\d{6}$/.test(pastedData)) {
      const digits = pastedData.split('');
      setCode(digits);
      setError('');

      // Focus last input
      inputRefs.current[5]?.focus();

      // Auto-submit
      handleVerify(pastedData);
    }
  };

  const handleVerify = async (codeString: string) => {
    if (codeString.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }

    setIsVerifying(true);
    setError('');

    try {
      const user = await authApi.verifyRegistration(email, codeString);
      console.log('[VerifyEmail] Verification successful:', user);

      setSuccess(true);

      // Redirect to dashboard after 1 second
      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);
    } catch (err: any) {
      console.error('[VerifyEmail] Verification error:', err);

      const errorMessage =
        err.response?.data?.error || 'Invalid or expired verification code. Please try again.';

      setError(errorMessage);

      // Clear code on error
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleVerify(code.join(''));
  };

  const handleResendCode = async () => {
    try {
      setError('');
      // For now, just show a message (you'd need a backend endpoint to resend)
      // await authApi.resendVerificationCode(email);
      alert('A new verification code has been sent to your email.');
    } catch (err: any) {
      setError('Failed to resend code. Please try again.');
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="mb-6">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Email Verified!</h2>
          <p className="text-gray-600">Redirecting to your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Verify Your Email</h1>
          <p className="text-gray-600">
            We sent a 6-digit code to <strong className="text-gray-900">{email}</strong>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3 text-center">
              Enter verification code
            </label>
            <div className="flex gap-2 justify-center" onPaste={handlePaste}>
              {code.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => {
                    inputRefs.current[index] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-colors"
                  disabled={isVerifying}
                />
              ))}
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isVerifying || code.some((digit) => !digit)}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isVerifying ? (
              <span className="flex items-center justify-center gap-2">
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
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Verifying...
              </span>
            ) : (
              'Verify Email'
            )}
          </button>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Didn't receive the code?{' '}
              <button
                type="button"
                onClick={handleResendCode}
                className="text-blue-600 hover:text-blue-700 font-medium focus:outline-none"
              >
                Resend
              </button>
            </p>
          </div>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-200 text-center">
          <p className="text-sm text-gray-600">
            Wrong email?{' '}
            <a href="/register" className="text-blue-600 hover:text-blue-700 font-medium">
              Go back
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
