'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Menu, Bell, User } from 'lucide-react';
import { AdminSidebar } from '@/components/layout/AdminSidebar';

interface AdminHeaderProps {
  onMenuClick?: () => void;
}

const pathTitleMap: Record<string, string> = {
  '/admin': 'Dashboard',
  '/admin/users': 'Kelola User',
  '/admin/roles': 'Role Management',
  '/admin/permissions': 'Permissions',
  '/admin/activity-log': 'Activity Log',
  '/admin/classes': 'Kelola Kelas',
  '/admin/students': 'Data Siswa',
  '/admin/new-students': 'Calon Siswa',
  '/admin/academic-years': 'Tahun Ajaran',
  '/admin/settings': 'Pengaturan',
  '/admin/registrations': 'Pendaftaran',
};

export function AdminHeader({ onMenuClick }: AdminHeaderProps) {
  const pathname = usePathname();
  const [userName, setUserName] = useState('Admin');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const pageTitle = pathTitleMap[pathname] ?? 'Admin';

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      setUserName(user.nama || 'Admin');
    }
  }, []);

  const handleMenuClick = () => {
    onMenuClick?.();
    setIsMobileMenuOpen(true);
  };

  return (
    <>
      {isMobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-50 lg:hidden">
            <AdminSidebar mobile onNavigate={() => setIsMobileMenuOpen(false)} />
          </div>
        </>
      )}

      <header className="fixed top-0 left-0 right-0 lg:left-64 h-16 bg-white/95 backdrop-blur-xl border-b border-neutral-200 z-40 shadow-soft">
        <div className="h-full px-3 md:px-6 flex items-center justify-between relative">
          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={handleMenuClick}
            className="lg:hidden p-2 hover:bg-neutral-100 rounded-lg transition-colors flex-shrink-0"
            aria-label="Buka menu admin"
          >
            <Menu className="w-6 h-6 text-neutral-700" />
          </button>

          {/* Mobile: Page Title Center */}
          <span className="lg:hidden absolute left-1/2 -translate-x-1/2 text-sm font-semibold text-neutral-900 truncate max-w-[150px] pointer-events-none">
            {pageTitle}
          </span>

          {/* Desktop: School Info */}
          <div className="hidden lg:flex items-center flex-1 max-w-lg">
            <div className="max-w-68 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 leading-tight">
              <p className="text-[10px] uppercase tracking-[0.14em] text-neutral-500">Panel Administrasi</p>
              <p className="text-xs font-semibold leading-tight text-neutral-800 sm:text-sm">SMP IT ANAK SOLEH MATARAM</p>
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-2 sm:gap-3 ml-auto">
            {/* Notifications */}
            <button className="relative p-2 hover:bg-neutral-100 rounded-lg transition-colors">
              <Bell className="w-5 h-5 text-neutral-700" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            {/* User Profile */}
            <div className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-neutral-200">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-neutral-900 truncate max-w-[100px]">{userName}</p>
                <p className="text-xs text-neutral-600">Administrator Sistem</p>
              </div>
              <div className="w-9 h-9 bg-linear-to-br from-primary to-primary-700 rounded-full flex items-center justify-center shadow-soft flex-shrink-0">
                <User className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
