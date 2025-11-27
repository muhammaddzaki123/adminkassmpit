'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Users, Shield, Activity, Settings, LogOut, LayoutDashboard, UserCog, UserPlus, GraduationCap } from 'lucide-react';

export function AdminSidebar() {
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

  const handleLogout = () => {
    localStorage.removeItem('user');
    router.push('/auth/login');
  };

  return (
    <div className="w-64 bg-white h-screen flex flex-col border-r border-neutral-200 shadow-soft fixed left-0 top-0 z-50">
      {/* Logo & Brand */}
      <div className="p-6 border-b border-neutral-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-linear-to-br from-primary to-primary-700 rounded-xl flex items-center justify-center shadow-soft">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-neutral-900 text-xl leading-none tracking-tight">T-SMART</h1>
            <p className="text-xs text-neutral-600 mt-1 font-medium">Admin Panel</p>
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
              onClick={() => router.push(item.path)}
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
