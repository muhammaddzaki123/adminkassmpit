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

  return (
    <div className="min-h-screen bg-neutral-50">
      <AdminSidebar />
      <div className="ml-64">
        <AdminHeader />
        <main className="pt-16 p-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-3xl font-bold text-neutral-900">Kelola Calon Siswa</h1>
                <p className="text-neutral-600 mt-1">Verifikasi dan approve pendaftaran siswa baru</p>
              </div>
              <Button icon={<Plus className="w-4 h-4" />} onClick={() => router.push('/admin/students/create')}>
                Tambah Siswa Langsung
              </Button>
            </div>

            <div className="grid grid-cols-4 gap-4 mb-6">
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-amber-100 rounded-lg">
                    <Clock className="w-6 h-6 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm text-neutral-600">Menunggu</p>
                    <p className="text-2xl font-bold">{students.filter(s => s.approvalStatus === 'PENDING').length}</p>
                  </div>
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <FileText className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-neutral-600">Sudah Bayar</p>
                    <p className="text-2xl font-bold">{students.filter(s => s.registrationPaid).length}</p>
                  </div>
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-emerald-100 rounded-lg">
                    <CheckCircle className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm text-neutral-600">Diterima</p>
                    <p className="text-2xl font-bold">{students.filter(s => s.approvalStatus === 'APPROVED').length}</p>
                  </div>
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-red-100 rounded-lg">
                    <XCircle className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm text-neutral-600">Ditolak</p>
                    <p className="text-2xl font-bold">{students.filter(s => s.approvalStatus === 'REJECTED').length}</p>
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
                <div className="w-56">
                  <Select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    options={[
                      { value: 'ALL', label: 'Semua Status' },
                      { value: 'PENDING', label: 'Menunggu Approval' },
                      { value: 'APPROVED', label: 'Diterima' },
                      { value: 'REJECTED', label: 'Ditolak' },
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
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Nama</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">NISN</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Kelas</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Jenis</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Bayar</th>
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
                        <tr key={student.id}>
                          <td className="px-6 py-4">{student.nama}</td>
                          <td className="px-6 py-4">{student.nisn}</td>
                          <td className="px-6 py-4">{student.kelasYangDituju}</td>
                          <td className="px-6 py-4">
                            <Badge variant={student.enrollmentType === 'NEW' ? 'primary' : 'accent'}>
                              {student.enrollmentType === 'NEW' ? 'Baru' : 'Pindahan'}
                            </Badge>
                          </td>
                          <td className="px-6 py-4">
                            <Badge variant={student.registrationPaid ? 'success' : 'error'}>
                              {student.registrationPaid ? 'Lunas' : 'Belum'}
                            </Badge>
                          </td>
                          <td className="px-6 py-4">
                            <Badge variant={
                              student.approvalStatus === 'APPROVED' ? 'success' :
                              student.approvalStatus === 'REJECTED' ? 'error' : 'warning'
                            }>
                              {student.approvalStatus === 'APPROVED' ? 'Diterima' :
                               student.approvalStatus === 'REJECTED' ? 'Ditolak' : 'Pending'}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex gap-2 justify-end">
                              {student.approvalStatus === 'PENDING' && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    icon={<CheckCircle className="w-4 h-4" />}
                                    onClick={() => handleApprove(student)}
                                    disabled={!student.registrationPaid}
                                  >
                                    Terima
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    icon={<XCircle className="w-4 h-4" />}
                                    onClick={() => {
                                      setSelectedStudent(student);
                                      setShowRejectModal(true);
                                    }}
                                  >
                                    Tolak
                                  </Button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </main>

        {/* Approve Modal */}
        {showApproveModal && selectedStudent && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md">
              <h3 className="text-xl font-bold mb-4">Terima Calon Siswa</h3>
              <p className="text-neutral-600 mb-4">
                Menerima <strong>{selectedStudent.nama}</strong> sebagai siswa resmi?
              </p>
              <Input
                label="Kelas"
                placeholder="Contoh: 7A, 8B"
                value={kelas}
                onChange={(e) => setKelas(e.target.value)}
                required
              />
              <div className="flex gap-3 mt-6">
                <Button onClick={submitApproval} isLoading={isLoading} fullWidth>
                  Terima Siswa
                </Button>
                <Button variant="outline" fullWidth onClick={() => setShowApproveModal(false)}>
                  Batal
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Reject Modal */}
        {showRejectModal && selectedStudent && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md">
              <h3 className="text-xl font-bold mb-4">Tolak Pendaftaran</h3>
              <p className="text-neutral-600 mb-4">
                Menolak pendaftaran <strong>{selectedStudent.nama}</strong>?
              </p>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Alasan Penolakan *
                </label>
                <textarea
                  className="w-full p-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  rows={4}
                  placeholder="Jelaskan alasan penolakan..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  required
                />
              </div>
              <div className="flex gap-3 mt-6">
                <Button onClick={submitRejection} isLoading={isLoading} fullWidth variant="outline">
                  Tolak Pendaftaran
                </Button>
                <Button variant="outline" fullWidth onClick={() => setShowRejectModal(false)}>
                  Batal
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
