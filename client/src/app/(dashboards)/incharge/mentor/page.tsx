'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import FacultyMentorPage from '@/app/(dashboards)/faculty/mentor/page';

export default function InchargeMentorPage() {
  return (
    <ProtectedRoute allowedRoles={['class_incharge']}>
      <FacultyMentorPage />
    </ProtectedRoute>
  );
}
