'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminHeader } from '@/components/layout/AdminHeader';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Shield, Lock, Unlock, Plus, Search } from 'lucide-react';
import { Input } from '@/components/ui/Input';

interface Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
  description: string;
  createdAt: string;
}

export default function PermissionsManagement() {
  const router = useRouter();
  const [permissions] = useState<Permission[]>([
    { id: '1', name: 'user.create', resource: 'User', action: 'Create', description: 'Membuat user baru', createdAt: '2024-01-01' },
    { id: '2', name: 'user.read', resource: 'User', action: 'Read', description: 'Melihat data user', createdAt: '2024-01-01' },
    { id: '3', name: 'user.update', resource: 'User', action: 'Update', description: 'Mengubah data user', createdAt: '2024-01-01' },
    { id: '4', name: 'user.delete', resource: 'User', action: 'Delete', description: 'Menghapus user', createdAt: '2024-01-01' },
    { id: '5', name: 'payment.create', resource: 'Payment', action: 'Create', description: 'Membuat pembayaran baru', createdAt: '2024-01-01' },
    { id: '6', name: 'payment.read', resource: 'Payment', action: 'Read', description: 'Melihat data pembayaran', createdAt: '2024-01-01' },
    { id: '7', name: 'payment.update', resource: 'Payment', action: 'Update', description: 'Mengubah data pembayaran', createdAt: '2024-01-01' },
    { id: '8', name: 'expense.create', resource: 'Expense', action: 'Create', description: 'Membuat pengeluaran baru', createdAt: '2024-01-01' },
    { id: '9', name: 'expense.read', resource: 'Expense', action: 'Read', description: 'Melihat data pengeluaran', createdAt: '2024-01-01' },
    { id: '10', name: 'report.generate', resource: 'Report', action: 'Generate', description: 'Generate laporan', createdAt: '2024-01-01' },
    { id: '11', name: 'report.read', resource: 'Report', action: 'Read', description: 'Melihat laporan', createdAt: '2024-01-01' },
    { id: '12', name: 'system.settings', resource: 'System', action: 'Settings', description: 'Mengatur konfigurasi sistem', createdAt: '2024-01-01' },
  ]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterResource, setFilterResource] = useState('all');

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

  const resources = ['all', ...Array.from(new Set(permissions.map(p => p.resource)))];

  const filteredPermissions = permissions.filter(permission => {
    const matchSearch = permission.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                       permission.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchResource = filterResource === 'all' || permission.resource === filterResource;
    return matchSearch && matchResource;
  });

  const groupedPermissions = filteredPermissions.reduce((acc, permission) => {
    if (!acc[permission.resource]) {
      acc[permission.resource] = [];
    }
    acc[permission.resource].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);

  const getActionColor = (action: string) => {
    const colors: Record<string, string> = {
      Create: 'bg-green-100 text-green-700',
      Read: 'bg-blue-100 text-blue-700',
      Update: 'bg-yellow-100 text-yellow-700',
      Delete: 'bg-red-100 text-red-700',
      Generate: 'bg-purple-100 text-purple-700',
      Settings: 'bg-neutral-100 text-neutral-700',
    };
    return colors[action] || 'bg-neutral-100 text-neutral-700';
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <AdminSidebar />
      <div className="ml-64">
        <AdminHeader />

        <main className="pt-16 p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-neutral-900 mb-2">Permissions Management</h1>
                <p className="text-neutral-600">Kelola hak akses dan permission sistem</p>
              </div>
              <Button icon={<Plus className="w-4 h-4" />}>
                Tambah Permission
              </Button>
            </div>

            {/* Filters */}
            <Card>
              <div className="flex gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Cari permission..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    icon={<Search className="w-4 h-4" />}
                  />
                </div>
                <div className="flex gap-2">
                  {resources.map((resource) => (
                    <button
                      key={resource}
                      onClick={() => setFilterResource(resource)}
                      className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                        filterResource === resource
                          ? 'bg-primary text-white'
                          : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                      }`}
                    >
                      {resource === 'all' ? 'Semua' : resource}
                    </button>
                  ))}
                </div>
              </div>
            </Card>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card padding="md" className="text-center">
                <Shield className="w-8 h-8 text-primary mx-auto mb-2" />
                <p className="text-2xl font-bold text-neutral-900">{permissions.length}</p>
                <p className="text-sm text-neutral-600">Total Permissions</p>
              </Card>
              <Card padding="md" className="text-center">
                <Lock className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-neutral-900">{permissions.filter(p => p.action !== 'Delete').length}</p>
                <p className="text-sm text-neutral-600">Safe Operations</p>
              </Card>
              <Card padding="md" className="text-center">
                <Unlock className="w-8 h-8 text-red-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-neutral-900">{permissions.filter(p => p.action === 'Delete').length}</p>
                <p className="text-sm text-neutral-600">Critical Operations</p>
              </Card>
              <Card padding="md" className="text-center">
                <Shield className="w-8 h-8 text-accent mx-auto mb-2" />
                <p className="text-2xl font-bold text-neutral-900">{Object.keys(groupedPermissions).length}</p>
                <p className="text-sm text-neutral-600">Resources</p>
              </Card>
            </div>

            {/* Permissions by Resource */}
            {Object.entries(groupedPermissions).map(([resource, perms]) => (
              <Card key={resource}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                    <Shield className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-neutral-900">{resource}</h3>
                    <p className="text-sm text-neutral-600">{perms.length} permissions</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {perms.map((permission) => (
                    <div
                      key={permission.id}
                      className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 hover:border-primary hover:shadow-soft transition-all"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <code className="text-sm font-mono font-semibold text-neutral-900">
                          {permission.name}
                        </code>
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${getActionColor(permission.action)}`}>
                          {permission.action}
                        </span>
                      </div>
                      <p className="text-sm text-neutral-600">{permission.description}</p>
                    </div>
                  ))}
                </div>
              </Card>
            ))}

            {filteredPermissions.length === 0 && (
              <Card className="text-center py-12">
                <Shield className="w-12 h-12 text-neutral-400 mx-auto mb-3" />
                <p className="text-neutral-600">Tidak ada permission yang ditemukan</p>
              </Card>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
