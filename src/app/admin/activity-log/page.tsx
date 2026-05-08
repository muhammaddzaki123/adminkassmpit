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

export default function ActivityLog() {
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
      UPDATE_ROLE: { label: 'Role Change', color: 'primary' },
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

    if (minutes < 60) return `${minutes} menit lalu`;
    if (hours < 24) return `${hours} jam lalu`;
    return `${days} hari lalu`;
  };

  const filteredLogs = logs;

  return (
    <div className="min-h-screen bg-neutral-50">
      <AdminSidebar />
      <div className="lg:ml-64">
        <AdminHeader />

        <main className="pt-16 p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <Card className="bg-linear-to-r from-white via-primary-50 to-accent-50 border-primary-100 shadow-sm">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-primary-100 text-primary-800 px-3 py-1 text-xs font-semibold mb-3">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Pusat Audit Keamanan
                  </div>
                  <h1 className="text-3xl font-bold text-neutral-900 mb-2">Activity Log</h1>
                  <p className="text-neutral-700">Pantau jejak aktivitas pengguna secara real-time untuk menjaga integritas sistem keuangan.</p>
                </div>
                <div className="rounded-xl border border-primary-200 bg-white/70 px-4 py-3 min-w-[220px]">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-neutral-500 mb-1">Ringkasan Cepat</p>
                  <p className="text-2xl font-bold text-neutral-900">{filteredLogs.length}</p>
                  <p className="text-xs text-neutral-600">Aktivitas ditampilkan sesuai filter saat ini</p>
                </div>
              </div>
            </Card>

            {/* Filters */}
            <Card className="border-neutral-200 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-9 h-9 rounded-lg bg-neutral-100 flex items-center justify-center">
                  <Filter className="w-5 h-5 text-neutral-600" />
                </div>
                <div className="flex gap-4 flex-1">
                  <div className="w-48">
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
                  <div className="w-48">
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
                <span className="text-sm text-neutral-600">
                  {filteredLogs.length} aktivitas
                </span>
              </div>
            </Card>

            {/* Activity List */}
            {loading ? (
              <Card className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
                <p className="text-neutral-600 mt-3">Memuat activity log...</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredLogs.map((log) => {
                const actionBadge = getActionBadge(log.action);
                return (
                  <Card key={log.id} className="hover:shadow-md transition-shadow border-neutral-200">
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        log.status === 'success' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                      }`}>
                        <Activity className="w-5 h-5" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-neutral-900">{log.user}</span>
                          <Badge variant={actionBadge.color}>{actionBadge.label}</Badge>
                          <span className="text-neutral-600">→</span>
                          <span className="text-neutral-900 font-medium">{log.target}</span>
                          <Badge variant={log.status === 'success' ? 'success' : 'error'}>
                            {log.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-neutral-600">{log.details}</p>
                      </div>

                      {/* Timestamp */}
                      <div className="flex items-center gap-2 text-sm text-neutral-500">
                        <Calendar className="w-4 h-4" />
                        {formatTimestamp(log.timestamp)}
                      </div>
                    </div>
                  </Card>
                );
                })}
              </div>
            )}

            {filteredLogs.length === 0 && (
              <Card className="text-center py-12">
                <Sparkles className="w-12 h-12 text-neutral-400 mx-auto mb-3" />
                <p className="text-neutral-600">Tidak ada aktivitas yang sesuai dengan filter</p>
              </Card>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
