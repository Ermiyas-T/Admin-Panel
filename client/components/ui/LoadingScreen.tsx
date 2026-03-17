'use client';

interface LoadingScreenProps {
  label: string;
  message: string;
  detail?: string;
}

export function LoadingScreen({
  label,
  message,
  detail = 'Please wait while we prepare your workspace.',
}: LoadingScreenProps) {
  return (
    <div className="min-h-screen">
      <div className="app-shell flex min-h-screen items-center justify-center">
        <div className="app-panel max-w-xl p-8 text-center sm:p-10">
          <span className="app-kicker">{label}</span>
          <h1 className="mt-5 text-3xl font-semibold tracking-[-0.05em] text-slate-950 sm:text-4xl">
            {message}
          </h1>
          <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-slate-600 sm:text-base">
            {detail}
          </p>
          <div className="mt-8 flex items-center justify-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-teal-700/90 animate-pulse" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400/90 animate-pulse [animation-delay:150ms]" />
            <span className="h-2.5 w-2.5 rounded-full bg-slate-900/70 animate-pulse [animation-delay:300ms]" />
          </div>
        </div>
      </div>
    </div>
  );
}
