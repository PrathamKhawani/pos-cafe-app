'use client';
import { useState, useCallback, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useCartStore } from '@/stores/useCartStore';
import useSWR, { mutate } from 'swr';
import { useSocket } from '@/hooks/useSocket';

const fetcher = (url: string) => fetch(url, { cache: 'no-store' }).then(res => res.json());

interface Table {
  id: string; number: string; seats: number; isActive: boolean; imageUrl?: string;
  floor: { name: string };
  orders?: Array<{ status: string }>;
}
interface Floor { id: string; name: string; tables: Table[]; }
interface Branch { id: string; name: string; type: string; }

export default function FloorPage() {
  const router = useRouter();
  const params = useParams();
  const role = params.role as string;
  const [selectedFloor, setSelectedFloor] = useState<string | null>(null);
  const { setTable } = useCartStore();

  // Optimized Fetching with SWR
  const { data: floorsData } = useSWR<Floor[]>('/api/floors', fetcher);
  const { data: ordersResponse } = useSWR('/api/orders?status=SENT', fetcher);
  const { data: branchesData } = useSWR<Branch[]>('/api/branches', fetcher);

  // Real-time synchronization
  const onSocketEvent = useCallback((event: string) => {
    if (['NEW_ORDER', 'PAYMENT_DONE', 'UPDATE_ORDER_STATUS'].includes(event)) {
      mutate('/api/orders?status=SENT');
      mutate('/api/floors');
    }
  }, []);

  useSocket(onSocketEvent);

  // Computed data
  const floors = useMemo(() => Array.isArray(floorsData) ? floorsData : [], [floorsData]);
  
  const activeOrdersMap = useMemo(() => {
    const map: Record<string, boolean> = {};
    const orders = ordersResponse?.orders; // Handling the new paginated structure
    if (Array.isArray(orders)) {
      orders.forEach((o: { tableId: string }) => { if (o.tableId) map[o.tableId] = true; });
    }
    return map;
  }, [ordersResponse]);

  // Handle Initial Floor Selection
  if (floors.length > 0 && !selectedFloor) {
    setSelectedFloor(floors[0].id);
  }

  // Branch Redirection
  useMemo(() => {
    const branchId = typeof document !== 'undefined' ? document.cookie.split('; ').find(row => row.startsWith('branch-id='))?.split('=')[1] : null;
    if (branchId && Array.isArray(branchesData)) {
      const b = branchesData.find((b: any) => b.id === branchId);
      if (b?.type === 'TAKEAWAY') { router.push(`/${role}/pos/takeaway`); }
    }
  }, [branchesData, router, role]);

  const currentFloor = useMemo(() => floors.find(f => f.id === selectedFloor), [floors, selectedFloor]);

  function selectTable(table: Table) {
    setTable(table.id);
    router.push(`/${role}/pos/order/${table.id}`);
  }

  return (
    <div className="p-6 md:p-8 max-w-[1600px] mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.push(`/${role}/pos/order/takeaway`)}
            className="flex items-center gap-2 px-6 py-3 bg-amber-600 text-white rounded-xl font-bold shadow-lg shadow-amber-600/20 hover:bg-amber-700 transition-all active:scale-95 whitespace-nowrap"
          >
            <span className="text-xl">🥡</span>
            Takeaway Order
          </button>
          <div>
            <h1 className="text-3xl font-bold text-neutral-800 tracking-tight mb-1">Select Table</h1>
            <p className="text-sm font-medium text-neutral-500">Choose an available table to begin a new ticket.</p>
          </div>
        </div>
        
        {/* Floor Selection */}
        <div className="flex p-1 bg-white border border-neutral-200 rounded-lg shadow-sm">
          {floors.map(f => (
            <button key={f.id} onClick={() => setSelectedFloor(f.id)}
              className={`px-5 py-2 rounded-md text-sm font-semibold transition-colors ${selectedFloor === f.id ? 'bg-primary-50 text-primary-700' : 'text-neutral-500 hover:bg-neutral-50 hover:text-neutral-700'}`}>
              {f.name}
            </button>
          ))}
          {floors.length === 0 && <span className="px-4 py-2 text-neutral-400 text-sm font-semibold">No Floors Available</span>}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full border-2 border-neutral-300 bg-white" /><span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Available</span></div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.6)]" /><span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Occupied</span></div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-neutral-200" /><span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Closed</span></div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {currentFloor?.tables.map((table) => {
          const occupied = activeOrdersMap[table.id];
          return (
            <button key={table.id} onClick={() => table.isActive && selectTable(table)} disabled={!table.isActive}
              className={`relative h-[160px] rounded-2xl border flex flex-col items-center justify-center p-4 transition-all ${
                !table.isActive ? 'bg-neutral-100 border-neutral-200 opacity-60 cursor-not-allowed' :
                occupied ? 'bg-blue-50 border-blue-200 hover:border-blue-300 shadow-sm' :
                'bg-white border-neutral-200 hover:border-primary-300 hover:shadow-md'
              }`}>
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl mb-3 shadow-sm ${occupied ? 'bg-blue-100 text-blue-600' : 'bg-neutral-50 text-neutral-400'}`}>
                {occupied ? '🍽️' : '🪑'}
              </div>
              {occupied && <div className="absolute top-4 right-4 w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse shadow-sm" />}
              
              <div className="text-center">
                <div className={`font-bold text-lg leading-none ${occupied ? 'text-blue-800' : 'text-neutral-800'}`}>{table.number}</div>
                <div className={`text-xs mt-1 font-medium ${occupied ? 'text-blue-500' : 'text-neutral-400'}`}>{table.seats} Seats</div>
              </div>
            </button>
          );
        })}
        
        {currentFloor?.tables.length === 0 && (
           <div className="col-span-full py-20 flex flex-col items-center justify-center border-2 border-dashed border-neutral-200 rounded-2xl">
             <div className="text-4xl mb-4 text-neutral-300">🪑</div>
             <p className="text-sm font-semibold text-neutral-500">No tables on this floor</p>
           </div>
        )}
      </div>
    </div>
  );
}
