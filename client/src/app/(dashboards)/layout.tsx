'use client';

import Sidebar from '@/components/Sidebar';
import DashboardHeader from '@/components/DashboardHeader';
import MeshGradient from '@/components/MeshGradient';
import ERPAssistant from '@/components/ERPAssistant';
import AnimatedPage from '@/components/AnimatedPage';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-neutral-950 relative">
      <MeshGradient />
      
      <div className="z-10 flex w-full h-full">
        <Sidebar />
        
        <div className="flex-1 flex flex-col h-full overflow-hidden relative">
          <DashboardHeader />
          
          <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
            <AnimatedPage className="h-full">
              {children}
            </AnimatedPage>
          </main>
        </div>
      </div>
      
      <ERPAssistant />
    </div>
  );
}
