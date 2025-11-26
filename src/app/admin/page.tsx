'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminHeader } from '@/components/layout/AdminHeader';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { StatCard, Card } from '@/components/ui/Card';
import { Users, UserCheck, UserX, Shield, Activity, TrendingUp } from 'lucide-react';

interface UserStats {
  total: number;
  active: number;
  inactive: number;
  byRole: {
    admin: number;
    treasurer: number;
    headmaster: number;
    parent: number;
  };
}

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<{ role: string; nama: string } | null>(null);
  const [stats, setStats] = useState<UserStats>({
    total: 0,
    active: 0,
    inactive: 0,
    byRole: { admin: 0, treasurer: 0, headmaster: 0, parent: 0 }
  });
  const [recentActivities, setRecentActivities] = useState<Array<{
    id: string;
    user: string;
    action: string;
    time: string;
  }>>([]);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/auth/login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    if (parsedUser.role !== 'ADMIN') {
      router.push('/auth/login');
      return;
    }

    setUser(parsedUser);
    fetchStats();
    fetchRecentActivities();
  }, [router]);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/users');
      if (response.ok) {
        const users = await response.json();
        
        const stats: UserStats = {
          total: users.length,
          active: users.filter((u: { isActive: boolean }) => u.isActive).length,
          inactive: users.filter((u: { isActive: boolean }) => !u.isActive).length,
          byRole: {
            admin: users.filter((u: { role: string }) => u.role === 'ADMIN').length,
            treasurer: users.filter((u: { role: string }) => u.role === 'TREASURER').length,
            headmaster: users.filter((u: { role: string }) => u.role === 'HEADMASTER').length,
            parent: users.filter((u: { role: string }) => u.role === 'PARENT').length,
          }
        };
        
        setStats(stats);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const fetchRecentActivities = () => {
    // Dummy data for now - nanti bisa connect ke API activity log
    setRecentActivities([
      { id: '1', user: 'Admin', action: 'Menambahkan user baru: bendahara2', time: '5 menit lalu' },
      { id: '2', user: 'Admin', action: 'Mengubah role user: john_doe', time: '15 menit lalu' },
      { id: '3', user: 'Admin', action: 'Menonaktifkan akun: old_user', time: '1 jam lalu' },
    ]);
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-neutral-50">
      <AdminSidebar />
      <div className="ml-64">
        <AdminHeader />
        
        <main className="pt-16 p-8">
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Welcome Section */}
            <div className="animate-fade-in">
              <h1 className="text-3xl font-bold text-neutral-900 mb-2">
                Selamat Datang, {user.nama}
              </h1>
              <p className="text-neutral-600">Admin Dashboard - Kelola Akun Pengguna Sistem</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-slide-up">
              <StatCard
                title="Total Users"
                value={stats.total.toString()}
                trend={`${stats.active} aktif`}
                trendUp={true}
                icon={<Users className="w-6 h-6" />}
                color="primary"
              />
              <StatCard
                title="Akun Aktif"
                value={stats.active.toString()}
                trend={`${((stats.active / stats.total) * 100 || 0).toFixed(0)}% dari total`}
                trendUp={true}
                icon={<UserCheck className="w-6 h-6" />}
                color="accent"
              />
              <StatCard
                title="Akun Non-Aktif"
                value={stats.inactive.toString()}
                icon={<UserX className="w-6 h-6" />}
                color="danger"
              />
              <StatCard
                title="Administrator"
                value={stats.byRole.admin.toString()}
                icon={<Shield className="w-6 h-6" />}
                color="info"
              />
            </div>

            {/* Role Distribution & Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Role Distribution */}
              <Card>
                <h3 className="text-lg font-semibold mb-4 text-neutral-900 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Distribusi Role
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                        <Shield className="w-5 h-5 text-red-600" />
                      </div>
                      <span className="font-medium text-neutral-900">Admin</span>
                    </div>
                    <span className="text-2xl font-bold text-neutral-900">{stats.byRole.admin}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                        <Users className="w-5 h-5 text-primary" />
                      </div>
                      <span className="font-medium text-neutral-900">Bendahara</span>
                    </div>
                    <span className="text-2xl font-bold text-neutral-900">{stats.byRole.treasurer}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-accent-100 rounded-lg flex items-center justify-center">
                        <Shield className="w-5 h-5 text-accent" />
                      </div>
                      <span className="font-medium text-neutral-900">Kepala Sekolah</span>
                    </div>
                    <span className="text-2xl font-bold text-neutral-900">{stats.byRole.headmaster}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Users className="w-5 h-5 text-blue-600" />
                      </div>
                      <span className="font-medium text-neutral-900">Orang Tua</span>
                    </div>
                    <span className="text-2xl font-bold text-neutral-900">{stats.byRole.parent}</span>
                  </div>
                </div>
              </Card>

              {/* Quick Actions */}
              <Card>
                <h3 className="text-lg font-semibold mb-4 text-neutral-900">Menu Admin</h3>
                <div className="space-y-3">
                  <button
                    onClick={() => router.push('/admin/users')}
                    className="w-full p-4 bg-linear-to-br from-primary to-primary-700 text-white rounded-xl hover:shadow-lg transition-all hover:scale-105 text-left"
                  >
                    <div className="flex items-center gap-3">
                      <Users className="w-6 h-6" />
                      <div>
                        <h4 className="font-bold mb-1">Kelola User</h4>
                        <p className="text-sm opacity-90">Tambah, edit, hapus akun pengguna</p>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => router.push('/admin/roles')}
                    className="w-full p-4 bg-linear-to-br from-accent to-accent-700 text-white rounded-xl hover:shadow-lg transition-all hover:scale-105 text-left"
                  >
                    <div className="flex items-center gap-3">
                      <Shield className="w-6 h-6" />
                      <div>
                        <h4 className="font-bold mb-1">Role Management</h4>
                        <p className="text-sm opacity-90">Atur hak akses pengguna</p>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => router.push('/admin/activity-log')}
                    className="w-full p-4 bg-linear-to-br from-blue-500 to-blue-700 text-white rounded-xl hover:shadow-lg transition-all hover:scale-105 text-left"
                  >
                    <div className="flex items-center gap-3">
                      <Activity className="w-6 h-6" />
                      <div>
                        <h4 className="font-bold mb-1">Activity Log</h4>
                        <p className="text-sm opacity-90">Pantau aktivitas pengguna</p>
                      </div>
                    </div>
                  </button>
                </div>
              </Card>
            </div>

            {/* Recent Activities */}
            <Card>
              <h3 className="text-lg font-semibold mb-4 text-neutral-900 flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                Aktivitas Terbaru
              </h3>
              <div className="space-y-3">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 p-3 bg-neutral-50 rounded-xl hover:bg-neutral-100 transition-colors">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-neutral-900">{activity.action}</p>
                      <p className="text-xs text-neutral-600 mt-1">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
