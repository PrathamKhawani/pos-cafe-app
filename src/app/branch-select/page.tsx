'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

interface Branch {
  id: string;
  name: string;
  type: 'SEATING' | 'TAKEAWAY' | 'MIXED';
  imageUrl?: string;
}

export default function BranchSelectPage() {
  const router = useRouter();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string>('admin');

   useEffect(() => {
     async function loadData() {
       try {
         const [branchRes, meRes] = await Promise.all([
           fetch('/api/branches'),
           fetch('/api/auth/me')
         ]);
         
         if (branchRes.ok) {
           const data = await branchRes.json();
           if (Array.isArray(data)) setBranches(data);
         }
         
         if (meRes.ok) {
           const userData = await meRes.json();
           const roleMap: Record<string, string> = {
             'ADMIN': 'admin',
             'CASHIER': 'staff',
             'KITCHEN': 'kitchen'
           };
           setUserRole(roleMap[userData.role] || 'admin');
         }
       } catch (err) {
         toast.error('Failed to load initial data');
       } finally {
         setLoading(false);
       }
     }
     loadData();
   }, []);

  const handleSelect = async (branch: Branch) => {
    setSelecting(branch.id);
    document.cookie = `branch-id=${branch.id}; path=/; max-age=${60 * 60 * 24 * 7}`;
    
    toast.success('Location active');
    setTimeout(() => {
      router.push(`/${userRole}`);
    }, 500);
  };

  return (
    <div className="min-h-screen bg-[#F5F3EF] flex flex-col items-center justify-center p-6 animate-fade-in font-sans">
      <div className="w-full max-w-5xl">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl mb-5 shadow-sm border border-neutral-200 text-3xl">
            🏬
          </div>
          <h1 className="text-4xl font-bold text-neutral-800 tracking-tight mb-2">Select Location</h1>
          <p className="text-sm font-semibold text-neutral-500 uppercase tracking-widest">Initialize Point of Sale System</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {branches.map((branch) => (
              <button
                key={branch.id}
                onClick={() => handleSelect(branch)}
                disabled={selecting !== null}
                className={`group card relative min-h-[260px] p-6 text-left overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${
                  selecting === branch.id ? 'ring-2 ring-primary-500 shadow-md scale-[0.98]' : 'hover:border-primary-300'
                }`}
              >
                {branch.imageUrl && (
                  <>
                    <img src={branch.imageUrl} alt={branch.name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-10" />
                    <div className="absolute inset-0 bg-white/70" />
                  </>
                )}
                
                <div className="relative z-10 h-full flex flex-col">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl bg-white shadow-sm border border-neutral-100">
                      {branch.type === 'SEATING' ? '🪑' : branch.type === 'TAKEAWAY' ? '🛍️' : '🏪'}
                    </div>
                    <div className="px-3 py-1 bg-white rounded-lg text-[10px] font-bold tracking-widest text-neutral-500 uppercase shadow-sm border border-neutral-100">
                      {branch.type}
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-bold text-neutral-800 tracking-tight leading-tight mb-1 group-hover:text-primary-700 transition-colors">
                    {branch.name}
                  </h3>
                  <p className="text-xs font-semibold text-neutral-500 mt-auto pt-4">
                    {branch.type === 'SEATING' ? 'Dine-In Operations' : 'Express Checkout'}
                  </p>
                </div>
                
                {selecting === branch.id && (
                  <div className="absolute inset-0 bg-primary-900/10 backdrop-blur-[2px] z-20 flex items-center justify-center">
                    <div className="w-8 h-8 border-4 border-white border-t-primary-500 rounded-full animate-spin shadow-lg" />
                  </div>
                )}
              </button>
            ))}

            {branches.length === 0 && (
              <div className="col-span-full py-16 text-center border-2 border-dashed border-neutral-300 rounded-3xl bg-neutral-50">
                <p className="text-sm font-semibold text-neutral-500 mb-4">No locations configured</p>
                 <button 
                  onClick={() => router.push(`/${userRole}/branches`)}
                  className="btn-primary py-2 px-6 shadow-sm"
                >
                  Setup Locations
                </button>
              </div>
            )}
          </div>
        )}
        
         <div className="mt-12 text-center text-sm">
            <button onClick={() => router.push(`/${userRole}`)} className="font-semibold text-neutral-400 hover:text-neutral-700 hover:underline transition-colors">
              Return to Dashboard ➜
            </button>
         </div>
      </div>
    </div>
  );
}
