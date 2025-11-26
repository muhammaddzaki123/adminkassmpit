'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminHeader } from '@/components/layout/AdminHeader';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Activity, Filter, Calendar } from 'lucide-react';
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

    // Load dummy data
    setLogs([
      {
        id: '1',
        user: 'superadmin',
        action: 'CREATE_USER',
        target: 'bendahara2',
        status: 'success',
        timestamp: new Date().toISOString(),
        details: 'Membuat user baru dengan role TREASURER'
      },
      {
        id: '2',
        user: 'superadmin',
        action: 'UPDATE_USER',
        target: 'bendahara',
        status: 'success',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        details: 'Mengubah email user'
      },
      {
        id: '3',
        user: 'superadmin',
        action: 'DELETE_USER',
        target: 'old_user',
        status: 'success',
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        details: 'Menghapus user dari sistem'
      },
      {
        id: '4',
        user: 'superadmin',
        action: 'TOGGLE_STATUS',
        target: 'inactive_user',
        status: 'success',
        timestamp: new Date(Date.now() - 10800000).toISOString(),
        details: 'Menonaktifkan akun user'
      },
      {
        id: '5',
        user: 'superadmin',
        action: 'UPDATE_ROLE',
        target: 'john_doe',
        status: 'failed',
        timestamp: new Date(Date.now() - 14400000).toISOString(),
        details: 'Gagal mengubah role user - permission denied'
      },
    ]);
  }, [router]);

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

  const filteredLogs = logs.filter(log => {
    if (filterType !== 'all' && log.action !== filterType) return false;
    if (filterStatus !== 'all' && log.status !== filterStatus) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-neutral-50">
      <AdminSidebar />
      <div className="ml-64">
        <AdminHeader />

        <main className="pt-16 p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div>
              <h1 className="text-3xl font-bold text-neutral-900 mb-2">Activity Log</h1>
              <p className="text-neutral-600">Pantau semua aktivitas pengguna dalam sistem</p>
            </div>

            {/* Filters */}
            <Card>
              <div className="flex items-center gap-4">
                <Filter className="w-5 h-5 text-neutral-600" />
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
            <div className="space-y-3">
              {filteredLogs.map((log) => {
                const actionBadge = getActionBadge(log.action);
                return (
                  <Card key={log.id} className="hover:shadow-md transition-shadow">
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

            {filteredLogs.length === 0 && (
              <Card className="text-center py-12">
                <Activity className="w-12 h-12 text-neutral-400 mx-auto mb-3" />
                <p className="text-neutral-600">Tidak ada aktivitas yang sesuai dengan filter</p>
              </Card>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
