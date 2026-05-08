'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminHeader } from '@/components/layout/AdminHeader';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { Card } from '@/components/ui/Card';
import { Shield, Users, Eye, Settings, Check, X } from 'lucide-react';

interface Role {
  name: string;
  displayName: string;
  description: string;
  userCount: number;
  permissions: string[];
  color: string;
}

export default function RoleManagement() {
  const router = useRouter();
  const [roles] = useState<Role[]>([
    {
      name: 'ADMIN',
      displayName: 'Administrator',
      description: 'Akses penuh ke semua fitur sistem termasuk manajemen user',
      userCount: 1,
      permissions: ['user.create', 'user.read', 'user.update', 'user.delete', 'role.manage', 'system.settings'],
      color: 'red'
    },
    {
      name: 'TREASURER',
      displayName: 'Bendahara',
      description: 'Mengelola keuangan, SPP, dan pembayaran sekolah',
      userCount: 2,
      permissions: ['payment.create', 'payment.read', 'payment.update', 'expense.create', 'expense.read', 'report.generate'],
      color: 'primary'
    },
    {
      name: 'HEADMASTER',
      displayName: 'Kepala Sekolah',
      description: 'Melihat laporan dan analisis data sekolah',
      userCount: 1,
      permissions: ['report.read', 'analytics.view', 'payment.read', 'expense.read'],
      color: 'accent'
    },
    {
      name: 'PARENT',
      displayName: 'Orang Tua',
      description: 'Melihat informasi dan melakukan pembayaran untuk anak',
      userCount: 0,
      permissions: ['payment.own.read', 'payment.own.create', 'student.own.read'],
      color: 'blue'
    }
  ]);

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
  }, [router]);

  const getColorClass = (color: string) => {
    const colors: Record<string, string> = {
      red: 'bg-red-100 text-red-700 border-red-200',
      primary: 'bg-primary-100 text-primary-700 border-primary-200',
      accent: 'bg-accent-100 text-accent-700 border-accent-200',
      blue: 'bg-blue-100 text-blue-700 border-blue-200',
    };
    return colors[color] || colors.primary;
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <AdminSidebar />
      <div className="lg:ml-64">
        <AdminHeader />

        <main className="pt-16 lg:pt-20 p-3 sm:p-5 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-3 sm:space-y-5">
            {/* Header */}
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-neutral-900">Role Management</h1>
              <p className="mt-0.5 text-xs sm:text-sm text-neutral-600">Kelola role dan hak akses pengguna sistem</p>
            </div>

            {/* Roles Grid — 2 kolom di semua ukuran */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {roles.map((role) => (
                <Card key={role.name} padding="md" className="hover:shadow-md transition-shadow">
                  <div className="space-y-3">
                    {/* Role Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${getColorClass(role.color)}`}>
                          <Shield className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-sm sm:text-base font-bold text-neutral-900">{role.displayName}</h3>
                          <p className="text-[10px] sm:text-xs text-neutral-500">{role.name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 px-2 py-1 bg-neutral-100 rounded-full flex-shrink-0">
                        <Users className="w-3.5 h-3.5 text-neutral-600" />
                        <span className="text-xs font-semibold text-neutral-900">{role.userCount}</span>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-xs sm:text-sm text-neutral-600 leading-snug">{role.description}</p>

                    {/* Permissions */}
                    <div>
                      <h4 className="text-xs font-semibold text-neutral-700 mb-1.5">Hak Akses:</h4>
                      <div className="grid grid-cols-1 gap-1">
                        {role.permissions.map((permission) => (
                          <div key={permission} className="flex items-center gap-1.5 text-xs text-neutral-600">
                            <Check className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                            <span className="truncate">{permission.replace('.', ' › ')}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2 border-t border-neutral-100">
                      <button className="flex-1 px-3 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-900 rounded-lg font-medium text-xs transition-colors flex items-center justify-center gap-1.5">
                        <Eye className="w-3.5 h-3.5" />
                        Detail
                      </button>
                      <button className="flex-1 px-3 py-2 bg-primary hover:bg-primary-700 text-white rounded-lg font-medium text-xs transition-colors flex items-center justify-center gap-1.5">
                        <Settings className="w-3.5 h-3.5" />
                        Edit Permissions
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Permission Matrix */}
            <Card padding="md">
              <h3 className="text-sm sm:text-base font-bold text-neutral-900 mb-3">Permission Matrix</h3>
              <div className="overflow-x-auto rounded-lg border border-neutral-100">
                <table className="w-full min-w-[420px]">
                  <thead>
                    <tr className="border-b border-neutral-200 bg-neutral-50">
                      <th className="text-left p-2.5 text-xs font-semibold text-neutral-700 sticky left-0 bg-neutral-50 min-w-[130px]">Permission</th>
                      {roles.map((role) => (
                        <th key={role.name} className="text-center p-2.5 text-xs font-semibold text-neutral-700 whitespace-nowrap">
                          {role.displayName}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      'user.create', 'user.read', 'user.update', 'user.delete',
                      'payment.create', 'payment.read', 'payment.update',
                      'expense.create', 'expense.read',
                      'report.generate', 'report.read',
                      'system.settings'
                    ].map((permission) => (
                      <tr key={permission} className="border-b border-neutral-100 hover:bg-neutral-50">
                        <td className="p-2.5 text-xs text-neutral-700 sticky left-0 bg-white hover:bg-neutral-50 font-medium">
                          {permission.replace('.', ' › ')}
                        </td>
                        {roles.map((role) => (
                          <td key={role.name} className="p-2.5 text-center">
                            {role.permissions.includes(permission) ? (
                              <Check className="w-4 h-4 text-green-600 mx-auto" />
                            ) : (
                              <X className="w-4 h-4 text-neutral-300 mx-auto" />
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
