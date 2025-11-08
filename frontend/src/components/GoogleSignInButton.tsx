import { useState } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import { api } from '../lib/api';
import { useNavigate } from 'react-router-dom';

interface GoogleSignInButtonProps {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  redirectTo?: string;
}

export function GoogleSignInButton({
  onSuccess,
  onError,
  redirectTo = '/dashboard',
}: GoogleSignInButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleGoogleSignIn = async () => {
    setIsLoading(true);

    try {
      // Sign in with Google via Firebase
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // Get Firebase ID token
      const idToken = await user.getIdToken();

      // Send token to backend for verification and session creation
      const response = await api.post('/auth/google', { idToken });

      console.log('[GoogleSignIn] Successfully authenticated:', response.data);

      // Call success callback
      if (onSuccess) {
        onSuccess();
      }

      // Redirect to dashboard or specified route
      navigate(redirectTo);
    } catch (error: any) {
      console.error('[GoogleSignIn] Error:', error);

      // Handle specific Firebase errors
      let errorMessage = 'Failed to sign in with Google';

      if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = 'Sign-in popup was closed';
      } else if (error.code === 'auth/cancelled-popup-request') {
        errorMessage = 'Sign-in was cancelled';
      } else if (error.code === 'auth/popup-blocked') {
        errorMessage = 'Sign-in popup was blocked by browser';
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }

      // Call error callback
      if (onError) {
        onError(new Error(errorMessage));
      } else {
        alert(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleGoogleSignIn}
      disabled={isLoading}
      className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      {isLoading ? (
        <>
          <svg
            className="animate-spin h-5 w-5 text-gray-600"
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
          <span>Signing in...</span>
        </>
      ) : (
        <>
          <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          <span className="font-medium">Continue with Google</span>
        </>
      )}
    </button>
  );
}
