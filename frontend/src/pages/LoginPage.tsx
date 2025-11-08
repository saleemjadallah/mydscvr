import { useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { User } from '@/types';
import { Button, Input, Card } from '../components/ui';
import { ArrowRight } from 'lucide-react';

interface LoginPageProps {
  onLogin: (user: User) => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Check for test account
      if (email === 'test@headshotsaas.com' && password === 'password123') {
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Test user with realistic data
        onLogin({
          id: 'test-user-1',
          email: 'test@headshotsaas.com',
          name: 'Test User',
          uploads_used: 3,
          batches_created: 3,
          totalHeadshots: 300,
          createdAt: new Date(),
        });
      } else {
        // For demo purposes, accept any email/password
        await new Promise(resolve => setTimeout(resolve, 1000));

        onLogin({
          id: '1',
          email,
          name: email.split('@')[0],
          uploads_used: 0,
          batches_created: 0,
          createdAt: new Date(),
        });
      }
    } catch (err) {
      setError('Invalid email or password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Test Account Banner */}
        <div className="mb-6 p-4 bg-gradient-to-r from-secondary-50 to-primary-50 border-2 border-secondary-300 rounded-xl">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-secondary-500 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-lg">🧪</span>
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mb-1">Test Account</h3>
              <p className="text-sm text-gray-600 mb-2">Use these credentials to explore the app:</p>
              <div className="bg-white/70 rounded-lg p-3 font-mono text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-600">Email:</span>
                  <span className="font-semibold text-gray-900">test@headshotsaas.com</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Password:</span>
                  <span className="font-semibold text-gray-900">password123</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEmail('test@headshotsaas.com');
                  setPassword('password123');
                }}
                className="mt-2 w-full py-2 px-4 bg-secondary-600 hover:bg-secondary-700 text-white text-sm font-semibold rounded-lg transition-colors"
              >
                Auto-fill Test Credentials
              </button>
            </div>
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Welcome Back</h1>
          <p className="text-lg text-gray-600">Sign in to access your headshots</p>
        </div>

        {/* Login Card */}
        <Card variant="default" hover={false} className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Email Input */}
            <div>
              <Input
                type="email"
                label="Email Address"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                error={!!error}
              />
            </div>

            {/* Password Input */}
            <div>
              <Input
                type="password"
                label="Password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                error={!!error}
              />
            </div>

            {/* Forgot Password */}
            <div className="flex justify-end">
              <Link
                to="/forgot-password"
                className="text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              isLoading={isLoading}
            >
              {!isLoading && (
                <>
                  Sign In
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </Button>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>

            {/* Social Login Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 transition-all duration-200 font-medium text-gray-700"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Google
              </button>
              <button
                type="button"
                className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 transition-all duration-200 font-medium text-gray-700"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
                </svg>
                GitHub
              </button>
            </div>
          </form>
        </Card>

        {/* Sign Up Link */}
        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Don't have an account?{' '}
            <Link
              to="/register"
              className="font-semibold text-primary-600 hover:text-primary-700 transition-colors"
            >
              Create one now
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
