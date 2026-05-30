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
  const { user, token, loading, selectedRole } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!token || !user) {
        router.push('/');
      } else if (!allowedRoles.includes(user.role)) {
        // Handle unauthorized role access
        if (user.role === 'hod') router.push('/hod');
        else if (user.role === 'faculty') router.push('/faculty');
        else if (user.role === 'class_incharge') router.push('/role-selection');
        else router.push('/student');
      } else if (allowedRoles.includes('class_incharge') && selectedRole !== 'class_incharge') {
        // If they are an incharge and didn't select incharge yet, maybe redirect back?
        // Simple fallback
      }
    }
  }, [user, token, loading, router, allowedRoles, selectedRole]);

  if (loading || !token || !user || !allowedRoles.includes(user.role)) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-neutral-950">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return <>{children}</>;
}
