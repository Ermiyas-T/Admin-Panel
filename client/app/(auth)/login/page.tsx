'use client';

import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { AxiosError } from 'axios';
import { useAuth } from '@/lib/auth/AuthContext';

interface LoginForm {
  email: string;
  password: string;
}

export default function LoginPage() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>();
  const { login } = useAuth();
  const [error, setError] = useState('');

  const onSubmit = async (data: LoginForm) => {
    try {
      setError('');
      await login(data.email, data.password);
    } catch (err) {
      const axiosErr = err as AxiosError<{ message?: string }>;
      setError(axiosErr.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="app-panel hidden overflow-hidden p-10 lg:flex lg:flex-col lg:justify-between">
          <div>
            <span className="app-kicker">Admin Access</span>
            <h1 className="mt-6 max-w-xl text-5xl font-semibold tracking-[-0.07em] text-slate-950">
              Permission-aware operations with a calmer, clearer interface.
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-slate-600">
              Sign in to manage users, roles, and permissions without changing how the
              app works. This refresh keeps the existing flows intact and simply makes
              the workspace easier to scan.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="app-panel-soft p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                Users
              </p>
              <p className="mt-3 text-sm leading-6 text-slate-700">
                View accounts and manage role assignments with clearer action states.
              </p>
            </div>
            <div className="app-panel-soft p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                Roles
              </p>
              <p className="mt-3 text-sm leading-6 text-slate-700">
                Edit role details and inspect capabilities in a more readable layout.
              </p>
            </div>
            <div className="app-panel-soft p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                Policy
              </p>
              <p className="mt-3 text-sm leading-6 text-slate-700">
                Keep permission controls visible and approachable across the app.
              </p>
            </div>
          </div>
        </section>

        <section className="app-panel flex items-center p-8 sm:p-10">
          <div className="mx-auto w-full max-w-md">
            <span className="app-kicker">Secure Sign In</span>
            <h2 className="mt-6 text-4xl font-semibold tracking-[-0.06em] text-slate-950">
              Welcome back
            </h2>
            <p className="mt-4 text-sm leading-6 text-slate-600">
              Use your existing account to continue into the admin workspace.
            </p>

            {error ? <div className="app-banner-error mt-6">{error}</div> : null}

            <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
              <div>
                <label htmlFor="email" className="app-label">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  {...register('email', { required: 'Email is required' })}
                  className="app-input"
                  placeholder="you@example.com"
                />
                {errors.email ? (
                  <p className="mt-2 text-sm font-medium text-red-600">
                    {errors.email.message}
                  </p>
                ) : null}
              </div>

              <div>
                <label htmlFor="password" className="app-label">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  {...register('password', { required: 'Password is required' })}
                  className="app-input"
                  placeholder="Enter your password"
                />
                {errors.password ? (
                  <p className="mt-2 text-sm font-medium text-red-600">
                    {errors.password.message}
                  </p>
                ) : null}
              </div>

              <button type="submit" className="app-button w-full">
                Sign In
              </button>
            </form>

            <div className="mt-8 rounded-[22px] bg-slate-950 px-5 py-4 text-sm text-white/80">
              Authorization is still enforced exactly the same way through CASL and the
              existing backend flows.
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
