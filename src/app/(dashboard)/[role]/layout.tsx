import Sidebar from '@/frontend/components/Sidebar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 min-w-0 lg:ml-0 mt-12 lg:mt-0 overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}
