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
import { Plus, Search, Download, Upload, Edit, Trash2, Users, BookOpen, Clock, School } from 'lucide-react';

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

  const handleArchiveStudent = async (student: Student) => {
    const confirmed = confirm(`Arsipkan siswa ${student.nama}?`);
    if (!confirmed) return;

    try {
      const response = await fetchWithAuth(`/api/admin/students/${student.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'ARCHIVED',
          reason: 'Diarsipkan dari halaman data siswa oleh admin',
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Gagal mengarsipkan siswa');
      }

      alert('Siswa berhasil diarsipkan');
      fetchStudents();
    } catch (error) {
      console.error('Failed to archive student:', error);
      alert(error instanceof Error ? error.message : 'Gagal mengarsipkan siswa');
    }
  };

  const totalActive = students.filter(s => s.status === 'ACTIVE').length;
  const totalReReg = students.filter(s => s.status === 'AWAITING_REREG').length;

  return (
    <div className="min-h-screen bg-neutral-50">
      <AdminSidebar />
      <div className="lg:ml-64">
        <AdminHeader />
        <main className="pt-16 lg:pt-20 p-3 sm:p-5 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-3 sm:space-y-5">
            {/* Page Header */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-neutral-900">Data Siswa</h1>
                <p className="mt-0.5 text-xs sm:text-sm text-neutral-600">Kelola data siswa resmi yang telah terdaftar</p>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button variant="outline" size="sm" icon={<Download className="w-4 h-4" />} className="flex-1 sm:flex-none">
                  Export
                </Button>
                <Button variant="outline" size="sm" icon={<Upload className="w-4 h-4" />} onClick={() => router.push('/admin/students/import')} className="flex-1 sm:flex-none">
                  Import
                </Button>
                <Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => router.push('/admin/students/create')} className="flex-1 sm:flex-none">
                  Tambah
                </Button>
              </div>
            </div>

            {/* Stat Cards — 2×2 grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
              <Card padding="sm">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-emerald-100 rounded-lg shrink-0">
                    <Users className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-neutral-500 truncate">Total Siswa</p>
                    <p className="text-lg sm:text-2xl font-bold text-neutral-900">{students.length}</p>
                  </div>
                </div>
              </Card>
              <Card padding="sm">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-blue-100 rounded-lg shrink-0">
                    <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-neutral-500 truncate">Siswa Aktif</p>
                    <p className="text-lg sm:text-2xl font-bold text-neutral-900">{totalActive}</p>
                  </div>
                </div>
              </Card>
              <Card padding="sm">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-amber-100 rounded-lg shrink-0">
                    <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-neutral-500 truncate">Daftar Ulang</p>
                    <p className="text-lg sm:text-2xl font-bold text-neutral-900">{totalReReg}</p>
                  </div>
                </div>
              </Card>
              <Card padding="sm">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-purple-100 rounded-lg shrink-0">
                    <School className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-neutral-500 truncate">Jml Kelas</p>
                    <p className="text-lg sm:text-2xl font-bold text-neutral-900">{uniqueKelas.length}</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Filters — Search + 2 select sejajar */}
            <Card padding="sm">
              <div className="flex flex-col gap-2 sm:flex-row">
                <div className="flex-1">
                  <Input
                    placeholder="Cari nama atau NISN..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    icon={<Search className="w-4 h-4" />}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-2">
                  <div className="sm:w-40">
                    <Select
                      value={kelasFilter}
                      onChange={(e) => setKelasFilter(e.target.value)}
                      options={[
                        { value: 'ALL', label: 'Semua Kelas' },
                        ...uniqueKelas.map(k => ({ value: k, label: k }))
                      ]}
                    />
                  </div>
                  <div className="sm:w-40">
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
              </div>
            </Card>

            {/* Student List */}
            <Card padding="none">
              {/* Desktop Table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full min-w-[560px]">
                  <thead className="bg-neutral-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Nama</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">NISN</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Kelas</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Tahun</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Jenis</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-neutral-500 uppercase">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    {isLoading ? (
                      <tr><td colSpan={7} className="px-4 py-6 text-center text-sm text-neutral-500">Memuat data...</td></tr>
                    ) : filteredStudents.length === 0 ? (
                      <tr><td colSpan={7} className="px-4 py-6 text-center text-sm text-neutral-500">Tidak ada data</td></tr>
                    ) : (
                      filteredStudents.map((student) => (
                        <tr key={student.id} className="hover:bg-neutral-50">
                          <td className="px-4 py-3 text-sm font-medium">{student.nama}</td>
                          <td className="px-4 py-3 text-sm text-neutral-600">{student.nisn}</td>
                          <td className="px-4 py-3 text-sm">{student.kelas}</td>
                          <td className="px-4 py-3 text-sm text-neutral-500">{student.academicYear}</td>
                          <td className="px-4 py-3">
                            <Badge variant={student.enrollmentType === 'NEW' ? 'primary' : 'accent'}>
                              {student.enrollmentType === 'NEW' ? 'Baru' :
                               student.enrollmentType === 'TRANSFER' ? 'Pindahan' : 'Lanjut'}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
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
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                title="Edit"
                                onClick={() => router.push(`/admin/students/${student.id}/edit`)}
                                className="p-1.5 rounded-lg hover:bg-primary-50 text-primary transition-colors"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                title="Arsipkan"
                                onClick={() => handleArchiveStudent(student)}
                                className="p-1.5 rounded-lg hover:bg-red-50 text-red-600 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card List */}
              <div className="sm:hidden">
                {isLoading ? (
                  <p className="text-center text-sm text-neutral-500 py-6">Memuat data...</p>
                ) : filteredStudents.length === 0 ? (
                  <p className="text-center text-sm text-neutral-500 py-6">Tidak ada data</p>
                ) : (
                  <div className="divide-y divide-neutral-100">
                    {filteredStudents.map((student) => (
                      <div key={student.id} className="p-3">
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <div className="min-w-0">
                            <p className="font-semibold text-sm text-neutral-900 truncate">{student.nama}</p>
                            <p className="text-xs text-neutral-500 mt-0.5">NISN: {student.nisn} · {student.kelas}</p>
                          </div>
                          <div className="flex gap-1 shrink-0">
                            <button
                              onClick={() => router.push(`/admin/students/${student.id}/edit`)}
                              className="p-1.5 rounded-lg hover:bg-primary-50 text-primary"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleArchiveStudent(student)}
                              className="p-1.5 rounded-lg hover:bg-red-50 text-red-600"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Badge variant={
                            student.status === 'ACTIVE' ? 'success' :
                            student.status === 'AWAITING_REREG' ? 'warning' :
                            student.status === 'GRADUATED' ? 'primary' : 'default'
                          }>
                            {student.status === 'ACTIVE' ? 'Aktif' :
                             student.status === 'AWAITING_REREG' ? 'Daftar Ulang' :
                             student.status === 'GRADUATED' ? 'Lulus' : 'Arsip'}
                          </Badge>
                          <Badge variant={student.enrollmentType === 'NEW' ? 'primary' : 'accent'}>
                            {student.enrollmentType === 'NEW' ? 'Baru' :
                             student.enrollmentType === 'TRANSFER' ? 'Pindahan' : 'Lanjut'}
                          </Badge>
                          <span className="text-xs text-neutral-400 ml-auto">{student.academicYear}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>

            {filteredStudents.length > 0 && (
              <p className="text-xs sm:text-sm text-neutral-500 px-1">
                Menampilkan {filteredStudents.length} dari {students.length} siswa
              </p>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
