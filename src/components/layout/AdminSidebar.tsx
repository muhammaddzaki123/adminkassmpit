'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Users, Shield, Activity, Settings, LogOut, LayoutDashboard, UserCog, UserPlus, GraduationCap, School, CalendarRange } from 'lucide-react';
import { clearClientAuthSession } from '@/lib/client-auth';

interface AdminSidebarProps {
  mobile?: boolean;
  onNavigate?: () => void;
}

export function AdminSidebar({ mobile = false, onNavigate }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const menuItems = [
    {
      icon: LayoutDashboard,
      label: 'Dashboard',
      path: '/admin',
    },
    {
      icon: UserPlus,
      label: 'Calon Siswa',
      path: '/admin/new-students',
    },
    {
      icon: GraduationCap,
      label: 'Data Siswa',
      path: '/admin/students',
    },
    {
      icon: School,
      label: 'Kelola Kelas',
      path: '/admin/classes',
    },
    {
      icon: CalendarRange,
      label: 'Tahun Ajaran',
      path: '/admin/academic-years',
    },
    {
      icon: Users,
      label: 'Kelola User',
      path: '/admin/users',
    },
    {
      icon: Shield,
      label: 'Role Management',
      path: '/admin/roles',
    },
    {
      icon: UserCog,
      label: 'Permissions',
      path: '/admin/permissions',
    },
    {
      icon: Activity,
      label: 'Activity Log',
      path: '/admin/activity-log',
    },
    {
      icon: Settings,
      label: 'Pengaturan',
      path: '/admin/settings',
    },
  ];

  const handleLogout = async () => {
    await clearClientAuthSession();
    router.push('/auth/login');
    onNavigate?.();
  };

  const handleNavigate = (path: string) => {
    router.push(path);
    onNavigate?.();
  };

  return (
    <div
      className={mobile
        ? 'flex h-full w-64 flex-col border-r border-neutral-200 bg-white shadow-soft'
        : 'hidden lg:flex w-64 bg-white h-screen flex-col border-r border-neutral-200 shadow-soft fixed left-0 top-0 z-50'
      }
    >
      {/* Logo & Brand */}
      <div className="border-b border-neutral-100 px-4 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-br from-primary to-primary-700 shadow-soft">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-bold leading-none tracking-tight text-neutral-900">T-SMART</h1>
            <p className="mt-1 max-w-44 text-[10px] font-medium leading-tight text-neutral-600 sm:text-[11px]">
              Admin Panel - ANAK SOLEH MATARAM
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => handleNavigate(item.path)}
              className={`flex items-center gap-3 px-4 py-3 w-full rounded-xl transition-all duration-200 font-semibold text-sm ${
                isActive
                  ? 'bg-primary text-white shadow-soft'
                  : 'text-neutral-700 hover:bg-neutral-100 hover:text-primary'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-neutral-200 bg-neutral-50">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-red-600 hover:bg-red-50 transition-all duration-200 hover:shadow-soft font-semibold text-sm"
        >
          <LogOut className="w-5 h-5" />
          <span>Keluar</span>
        </button>
      </div>
    </div>
  );
}
