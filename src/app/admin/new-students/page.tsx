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
import { Plus, Search, CheckCircle, XCircle, Clock, FileText } from 'lucide-react';

interface NewStudent {
  id: string;
  nama: string;
  nisn: string;
  email: string | null;
  noTelp: string | null;
  kelasYangDituju: string;
  enrollmentType: string;
  registrationPaid: boolean;
  approvalStatus: string;
}

export default function NewStudentsPage() {
  const router = useRouter();
  const [students, setStudents] = useState<NewStudent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [selectedStudent, setSelectedStudent] = useState<NewStudent | null>(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [kelas, setKelas] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    fetchStudents();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const fetchStudents = async () => {
    setIsLoading(true);
    try {
      const url = statusFilter === 'ALL'
        ? '/api/admin/new-students'
        : `/api/admin/new-students?status=${statusFilter}`;

      const response = await fetchWithAuth(url);
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

  const handleApprove = (student: NewStudent) => {
    setSelectedStudent(student);
    setKelas(student.kelasYangDituju);
    setShowApproveModal(true);
  };

  const submitApproval = async () => {
    if (!selectedStudent || !kelas) {
      alert('Kelas harus ditentukan');
      return;
    }

    setIsLoading(true);
    try {
      const userData = localStorage.getItem('user');
      const adminId = userData ? JSON.parse(userData).id : '';

      const response = await fetchWithAuth(`/api/admin/new-students/${selectedStudent.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId, kelas }),
      });

      if (response.ok) {
        const result = await response.json();
        alert(
          `✅ Calon siswa berhasil diterima!\n\n` +
          `Username: ${result.data.credentials.username}\n` +
          `Password: ${result.data.credentials.password}\n\n` +
          `Harap berikan informasi ini kepada siswa.`
        );
        setShowApproveModal(false);
        fetchStudents();
      } else {
        alert('Gagal approve siswa');
      }
    } catch (error) {
      console.error('Error approving:', error);
      alert('Terjadi kesalahan');
    } finally {
      setIsLoading(false);
    }
  };

  const submitRejection = async () => {
    if (!selectedStudent || !rejectionReason) {
      alert('Alasan penolakan harus diisi');
      return;
    }

    setIsLoading(true);
    try {
      const userData = localStorage.getItem('user');
      const adminId = userData ? JSON.parse(userData).id : '';

      const response = await fetchWithAuth(`/api/admin/new-students/${selectedStudent.id}/approve`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId, rejectionReason }),
      });

      if (response.ok) {
        alert('Pendaftaran ditolak');
        setShowRejectModal(false);
        fetchStudents();
      } else {
        alert('Gagal reject siswa');
      }
    } catch (error) {
      console.error('Error rejecting:', error);
      alert('Terjadi kesalahan');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredStudents = students.filter((student) =>
    student.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.nisn.includes(searchQuery)
  );

  // Stat counts (selalu dari seluruh data, bukan filtered)
  const pending = students.filter(s => s.approvalStatus === 'PENDING').length;
  const paid = students.filter(s => s.registrationPaid).length;
  const approved = students.filter(s => s.approvalStatus === 'APPROVED').length;
  const rejected = students.filter(s => s.approvalStatus === 'REJECTED').length;

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
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-neutral-900">Calon Siswa</h1>
                <p className="mt-0.5 text-xs sm:text-sm text-neutral-600">Verifikasi dan approve pendaftaran siswa baru</p>
              </div>
              <Button
                icon={<Plus className="w-4 h-4" />}
                onClick={() => router.push('/admin/students/create')}
                className="w-full sm:w-auto"
              >
                Tambah Langsung
              </Button>
            </div>

            {/* Stat Cards — 2×2 grid di mobile */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
              {/* Menunggu */}
              <button
                onClick={() => setStatusFilter('PENDING')}
                className={`rounded-xl border p-3 sm:p-4 text-left transition-all hover:shadow-md ${statusFilter === 'PENDING' ? 'border-amber-400 bg-amber-50 ring-2 ring-amber-300' : 'border-neutral-200 bg-white'}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 sm:p-2 bg-amber-100 rounded-lg">
                    <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" />
                  </div>
                </div>
                <p className="text-xl sm:text-2xl font-bold text-neutral-900">{pending}</p>
                <p className="text-[11px] sm:text-sm text-neutral-600 mt-0.5">Menunggu</p>
              </button>

              {/* Sudah Bayar */}
              <div className="rounded-xl border border-neutral-200 bg-white p-3 sm:p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg">
                    <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                  </div>
                </div>
                <p className="text-xl sm:text-2xl font-bold text-neutral-900">{paid}</p>
                <p className="text-[11px] sm:text-sm text-neutral-600 mt-0.5">Sudah Bayar</p>
              </div>

              {/* Diterima */}
              <button
                onClick={() => setStatusFilter('APPROVED')}
                className={`rounded-xl border p-3 sm:p-4 text-left transition-all hover:shadow-md ${statusFilter === 'APPROVED' ? 'border-emerald-400 bg-emerald-50 ring-2 ring-emerald-300' : 'border-neutral-200 bg-white'}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 sm:p-2 bg-emerald-100 rounded-lg">
                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
                  </div>
                </div>
                <p className="text-xl sm:text-2xl font-bold text-neutral-900">{approved}</p>
                <p className="text-[11px] sm:text-sm text-neutral-600 mt-0.5">Diterima</p>
              </button>

              {/* Ditolak */}
              <button
                onClick={() => setStatusFilter('REJECTED')}
                className={`rounded-xl border p-3 sm:p-4 text-left transition-all hover:shadow-md ${statusFilter === 'REJECTED' ? 'border-red-400 bg-red-50 ring-2 ring-red-300' : 'border-neutral-200 bg-white'}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 sm:p-2 bg-red-100 rounded-lg">
                    <XCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
                  </div>
                </div>
                <p className="text-xl sm:text-2xl font-bold text-neutral-900">{rejected}</p>
                <p className="text-[11px] sm:text-sm text-neutral-600 mt-0.5">Ditolak</p>
              </button>
            </div>

            {/* Filter & Search */}
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
                <div className="w-full sm:w-48">
                  <Select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    options={[
                      { value: 'ALL', label: 'Semua Status' },
                      { value: 'PENDING', label: 'Menunggu' },
                      { value: 'APPROVED', label: 'Diterima' },
                      { value: 'REJECTED', label: 'Ditolak' },
                    ]}
                  />
                </div>
              </div>
            </Card>

            {/* Student List — card list di mobile, tabel di desktop */}
            <Card padding="none">
              {/* Desktop Table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full min-w-[560px]">
                  <thead className="bg-neutral-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Nama</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">NISN</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Kelas</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Bayar</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-neutral-500 uppercase">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    {isLoading ? (
                      <tr><td colSpan={6} className="px-4 py-6 text-center text-neutral-500 text-sm">Memuat data...</td></tr>
                    ) : filteredStudents.length === 0 ? (
                      <tr><td colSpan={6} className="px-4 py-6 text-center text-neutral-500 text-sm">Tidak ada data</td></tr>
                    ) : (
                      filteredStudents.map((student) => (
                        <tr key={student.id} className="hover:bg-neutral-50">
                          <td className="px-4 py-3 text-sm font-medium">{student.nama}</td>
                          <td className="px-4 py-3 text-sm text-neutral-600">{student.nisn}</td>
                          <td className="px-4 py-3 text-sm">{student.kelasYangDituju}</td>
                          <td className="px-4 py-3">
                            <Badge variant={student.registrationPaid ? 'success' : 'error'}>
                              {student.registrationPaid ? 'Lunas' : 'Belum'}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={
                              student.approvalStatus === 'APPROVED' ? 'success' :
                              student.approvalStatus === 'REJECTED' ? 'error' : 'warning'
                            }>
                              {student.approvalStatus === 'APPROVED' ? 'Diterima' :
                               student.approvalStatus === 'REJECTED' ? 'Ditolak' : 'Pending'}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-right">
                            {student.approvalStatus === 'PENDING' && (
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  title="Terima"
                                  onClick={() => handleApprove(student)}
                                  disabled={!student.registrationPaid}
                                  className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </button>
                                <button
                                  title="Tolak"
                                  onClick={() => { setSelectedStudent(student); setShowRejectModal(true); }}
                                  className="p-1.5 rounded-lg hover:bg-red-50 text-red-600 transition-colors"
                                >
                                  <XCircle className="w-4 h-4" />
                                </button>
                              </div>
                            )}
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
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="min-w-0">
                            <p className="font-semibold text-sm text-neutral-900 truncate">{student.nama}</p>
                            <p className="text-xs text-neutral-500 mt-0.5">NISN: {student.nisn} · Kelas: {student.kelasYangDituju}</p>
                          </div>
                          <div className="flex gap-1 flex-shrink-0">
                            <Badge variant={
                              student.approvalStatus === 'APPROVED' ? 'success' :
                              student.approvalStatus === 'REJECTED' ? 'error' : 'warning'
                            }>
                              {student.approvalStatus === 'APPROVED' ? 'Diterima' :
                               student.approvalStatus === 'REJECTED' ? 'Ditolak' : 'Pending'}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <Badge variant={student.registrationPaid ? 'success' : 'error'}>
                            {student.registrationPaid ? '✓ Lunas' : '✗ Belum Bayar'}
                          </Badge>
                          {student.approvalStatus === 'PENDING' && (
                            <div className="flex gap-1.5">
                              <button
                                onClick={() => handleApprove(student)}
                                disabled={!student.registrationPaid}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed"
                              >
                                <CheckCircle className="w-3.5 h-3.5" />
                                Terima
                              </button>
                              <button
                                onClick={() => { setSelectedStudent(student); setShowRejectModal(true); }}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-50 text-red-700 text-xs font-medium"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                Tolak
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </div>
        </main>

        {/* Approve Modal — slide up dari bawah di mobile */}
        {showApproveModal && selectedStudent && (
          <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50">
            <Card className="w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl !rounded-b-none sm:!rounded-b-2xl">
              <div className="p-4 sm:p-6">
                <h3 className="text-lg font-bold mb-3">Terima Calon Siswa</h3>
                <p className="text-sm text-neutral-600 mb-4">
                  Menerima <strong>{selectedStudent.nama}</strong> sebagai siswa resmi?
                </p>
                <Input
                  label="Kelas"
                  placeholder="Contoh: 7A, 8B"
                  value={kelas}
                  onChange={(e) => setKelas(e.target.value)}
                  required
                />
                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <Button onClick={submitApproval} isLoading={isLoading} fullWidth>
                    Terima Siswa
                  </Button>
                  <Button variant="outline" fullWidth onClick={() => setShowApproveModal(false)}>
                    Batal
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Reject Modal — slide up dari bawah di mobile */}
        {showRejectModal && selectedStudent && (
          <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50">
            <Card className="w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl !rounded-b-none sm:!rounded-b-2xl">
              <div className="p-4 sm:p-6">
                <h3 className="text-lg font-bold mb-3">Tolak Pendaftaran</h3>
                <p className="text-sm text-neutral-600 mb-4">
                  Menolak pendaftaran <strong>{selectedStudent.nama}</strong>?
                </p>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                    Alasan Penolakan *
                  </label>
                  <textarea
                    className="w-full p-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm resize-none"
                    rows={3}
                    placeholder="Jelaskan alasan penolakan..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    required
                  />
                </div>
                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <Button onClick={submitRejection} isLoading={isLoading} fullWidth variant="outline">
                    Tolak Pendaftaran
                  </Button>
                  <Button variant="outline" fullWidth onClick={() => setShowRejectModal(false)}>
                    Batal
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
