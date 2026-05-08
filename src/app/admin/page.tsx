'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchWithAuth } from '@/lib/api-client';
import { AdminHeader } from '@/components/layout/AdminHeader';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { SmallStatCard, Card } from '@/components/ui/Card';
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
      const response = await fetchWithAuth('/api/admin/users');
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
            parent: users.filter((u: { role: string }) => u.role === 'STUDENT').length,
          }
        };
        
        setStats(stats);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const fetchRecentActivities = () => {
    fetchWithAuth('/api/admin/activity-logs?limit=5')
      .then(async (response) => {
        if (!response.ok) return;
        const result = await response.json();
        if (!result.success) return;

        const now = Date.now();
        const mapped = (result.data || []).map((item: {
          id: string;
          user: string;
          details: string;
          timestamp: string;
        }) => {
          const ts = new Date(item.timestamp).getTime();
          const diffMinutes = Math.max(1, Math.floor((now - ts) / 60000));
          const time = diffMinutes < 60
            ? `${diffMinutes} menit lalu`
            : diffMinutes < 1440
              ? `${Math.floor(diffMinutes / 60)} jam lalu`
              : `${Math.floor(diffMinutes / 1440)} hari lalu`;

          return {
            id: item.id,
            user: item.user,
            action: item.details,
            time,
          };
        });

        setRecentActivities(mapped);
      })
      .catch((error) => {
        console.error('Failed to fetch recent activities:', error);
      });
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-neutral-50">
      <AdminSidebar />
      <div className="lg:ml-64">
        <AdminHeader />
        
        <main className="pt-16 lg:pt-20 p-3 sm:p-5 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
            {/* Welcome Banner — compact on mobile */}
            <div className="animate-fade-in rounded-xl sm:rounded-2xl border border-neutral-200 bg-white p-3 sm:p-5 shadow-soft">
              <p className="text-[10px] sm:text-xs uppercase tracking-[0.16em] text-neutral-500 mb-1">Pusat Kontrol Admin</p>
              <h1 className="text-xl sm:text-3xl font-bold text-neutral-900 mb-1">
                Selamat Datang, {user.nama}
              </h1>
              <p className="text-xs sm:text-sm text-neutral-600 leading-snug">
                Kelola pengguna, otorisasi, dan audit aktivitas untuk SMP IT ANAK SOLEH MATARAM.
              </p>
            </div>

            {/* Stats Cards — 2x2 grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 animate-slide-up">
              <SmallStatCard
                title="Total Users"
                value={stats.total.toString()}
                icon={<Users className="w-5 h-5" />}
                color="primary"
              />
              <SmallStatCard
                title="Akun Aktif"
                value={stats.active.toString()}
                icon={<UserCheck className="w-5 h-5" />}
                color="accent"
              />
              <SmallStatCard
                title="Non-Aktif"
                value={stats.inactive.toString()}
                icon={<UserX className="w-5 h-5" />}
                color="danger"
              />
              <SmallStatCard
                title="Admin"
                value={stats.byRole.admin.toString()}
                icon={<Shield className="w-5 h-5" />}
                color="info"
              />
            </div>

            {/* Role Distribution & Quick Actions — 2 kolom di semua ukuran */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {/* Role Distribution */}
              <Card padding="md">
                <h3 className="text-sm sm:text-base font-semibold mb-3 text-neutral-900 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  Distribusi Role
                </h3>
                <div className="space-y-2">
                  {[
                    { label: 'Admin', count: stats.byRole.admin, bg: 'bg-red-100', icon: <Shield className="w-4 h-4 text-red-600" /> },
                    { label: 'Bendahara', count: stats.byRole.treasurer, bg: 'bg-primary-100', icon: <Users className="w-4 h-4 text-primary" /> },
                    { label: 'Kepsek', count: stats.byRole.headmaster, bg: 'bg-accent-100', icon: <Shield className="w-4 h-4 text-accent" /> },
                    { label: 'Orang Tua', count: stats.byRole.parent, bg: 'bg-blue-100', icon: <Users className="w-4 h-4 text-blue-600" /> },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between p-2 sm:p-3 bg-neutral-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 sm:w-8 sm:h-8 ${item.bg} rounded-md flex items-center justify-center flex-shrink-0`}>
                          {item.icon}
                        </div>
                        <span className="text-xs sm:text-sm font-medium text-neutral-900">{item.label}</span>
                      </div>
                      <span className="text-lg sm:text-2xl font-bold text-neutral-900">{item.count}</span>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Quick Actions */}
              <Card padding="md">
                <h3 className="text-sm sm:text-base font-semibold mb-3 text-neutral-900">Menu Admin</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => router.push('/admin/users')}
                    className="w-full p-3 sm:p-4 bg-linear-to-br from-primary to-primary-700 text-white rounded-xl hover:shadow-lg transition-all hover:scale-[1.02] text-left"
                  >
                    <div className="flex items-center gap-2 sm:gap-3">
                      <Users className="w-5 h-5 flex-shrink-0" />
                      <div>
                        <h4 className="font-bold text-sm mb-0.5">Kelola User</h4>
                        <p className="text-xs opacity-90 leading-tight">Tambah, edit, hapus akun</p>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => router.push('/admin/roles')}
                    className="w-full p-3 sm:p-4 bg-linear-to-br from-accent to-accent-700 text-white rounded-xl hover:shadow-lg transition-all hover:scale-[1.02] text-left"
                  >
                    <div className="flex items-center gap-2 sm:gap-3">
                      <Shield className="w-5 h-5 flex-shrink-0" />
                      <div>
                        <h4 className="font-bold text-sm mb-0.5">Role Management</h4>
                        <p className="text-xs opacity-90 leading-tight">Atur hak akses pengguna</p>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => router.push('/admin/activity-log')}
                    className="w-full p-3 sm:p-4 bg-linear-to-br from-blue-500 to-blue-700 text-white rounded-xl hover:shadow-lg transition-all hover:scale-[1.02] text-left"
                  >
                    <div className="flex items-center gap-2 sm:gap-3">
                      <Activity className="w-5 h-5 flex-shrink-0" />
                      <div>
                        <h4 className="font-bold text-sm mb-0.5">Activity Log</h4>
                        <p className="text-xs opacity-90 leading-tight">Pantau aktivitas pengguna</p>
                      </div>
                    </div>
                  </button>
                </div>
              </Card>
            </div>

            {/* Recent Activities — dibatasi tinggi & scrollable */}
            <Card padding="md">
              <h3 className="text-sm sm:text-base font-semibold mb-3 text-neutral-900 flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" />
                Aktivitas Terbaru
              </h3>
              {recentActivities.length === 0 ? (
                <p className="text-xs text-neutral-500 text-center py-4">Belum ada aktivitas</p>
              ) : (
                <div className="space-y-2 max-h-52 overflow-y-auto">
                  {recentActivities.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-2 p-2 sm:p-3 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-colors">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full mt-1.5 flex-shrink-0"></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-medium text-neutral-900 truncate">{activity.action}</p>
                        <p className="text-[10px] sm:text-xs text-neutral-500 mt-0.5">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
