'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { fetchWithAuth } from '@/lib/api-client';
import { AdminHeader } from '@/components/layout/AdminHeader';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Plus, Search, Download, Upload, Edit, Trash2 } from 'lucide-react';

interface Student {
  id: string;
  nama: string;
  nisn: string;
  kelas: string;
  status: string;
  email: string | null;
  noTelp: string | null;
  enrollmentType: string | null;
  academicYear: string;
}

export default function AdminStudentsPage() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [kelasFilter, setKelasFilter] = useState('ALL');

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    setIsLoading(true);
    try {
      const response = await fetchWithAuth('/api/students');
      if (response.ok) {
        const result = await response.json();
        setStudents(result.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch students:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredStudents = students.filter((student) => {
    const matchesSearch = searchQuery === '' || 
      student.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.nisn.includes(searchQuery);
    
    const matchesStatus = statusFilter === 'ALL' || student.status === statusFilter;
    const matchesKelas = kelasFilter === 'ALL' || student.kelas === kelasFilter;
    
    return matchesSearch && matchesStatus && matchesKelas;
  });

  const uniqueKelas = Array.from(new Set(students.map(s => s.kelas).filter(k => k && k.trim()))).sort();

  return (
    <div className="min-h-screen bg-neutral-50">
      <AdminSidebar />
      <div className="ml-64">
        <AdminHeader />
        <main className="pt-16 p-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-3xl font-bold text-neutral-900">Data Siswa</h1>
                <p className="text-neutral-600 mt-1">Kelola data siswa resmi yang telah terdaftar</p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" icon={<Download className="w-4 h-4" />}>
                  Export Data
                </Button>
                <Button variant="outline" icon={<Upload className="w-4 h-4" />} onClick={() => router.push('/admin/students/import')}>
                  Import Data
                </Button>
                <Button icon={<Plus className="w-4 h-4" />} onClick={() => router.push('/admin/students/create')}>
                  Tambah Siswa
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4 mb-6">
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-emerald-100 rounded-lg">
                    <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-neutral-600">Total Siswa</p>
                    <p className="text-2xl font-bold">{students.length}</p>
                  </div>
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-neutral-600">Siswa Aktif</p>
                    <p className="text-2xl font-bold">{students.filter(s => s.status === 'ACTIVE').length}</p>
                  </div>
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-amber-100 rounded-lg">
                    <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-neutral-600">Daftar Ulang</p>
                    <p className="text-2xl font-bold">{students.filter(s => s.status === 'AWAITING_REREG').length}</p>
                  </div>
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-neutral-600">Jumlah Kelas</p>
                    <p className="text-2xl font-bold">{uniqueKelas.length}</p>
                  </div>
                </div>
              </Card>
            </div>

            <Card className="mb-6">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Cari nama atau NISN..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    icon={<Search className="w-4 h-4" />}
                  />
                </div>
                <div className="w-48">
                  <Select
                    value={kelasFilter}
                    onChange={(e) => setKelasFilter(e.target.value)}
                    options={[
                      { value: 'ALL', label: 'Semua Kelas' },
                      ...uniqueKelas.map(k => ({ value: k, label: k }))
                    ]}
                  />
                </div>
                <div className="w-48">
                  <Select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    options={[
                      { value: 'ALL', label: 'Semua Status' },
                      { value: 'ACTIVE', label: 'Aktif' },
                      { value: 'AWAITING_REREG', label: 'Daftar Ulang' },
                      { value: 'GRADUATED', label: 'Lulus' },
                      { value: 'ARCHIVED', label: 'Arsip' },
                    ]}
                  />
                </div>
              </div>
            </Card>

            <Card padding="none">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-neutral-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">NISN</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Nama</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Kelas</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Tahun Ajaran</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Jenis</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    {isLoading ? (
                      <tr><td colSpan={7} className="px-6 py-4 text-center text-neutral-500">Loading...</td></tr>
                    ) : filteredStudents.length === 0 ? (
                      <tr><td colSpan={7} className="px-6 py-4 text-center text-neutral-500">Tidak ada data</td></tr>
                    ) : (
                      filteredStudents.map((student) => (
                        <tr key={student.id} className="hover:bg-neutral-50">
                          <td className="px-6 py-4 text-sm">{student.nisn}</td>
                          <td className="px-6 py-4 text-sm font-medium">{student.nama}</td>
                          <td className="px-6 py-4 text-sm">{student.kelas}</td>
                          <td className="px-6 py-4 text-sm">{student.academicYear}</td>
                          <td className="px-6 py-4">
                            <Badge variant={student.enrollmentType === 'NEW' ? 'primary' : 'accent'}>
                              {student.enrollmentType === 'NEW' ? 'Baru' : 
                               student.enrollmentType === 'TRANSFER' ? 'Pindahan' : 'Lanjut'}
                            </Badge>
                          </td>
                          <td className="px-6 py-4">
                            <Badge variant={
                              student.status === 'ACTIVE' ? 'success' :
                              student.status === 'AWAITING_REREG' ? 'warning' :
                              student.status === 'GRADUATED' ? 'primary' : 'default'
                            }>
                              {student.status === 'ACTIVE' ? 'Aktif' :
                               student.status === 'AWAITING_REREG' ? 'Daftar Ulang' :
                               student.status === 'GRADUATED' ? 'Lulus' : 'Arsip'}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex gap-2 justify-end">
                              <Button
                                variant="ghost"
                                size="sm"
                                icon={<Edit className="w-4 h-4" />}
                                onClick={() => router.push(`/admin/students/${student.id}/edit`)}
                              >
                                Edit
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                icon={<Trash2 className="w-4 h-4 text-red-600" />}
                                onClick={() => {
                                  if (confirm(`Hapus siswa ${student.nama}?`)) {
                                    // TODO: Implement delete
                                    alert('Fitur hapus akan segera tersedia');
                                  }
                                }}
                              >
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>

            {filteredStudents.length > 0 && (
              <div className="flex justify-between items-center mt-4">
                <p className="text-sm text-neutral-600">
                  Menampilkan {filteredStudents.length} dari {students.length} siswa
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
