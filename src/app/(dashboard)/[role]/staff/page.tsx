'use client';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { io, Socket } from 'socket.io-client';
import { useRef } from 'react';

interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  role: 'ADMIN' | 'CASHIER' | 'KITCHEN';
  isApproved: boolean;
  createdAt: string;
}

export default function StaffManagementPage() {
  const [staff, setStaff] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    fetchStaff();
    
    // Initialize real-time connection
    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001');
    socketRef.current = socket;
    
    socket.on('STAFF_REGISTERED', () => {
      toast('New staff just registered!', { icon: '🔔' });
      fetchStaff();
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  async function fetchStaff() {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/staff', { 
        cache: 'no-store',
        credentials: 'include'
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || `Error ${res.status}`);
      }

      if (Array.isArray(data)) {
        setStaff(data);
      } else {
        throw new Error('Invalid data format received');
      }
    } catch (err: any) {
      setError(err.message);
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(id: string) {
    try {
      const res = await fetch(`/api/staff/${id}/approve`, { method: 'PUT' });
      if (!res.ok) throw new Error('Update failed');
      toast.success('Access Granted to user');
      fetchStaff(); // Refresh list
      
      if (socketRef.current) {
        socketRef.current.emit('STAFF_APPROVED');
      }
    } catch {
      toast.error('Could not approve staff account');
    }
  }

  async function handleRoleChange(id: string, newRole: 'ADMIN' | 'CASHIER' | 'KITCHEN') {
    const roleLabels = {
      'ADMIN': 'Administrator',
      'CASHIER': 'Cashier',
      'KITCHEN': 'Kitchen Staff'
    };

    if (!confirm(`Switch this user to ${roleLabels[newRole]} role?`)) return;

    try {
      const res = await fetch(`/api/staff/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole })
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Update failed');
      }
      
      toast.success(`User is now ${roleLabels[newRole]}`);
      fetchStaff(); // Refresh list
    } catch (err: any) {
      toast.error(err.message || 'Could not update user role');
    }
  }

  async function handleReject(id: string, name: string) {
    if (!confirm(`Reject registration for ${name}? This will permanently remove their account.`)) return;

    try {
      const res = await fetch(`/api/staff/${id}/reject`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Reject failed');
      }
      toast.success('Registration rejected and removed');
      fetchStaff(); // Refresh list
    } catch (err: any) {
      toast.error(err.message || 'Could not reject registration');
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Are you sure you want to revoke access for ${name}? They will no longer be able to log in and will see the 'Pending Approval' message.`)) return;
    
    try {
      const res = await fetch(`/api/staff/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Revoke failed');
      toast.success('Access revoked successfully');
      fetchStaff(); // Refresh list
    } catch {
      toast.error('Could not revoke staff access');
    }
  }

  return (
    <div className="page-content py-5 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title text-2xl">Staff Management</h1>
          <p className="page-subtitle">Approve and manage system access for system users</p>
        </div>
        <button onClick={fetchStaff} className="btn-secondary h-10 px-6 text-sm font-semibold shadow-sm">
          ↻ Refresh List
        </button>
      </div>

      <div className="card shadow-sm border border-neutral-200 rounded-xl overflow-hidden mt-6">
        <div className="overflow-x-auto">
          <table className="data-table w-full">
            <thead className="bg-neutral-50/80 border-b border-neutral-200">
              <tr>
                <th className="px-6 py-4 text-left whitespace-nowrap text-xs font-bold uppercase tracking-wider text-neutral-500">Registration Date</th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-neutral-500">Employee Details</th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-neutral-500">Role</th>
                <th className="px-6 py-4 text-left whitespace-nowrap text-xs font-bold uppercase tracking-wider text-neutral-500">Access Status</th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-neutral-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-24 text-center">
                    <div className="flex flex-col items-center gap-3">
                       <div className="w-8 h-8 border-3 border-neutral-200 border-t-primary-600 rounded-full animate-spin" />
                       <span className="text-sm font-semibold text-neutral-500">Retrieving records...</span>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={5} className="py-24 text-center">
                    <div className="flex flex-col items-center gap-4">
                       <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center text-2xl">⚠️</div>
                       <div>
                         <div className="text-base font-bold text-neutral-800">Connection Failed</div>
                         <div className="text-sm text-neutral-500 mt-1 max-w-xs mx-auto">{error}</div>
                       </div>
                       <button onClick={fetchStaff} className="btn-primary py-2 px-8 text-sm mt-2">Retry Now</button>
                    </div>
                  </td>
                </tr>
              ) : staff.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-24 text-center">
                    <div className="flex flex-col items-center gap-4 text-neutral-400">
                      <div className="w-16 h-16 bg-neutral-50 rounded-full flex items-center justify-center text-3xl border border-neutral-100">👥</div>
                      <div>
                        <p className="text-base font-bold text-neutral-700">No staff found</p>
                        <p className="text-sm">Pending registrations will appear here for approval.</p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                staff.map((user) => (
                  <tr key={user.id} className="hover:bg-neutral-50/50 transition-colors group">
                    <td className="px-6 py-5 whitespace-nowrap text-sm font-medium text-neutral-500">
                      {new Date(user.createdAt).toLocaleDateString(undefined, { year:'numeric', month:'short', day:'numeric' })}
                    </td>
                    <td className="px-6 py-5">
                      <div className="font-bold text-neutral-800 text-base">{user.name}</div>
                      <div className="text-xs text-neutral-500 font-medium">{user.email}</div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      {user.role === 'ADMIN' ? (
                        <span className="badge badge-purple !px-3 !py-1 text-[10px]">System Administrator</span>
                      ) : (
                        <span className={`badge ${user.role === 'CASHIER' ? 'badge-brown' : 'badge-gray'} !px-3 !py-1 text-[10px]`}>
                          {user.role === 'CASHIER' ? 'Front Desk / Cashier' : 'Kitchen Display'}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      {user.isApproved ? (
                        <span className="badge badge-green !px-3 !py-1 text-[10px]">✓ Active</span>
                      ) : (
                        <span className="badge badge-yellow animate-pulse !px-3 !py-1 text-[10px]">Pending Approval</span>
                      )}
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        {!user.isApproved ? (
                          <>
                            <button 
                              onClick={() => handleApprove(user.id)}
                              className="btn-primary text-[10px] !py-2 px-5 shadow-sm uppercase tracking-wider"
                            >
                              Approve
                            </button>
                            <button 
                              onClick={() => handleReject(user.id, user.name)}
                              className="px-5 py-2 text-[10px] font-bold text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-red-100 uppercase tracking-wider"
                            >
                              Reject
                            </button>
                          </>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                             {user.role === 'ADMIN' ? (
                                <>
                                  <button 
                                    onClick={() => handleRoleChange(user.id, 'CASHIER')}
                                    className="px-4 py-2 text-[10px] font-bold text-neutral-600 hover:bg-neutral-50 rounded-lg transition-all border border-neutral-100 uppercase tracking-wider"
                                  >
                                    Make Cashier
                                  </button>
                                  <button 
                                    onClick={() => handleRoleChange(user.id, 'KITCHEN')}
                                    className="px-4 py-2 text-[10px] font-bold text-neutral-600 hover:bg-neutral-50 rounded-lg transition-all border border-neutral-100 uppercase tracking-wider"
                                  >
                                    Make Kitchen
                                  </button>
                                </>
                             ) : (
                                <>
                                  <button 
                                    onClick={() => handleRoleChange(user.id, 'ADMIN')}
                                    className="px-4 py-2 text-[10px] font-bold text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all border border-indigo-100 uppercase tracking-wider"
                                  >
                                    Make Admin
                                  </button>
                                  {user.role === 'CASHIER' ? (
                                    <button 
                                      onClick={() => handleRoleChange(user.id, 'KITCHEN')}
                                      className="px-4 py-2 text-[10px] font-bold text-neutral-600 hover:bg-neutral-50 rounded-lg transition-all border border-neutral-100 uppercase tracking-wider"
                                    >
                                      Make Kitchen
                                    </button>
                                  ) : (
                                    <button 
                                      onClick={() => handleRoleChange(user.id, 'CASHIER')}
                                      className="px-4 py-2 text-[10px] font-bold text-neutral-600 hover:bg-neutral-50 rounded-lg transition-all border border-neutral-100 uppercase tracking-wider"
                                    >
                                      Make Cashier
                                    </button>
                                  )}
                                </>
                             )}
                            <button 
                              onClick={() => handleDelete(user.id, user.name)}
                              className="px-4 py-2 text-[10px] font-bold text-red-500 hover:bg-red-50 rounded-lg transition-all border border-red-100 hover:border-red-200 shadow-sm uppercase tracking-wider"
                            >
                              Revoke Access
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
