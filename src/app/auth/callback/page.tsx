import { Suspense } from 'react';
import AuthCallbackClient from './auth-callback-client';

function AuthCallbackFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <h2 className="text-2xl font-semibold">Verifying your login...</h2>
        <p className="text-muted-foreground mt-2">
          Please wait while we verify your magic link
        </p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<AuthCallbackFallback />}>
      <AuthCallbackClient />
    </Suspense>
  );
}