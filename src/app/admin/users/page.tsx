'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { fetchWithAuth } from '@/lib/api-client';
import { AdminHeader } from '@/components/layout/AdminHeader';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { Table } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Plus, Search, Edit, Trash2, Eye, EyeOff, Lock } from 'lucide-react';

interface User {
  id: string;
  username: string;
  email: string | null;
  nama: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export default function UsersManagement() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // Form state
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    nama: '',
    role: 'TREASURER',
    isActive: true,
  });

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/auth/login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    if (parsedUser.role !== 'ADMIN') {
      router.push('/dashboard');
      return;
    }

    fetchUsers();
  }, [router]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const response = await fetchWithAuth('/api/admin/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const url = editingUser ? `/api/admin/users/${editingUser.id}` : '/api/admin/users';
      const method = editingUser ? 'PUT' : 'POST';

      const response = await fetchWithAuth(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await fetchUsers();
        setShowModal(false);
        resetForm();
      } else {
        const error = await response.json();
        alert(error.error || 'Terjadi kesalahan');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Terjadi kesalahan pada server');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      email: user.email || '',
      password: '',
      nama: user.nama,
      role: user.role,
      isActive: user.isActive,
    });
    setShowModal(true);
  };

  const handleDelete = async (userId: string) => {
    if (!confirm('Yakin ingin menghapus user ini?')) return;

    try {
      const response = await fetchWithAuth(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchUsers();
      }
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const response = await fetchWithAuth(`/api/admin/users/${userId}/toggle-status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (response.ok) {
        await fetchUsers();
      }
    } catch (error) {
      console.error('Error toggling status:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      username: '',
      email: '',
      password: '',
      nama: '',
      role: 'TREASURER',
      isActive: true,
    });
    setEditingUser(null);
  };

  const columns = [
    { key: 'nama', label: 'Nama', width: '20%' },
    { key: 'username', label: 'Username', width: '15%' },
    { key: 'email', label: 'Email', width: '20%' },
    {
      key: 'role',
      label: 'Role',
      width: '12%',
      render: (item: User) => {
        const roleMap = {
          ADMIN: { label: 'Admin', color: 'primary' as const },
          TREASURER: { label: 'Bendahara', color: 'success' as const },
          HEADMASTER: { label: 'Kepsek', color: 'accent' as const },
          STUDENT: { label: 'Siswa', color: 'default' as const },
          NEW_STUDENT: { label: 'Calon Siswa', color: 'warning' as const },
        };
        const role = roleMap[item.role as keyof typeof roleMap];
        return <Badge variant={role.color}>{role.label}</Badge>;
      },
    },
    {
      key: 'isActive',
      label: 'Status',
      width: '10%',
      render: (item: User) => (
        <Badge variant={item.isActive ? 'success' : 'error'}>
          {item.isActive ? 'Aktif' : 'Non-Aktif'}
        </Badge>
      ),
    },
    {
      key: 'createdAt',
      label: 'Dibuat',
      width: '13%',
      render: (item: User) => new Date(item.createdAt).toLocaleDateString('id-ID'),
    },
  ];

  const filteredUsers = users.filter((user) => {
    const matchSearch =
      user.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.email && user.email.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchRole = roleFilter === 'all' || user.role === roleFilter;

    return matchSearch && matchRole;
  });

  return (
    <div className="min-h-screen bg-neutral-50">
      <AdminSidebar />
      <div className="ml-64">
        <AdminHeader />

        <main className="pt-16 p-8">
          <div className="max-w-7xl mx-auto">{/* Header */}
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-3xl font-bold text-neutral-900">Kelola User</h1>
                <p className="text-neutral-600 mt-1">Manajemen akun pengguna sistem</p>
              </div>
              <Button
                icon={<Plus className="w-4 h-4" />}
                onClick={() => {
                  resetForm();
                  setShowModal(true);
                }}
              >
                Tambah User
              </Button>
            </div>

          {/* Filters */}
          <Card className="mb-6">
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Cari nama, username, atau email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  icon={<Search className="w-4 h-4" />}
                />
              </div>
              <div className="w-48">
                <Select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  options={[
                    { value: 'all', label: 'Semua Role' },
                    { value: 'ADMIN', label: 'Admin' },
                    { value: 'TREASURER', label: 'Bendahara' },
                    { value: 'HEADMASTER', label: 'Kepala Sekolah' },
                    { value: 'STUDENT', label: 'Siswa' },
                    { value: 'NEW_STUDENT', label: 'Calon Siswa' },
                  ]}
                />
              </div>
            </div>
          </Card>

          {/* Table */}
          <Card padding="none">
            <Table
              columns={columns}
              data={filteredUsers}
              isLoading={isLoading}
              actions={(item) => (
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={item.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    onClick={() => toggleUserStatus(item.id, item.isActive)}
                  >
                    {item.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<Edit className="w-4 h-4" />}
                    onClick={() => handleEdit(item)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<Trash2 className="w-4 h-4" />}
                    onClick={() => handleDelete(item.id)}
                  >
                    Hapus
                  </Button>
                </div>
              )}
            />
          </Card>
        </div>
      </main>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-neutral-900 mb-6 text-xl font-bold">
              {editingUser ? 'Edit User' : 'Tambah User Baru'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Nama Lengkap"
                required
                value={formData.nama}
                onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Username"
                  required
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  disabled={!!editingUser}
                />

                <Input
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <Input
                label={editingUser ? 'Password Baru (kosongkan jika tidak diubah)' : 'Password'}
                type="password"
                required={!editingUser}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                icon={<Lock className="w-4 h-4" />}
              />

              <Select
                label="Role"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                options={[
                  { value: 'ADMIN', label: 'Admin' },
                  { value: 'TREASURER', label: 'Bendahara' },
                  { value: 'HEADMASTER', label: 'Kepala Sekolah' },
                  { value: 'STUDENT', label: 'Siswa' },
                  { value: 'NEW_STUDENT', label: 'Calon Siswa' },
                ]}
              />

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="rounded border-neutral-300 text-primary focus:ring-primary"
                />
                <label htmlFor="isActive" className="text-sm text-neutral-700">
                  Akun Aktif
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" fullWidth isLoading={isLoading}>
                  {editingUser ? 'Update' : 'Simpan'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  fullWidth
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                >
                  Batal
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
      </div>
    </div>
  );
}
