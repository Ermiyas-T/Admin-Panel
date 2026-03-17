'use client';

import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { AxiosError } from 'axios';

// Form model used by react-hook-form for type-safe inputs and validation.
interface LoginForm {
  email: string;
  password: string;
}

export default function LoginPage() {
  // Hook-form manages input registration, submit handling, and validation errors.
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>();

  // AuthContext exposes the login() function that stores tokens + updates ability.
  const { login } = useAuth();

  // Local UI state to show a user-friendly error message.
  const [error, setError] = useState('');

  // Submit handler: calls backend login through our AuthContext.
  const onSubmit = async (data: LoginForm) => {
    try {
      // Clear any previous error before attempting a new login.
      setError('');

      // Login persists tokens/user/permissions and updates CASL ability in context.
      await login(data.email, data.password);
    } catch (err) {
      // Axios errors may include a backend-provided message in response.data.message.
      const axiosErr = err as AxiosError<{ message?: string }>;
      setError(axiosErr.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <h2 className="text-2xl font-bold text-center">Sign In</h2>

        {/* Show API/server error (invalid credentials, etc.) */}
        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded">{error}</div>
        )}

        {/* handleSubmit runs validation first, then calls onSubmit with the form data */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>

            {/* register wires the input into react-hook-form + provides validation rules */}
            <input
              id="email"
              type="email"
              {...register('email', { required: 'Email is required' })}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            />

            {/* Inline validation feedback */}
            {errors.email && (
              <p className="text-red-600 text-sm">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>

            {/* Password validation is handled by react-hook-form (required) */}
            <input
              id="password"
              type="password"
              {...register('password', { required: 'Password is required' })}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            />

            {/* Inline validation feedback */}
            {errors.password && (
              <p className="text-red-600 text-sm">{errors.password.message}</p>
            )}
          </div>

          {/* Submit button triggers handleSubmit -> onSubmit */}
          <button
            type="submit"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}

