'use client';

import { usePathname, useRouter } from 'next/navigation';
import { clearClientAuthSession } from '@/lib/client-auth';
import {
  LayoutDashboard,
  CreditCard,
  History,
  User,
  LogOut,
  Receipt,
} from 'lucide-react';

interface MenuItem {
  name: string;
  path: string;
  icon: React.ReactNode;
}

const menuItems: MenuItem[] = [
  { name: 'Dashboard', path: '/student/dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
  { name: 'Pembayaran SPP', path: '/student/spp', icon: <CreditCard className="w-5 h-5" /> },
  { name: 'Daftar Ulang', path: '/student/re-registration', icon: <Receipt className="w-5 h-5" /> },
  { name: 'Riwayat', path: '/student/history', icon: <History className="w-5 h-5" /> },
  { name: 'Profil', path: '/student/profile', icon: <User className="w-5 h-5" /> },
];

export function StudentSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await clearClientAuthSession();
    router.push('/auth/login');
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-neutral-200 flex flex-col z-30 shadow-soft">
      {/* Logo */}
      <div className="p-6 border-b border-neutral-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-linear-to-br from-primary to-primary-700 flex items-center justify-center shadow-soft">
            <span className="text-white font-bold text-sm">TS</span>
          </div>
          <div>
            <h1 className="font-bold text-lg text-neutral-900">T-SMART Siswa</h1>
            <p className="text-xs text-neutral-600">ANAK SOLEH MATARAM</p>
          </div>
        </div>
      </div>

      {/* Menu */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => router.push(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive
                    ? 'bg-primary-50 text-primary-600 font-medium'
                    : 'text-neutral-600 hover:bg-neutral-50'
                }`}
              >
                {item.icon}
                <span>{item.name}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-neutral-200">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-all"
        >
          <LogOut className="w-5 h-5" />
          <span>Keluar</span>
        </button>
      </div>
    </aside>
  );
}
