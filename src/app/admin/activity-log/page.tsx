'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchWithAuth } from '@/lib/api-client';
import { AdminHeader } from '@/components/layout/AdminHeader';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Activity, Filter, Calendar, ShieldCheck, Sparkles } from 'lucide-react';
import { Select } from '@/components/ui/Input';

interface ActivityLog {
  id: string;
  user: string;
  action: string;
  target: string;
  status: 'success' | 'failed';
  timestamp: string;
  details: string;
}

export default function ActivityLogPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/auth/login');
      return;
    }

    const user = JSON.parse(userData);
    if (user.role !== 'ADMIN') {
      router.push('/auth/login');
      return;
    }

    const fetchLogs = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (filterType !== 'all') params.append('action', filterType);
        if (filterStatus !== 'all') params.append('status', filterStatus);
        params.append('limit', '200');

        const response = await fetchWithAuth(`/api/admin/activity-logs?${params.toString()}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch activity logs: ${response.status}`);
        }

        const result = await response.json();
        if (result.success) {
          setLogs(result.data || []);
        }
      } catch (error) {
        console.error('Error fetching activity logs:', error);
        setLogs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [router, filterType, filterStatus]);

  const getActionBadge = (action: string) => {
    const actionMap: Record<string, { label: string; color: 'primary' | 'success' | 'warning' | 'error' }> = {
      CREATE_USER: { label: 'Create', color: 'success' },
      UPDATE_USER: { label: 'Update', color: 'primary' },
      DELETE_USER: { label: 'Delete', color: 'error' },
      TOGGLE_STATUS: { label: 'Toggle', color: 'warning' },
      UPDATE_ROLE: { label: 'Role', color: 'primary' },
    };
    return actionMap[action] || { label: action, color: 'primary' };
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes}m lalu`;
    if (hours < 24) return `${hours}j lalu`;
    return `${days}h lalu`;
  };

  const filteredLogs = logs;

  return (
    <div className="min-h-screen bg-neutral-50">
      <AdminSidebar />
      <div className="lg:ml-64">
        <AdminHeader />

        <main className="pt-16 lg:pt-20 p-3 sm:p-5 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-3 sm:space-y-5">
            {/* Header — compact on mobile */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-primary-100 text-primary-800 px-2.5 py-1 text-[10px] sm:text-xs font-semibold mb-2">
                  <ShieldCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  <span className="hidden sm:inline">Pusat </span>Audit Keamanan
                </div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-neutral-900">Activity Log</h1>
                <p className="text-xs sm:text-sm text-neutral-600 mt-0.5 leading-snug">
                  Pantau jejak aktivitas pengguna secara real-time.
                </p>
              </div>
              {/* Total badge — compact */}
              <div className="flex-shrink-0 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-center min-w-[72px]">
                <p className="text-xl sm:text-2xl font-bold text-neutral-900">{filteredLogs.length}</p>
                <p className="text-[9px] sm:text-[10px] text-neutral-500 uppercase tracking-wide mt-0.5">aktivitas</p>
              </div>
            </div>

            {/* Filters — 2 kolom sejajar di mobile */}
            <Card padding="sm">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-md bg-neutral-100 flex items-center justify-center flex-shrink-0">
                  <Filter className="w-4 h-4 text-neutral-600" />
                </div>
                <div className="flex flex-1 gap-2">
                  <div className="flex-1">
                    <Select
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value)}
                      options={[
                        { value: 'all', label: 'Semua Aksi' },
                        { value: 'CREATE_USER', label: 'Create User' },
                        { value: 'UPDATE_USER', label: 'Update User' },
                        { value: 'DELETE_USER', label: 'Delete User' },
                        { value: 'TOGGLE_STATUS', label: 'Toggle Status' },
                        { value: 'UPDATE_ROLE', label: 'Update Role' },
                      ]}
                    />
                  </div>
                  <div className="flex-1">
                    <Select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      options={[
                        { value: 'all', label: 'Semua Status' },
                        { value: 'success', label: 'Success' },
                        { value: 'failed', label: 'Failed' },
                      ]}
                    />
                  </div>
                </div>
              </div>
            </Card>

            {/* Activity List */}
            {loading ? (
              <Card padding="md" className="text-center py-10">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                <p className="text-neutral-600 mt-3 text-sm">Memuat activity log...</p>
              </Card>
            ) : filteredLogs.length === 0 ? (
              <Card padding="md" className="text-center py-10">
                <Sparkles className="w-10 h-10 text-neutral-400 mx-auto mb-3" />
                <p className="text-neutral-600 text-sm">Tidak ada aktivitas yang sesuai filter</p>
              </Card>
            ) : (
              <div className="space-y-2">
                {filteredLogs.map((log) => {
                  const actionBadge = getActionBadge(log.action);
                  return (
                    <div key={log.id} className="bg-white rounded-xl border border-neutral-200 p-3 sm:p-4 hover:shadow-sm transition-shadow">
                      <div className="flex items-start gap-2.5">
                        {/* Icon */}
                        <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          log.status === 'success' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                        }`}>
                          <Activity className="w-4 h-4" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          {/* Row 1: user + badges */}
                          <div className="flex flex-wrap items-center gap-1.5 mb-1">
                            <span className="font-semibold text-neutral-900 text-xs sm:text-sm">{log.user}</span>
                            <Badge variant={actionBadge.color}>{actionBadge.label}</Badge>
                            <span className="text-neutral-400 text-xs">→</span>
                            <span className="text-neutral-700 text-xs font-medium truncate max-w-[100px] sm:max-w-none">{log.target}</span>
                            <Badge variant={log.status === 'success' ? 'success' : 'error'}>
                              {log.status}
                            </Badge>
                          </div>
                          {/* Row 2: details */}
                          <p className="text-xs text-neutral-500 truncate">{log.details}</p>
                        </div>

                        {/* Timestamp */}
                        <div className="flex-shrink-0 flex items-center gap-1 text-[10px] sm:text-xs text-neutral-400 whitespace-nowrap">
                          <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                          {formatTimestamp(log.timestamp)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
