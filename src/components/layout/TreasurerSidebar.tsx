'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { clearClientAuthSession } from '@/lib/client-auth';
import Image from 'next/image';
import { 
  LayoutDashboard, 
  Users, 
  CreditCard, 
  TrendingDown, 
  ChevronDown,
  ChevronRight,
  Circle,
  LogOut,
  Wallet
} from 'lucide-react';

interface MenuItem {
  label: string;
  path: string;
  matchPrefixes?: string[];
}

interface MenuGroup {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  items: MenuItem[];
}

export function TreasurerSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  const menuGroups = useMemo<MenuGroup[]>(
    () => [
      {
        id: 'dashboard',
        label: 'Dashboard',
        icon: LayoutDashboard,
        items: [
          {
            label: 'Dashboard Utama',
            path: '/treasurer/dashboard',
          },
        ],
      },
      {
        id: 'students',
        label: 'Kelola Data Siswa',
        icon: Users,
        items: [
          {
            label: 'Data Siswa',
            path: '/treasurer/students',
          },
        ],
      },
      {
        id: 'payments',
        label: 'Kelola Pembayaran',
        icon: CreditCard,
        items: [
          {
            label: 'kelola Tagihan',
            path: '/treasurer/billing/list',
            matchPrefixes: ['/treasurer/billing'],
          },
          {
            label: 'Kelola Pembayaran SPP',
            path: '/treasurer/spp',
          },
          {
            label: 'Input Pembayaran ',
            path: '/treasurer/payment',
          },
          {
            label: 'Verifikasi Pembayaran',
            path: '/treasurer/payment/manual',
          },
        ],
      },
      {
        id: 'expenses',
        label: 'Kelola Kas',
        icon: TrendingDown,
        items: [
          {
            label: 'Buku Besar',
            path: '/treasurer/buku-besar',
            matchPrefixes: ['/treasurer/buku-besar'],
          },
          {
            label: 'Pengeluaran',
            path: '/treasurer/expenses',
          },
        ],
      },
      {
        id: 'others',
        label: 'Lainnya',
        icon: Wallet,
        items: [
          {
            label: 'Laporan',
            path: '/treasurer/reports',
          },
          {
            label: 'Riwayat Transaksi',
            path: '/treasurer/history',
          },
          {
            label: 'Daftar Ulang',
            path: '/treasurer/re-registration',
          },
          {
            label: 'Reminder WA',
            path: '/treasurer/wa-reminder',
          },
          {
            label: 'Backup Data',
            path: '/treasurer/backup',
          },
        ],
      },
    ],
    []
  );

  const isItemActive = useCallback((item: MenuItem) => {
    if (pathname === item.path) return true;
    if (item.matchPrefixes?.some((prefix) => pathname.startsWith(prefix))) return true;
    return false;
  }, [pathname]);

  const isGroupActive = useCallback(
    (group: MenuGroup) => group.items.some((item) => isItemActive(item)),
    [isItemActive]
  );

  useEffect(() => {
    setOpenGroups((prev) => {
      const next = { ...prev };
      for (const group of menuGroups) {
        if (next[group.id] === undefined) {
          next[group.id] = group.id === 'dashboard';
        }
        if (isGroupActive(group)) {
          next[group.id] = true;
        }
      }
      return next;
    });
  }, [pathname, menuGroups, isGroupActive]);

  const toggleGroup = (groupId: string) => {
    setOpenGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  const handleLogout = async () => {
    await clearClientAuthSession();
    router.push('/auth/login');
  };

  return (
    <div className="w-64 bg-white h-screen flex flex-col border-r border-neutral-200 shadow-soft fixed left-0 top-0 z-50">
      {/* Logo & Brand */}
      <div className="p-6 border-b border-neutral-100">
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 overflow-hidden rounded-xl border border-neutral-200 bg-white flex items-center justify-center shadow-soft">
            <Image src="/logo.jpg" alt="Logo SMP IT Anak Soleh Mataram" fill sizes="40px" className="object-contain p-1" />
          </div>
          <div>
            <h1 className="font-bold text-neutral-900 text-xl leading-none tracking-tight">T-SMART</h1>
            <p className="text-xs text-neutral-600 mt-1 font-medium">Bendahara - ANAK SOLEH MATARAM</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-2 overflow-y-auto">
        {menuGroups.map((group) => {
          const isExpanded = !!openGroups[group.id];
          const groupActive = isGroupActive(group);

          return (
            <div key={group.id} className="rounded-xl border border-neutral-200/80 bg-white/60 overflow-hidden">
              <button
                onClick={() => toggleGroup(group.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 transition-colors ${
                  groupActive ? 'bg-primary-50 text-primary-700' : 'text-neutral-700 hover:bg-neutral-100'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <group.icon className="w-5 h-5" />
                  <span className="text-sm font-semibold">{group.label}</span>
                </div>
                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>

              {isExpanded && (
                <div className="px-2 pb-2 space-y-1 border-t border-neutral-200/70 bg-neutral-50/60">
                  {group.items.map((item) => {
                    const activeItem = isItemActive(item);
                    return (
                      <button
                        key={item.path}
                        onClick={() => router.push(item.path)}
                        className={`w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors ${
                          activeItem
                            ? 'bg-primary text-white shadow-soft'
                            : 'text-neutral-700 hover:bg-neutral-100 hover:text-primary-700'
                        }`}
                      >
                        <Circle className="w-2.5 h-2.5 fill-current" />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
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
