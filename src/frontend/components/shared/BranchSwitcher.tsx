'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Branch {
  id: string;
  name: string;
  type: string;
}

export default function BranchSwitcher() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const router = useRouter();

  useEffect(() => {
    // Get current branch from cookie
    const cookies = document.cookie.split('; ');
    const branchCookie = cookies.find(c => c.startsWith('branch-id='));
    if (branchCookie) {
      setSelectedId(branchCookie.split('=')[1]);
    }

    // Load all branches
    async function loadBranches() {
      try {
        const res = await fetch('/api/branches');
        const data = await res.json();
        if (Array.isArray(data)) {
          setBranches(data);
        }
      } catch (err) {
        console.error('Failed to load branches', err);
      }
    }
    loadBranches();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedId(id);
    if (id) {
      document.cookie = `branch-id=${id}; path=/; max-age=${60 * 60 * 24 * 7}`;
      // Refresh to update all components that depend on branch-id
      window.location.reload();
    }
  };

  return (
    <div className="px-3 py-4 border-b border-white/10">
      <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest block mb-2 px-1">Active Location</label>
      <div className="relative group">
        <select 
          value={selectedId} 
          onChange={handleChange}
          className="w-full bg-white/5 border border-white/10 rounded-lg py-2 pl-3 pr-8 text-xs font-semibold text-white/80 appearance-none hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary-500/50"
        >
          <option value="" className="bg-[#1C0F08]">Select Branch</option>
          {branches.map(branch => (
            <option key={branch.id} value={branch.id} className="bg-[#1C0F08]">
              {branch.name}
            </option>
          ))}
        </select>
        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-white/40">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </div>
  );
}
