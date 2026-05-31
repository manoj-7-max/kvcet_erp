'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';

export default function ProtectedRoute({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles: string[];
}) {
  const { user, token, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!token || !user) {
        // Not logged in → go to login
        router.replace('/');
      } else if (!allowedRoles.includes(user.role)) {
        // Wrong role → redirect to correct dashboard
        if (user.role === 'hod') router.replace('/hod');
        else if (user.role === 'class_incharge') router.replace('/incharge-dashboard');
        else if (user.role === 'faculty') router.replace('/faculty');
        else router.replace('/student');
      }
    }
  }, [user, token, loading, router, allowedRoles]);

  // Show spinner only while auth state is loading
  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-neutral-950">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  // Not authorized → render nothing (redirect is in progress)
  if (!token || !user || !allowedRoles.includes(user.role)) {
    return null;
  }

  return <>{children}</>;
}
