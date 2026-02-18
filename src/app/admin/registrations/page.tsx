'use client';

import { useState, useEffect, useCallback } from 'react';
import { fetchWithAuth } from '@/lib/api-client';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { CheckCircle, XCircle, Clock, Search, AlertCircle, Eye } from 'lucide-react';

interface Registration {
  id: string;
  nisn: string;
  nama: string;
  kelas: string;
  email: string;
  noTelp: string;
  alamat: string;
  namaOrangTua: string;
  registrationDate: string;
  registrationFee: number;
  registrationPaid: boolean;
  status: 'PENDING_REGISTRATION' | 'ACTIVE' | 'REJECTED';
  virtualAccount?: string;
}

export default function AdminRegistrationsPage() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [filteredData, setFilteredData] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PAID' | 'UNPAID' | 'APPROVED' | 'REJECTED'>('ALL');
  const [selectedRegistration, setSelectedRegistration] = useState<Registration | null>(null);

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const filterData = useCallback(() => {
    let filtered = registrations;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (reg) =>
          reg.nisn.toLowerCase().includes(searchQuery.toLowerCase()) ||
          reg.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
          reg.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter === 'PAID') {
      filtered = filtered.filter((reg) => reg.registrationPaid && reg.status === 'PENDING_REGISTRATION');
    } else if (statusFilter === 'UNPAID') {
      filtered = filtered.filter((reg) => !reg.registrationPaid && reg.status === 'PENDING_REGISTRATION');
    } else if (statusFilter === 'APPROVED') {
      filtered = filtered.filter((reg) => reg.status === 'ACTIVE');
    } else if (statusFilter === 'REJECTED') {
      filtered = filtered.filter((reg) => reg.status === 'REJECTED');
    }

    setFilteredData(filtered);
  }, [searchQuery, statusFilter, registrations]);

  useEffect(() => {
    filterData();
  }, [filterData]);

  const fetchRegistrations = async () => {
    setLoading(true);
    try {
      const response = await fetchWithAuth('/api/admin/registrations');
      const data = await response.json();
      setRegistrations(data);
    } catch (error) {
      console.error('Error fetching registrations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    if (!confirm('Setujui pendaftaran siswa ini?')) return;

    try {
      const response = await fetchWithAuth(`/api/admin/registrations/${id}/approve`, {
        method: 'PUT',
      });

      if (response.ok) {
        alert('Siswa berhasil disetujui! Akun siswa sudah aktif.');
        fetchRegistrations();
      } else {
        alert('Gagal menyetujui siswa');
      }
    } catch (error) {
      console.error('Error approving:', error);
      alert('Terjadi kesalahan');
    }
  };

  const handleReject = async (id: string) => {
    const reason = prompt('Alasan penolakan:');
    if (!reason) return;

    try {
      const response = await fetchWithAuth(`/api/admin/registrations/${id}/reject`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });

      if (response.ok) {
        alert('Pendaftaran ditolak');
        fetchRegistrations();
      } else {
        alert('Gagal menolak pendaftaran');
      }
    } catch (error) {
      console.error('Error rejecting:', error);
      alert('Terjadi kesalahan');
    }
  };

  const stats = {
    total: registrations.length,
    paid: registrations.filter((r) => r.registrationPaid && r.status === 'PENDING_REGISTRATION').length,
    unpaid: registrations.filter((r) => !r.registrationPaid && r.status === 'PENDING_REGISTRATION').length,
    approved: registrations.filter((r) => r.status === 'ACTIVE').length,
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Memuat data pendaftaran...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Pendaftaran Siswa Baru</h1>
        <p className="text-gray-600">Kelola dan setujui pendaftaran siswa baru</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Pendaftar</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <Clock className="w-8 h-8 text-blue-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Sudah Bayar</p>
              <p className="text-2xl font-bold text-emerald-600">{stats.paid}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-emerald-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Belum Bayar</p>
              <p className="text-2xl font-bold text-amber-600">{stats.unpaid}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-amber-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Disetujui</p>
              <p className="text-2xl font-bold text-blue-600">{stats.approved}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-blue-500" />
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Cari NISN, nama, atau email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant={statusFilter === 'ALL' ? 'primary' : 'outline'}
              onClick={() => setStatusFilter('ALL')}
            >
              Semua
            </Button>
            <Button
              variant={statusFilter === 'PAID' ? 'primary' : 'outline'}
              onClick={() => setStatusFilter('PAID')}
            >
              Sudah Bayar
            </Button>
            <Button
              variant={statusFilter === 'UNPAID' ? 'primary' : 'outline'}
              onClick={() => setStatusFilter('UNPAID')}
            >
              Belum Bayar
            </Button>
            <Button
              variant={statusFilter === 'APPROVED' ? 'primary' : 'outline'}
              onClick={() => setStatusFilter('APPROVED')}
            >
              Disetujui
            </Button>
          </div>
        </div>
      </Card>

      {/* Registrations Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  NISN
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nama Siswa
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kelas
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pembayaran
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500">Tidak ada data pendaftaran</p>
                  </td>
                </tr>
              ) : (
                filteredData.map((reg) => (
                  <tr key={reg.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {reg.nisn}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {reg.nama}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {reg.kelas}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {reg.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {reg.registrationPaid ? (
                        <Badge variant="success">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Lunas
                        </Badge>
                      ) : (
                        <Badge variant="warning">
                          <Clock className="w-3 h-3 mr-1" />
                          Belum Bayar
                        </Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {reg.status === 'ACTIVE' ? (
                        <Badge variant="success">Disetujui</Badge>
                      ) : reg.status === 'REJECTED' ? (
                        <Badge variant="error">Ditolak</Badge>
                      ) : (
                        <Badge variant="warning">Pending</Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedRegistration(reg)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {reg.status === 'PENDING_REGISTRATION' && reg.registrationPaid && (
                          <>
                            <Button
                              size="sm"
                              variant="primary"
                              onClick={() => handleApprove(reg.id)}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Setujui
                            </Button>
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() => handleReject(reg.id)}
                            >
                              <XCircle className="w-4 h-4 mr-1" />
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

      {/* Detail Modal */}
      {selectedRegistration && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="max-w-2xl w-full mx-4 p-6">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-bold text-gray-900">Detail Pendaftaran</h2>
              <Button variant="outline" size="sm" onClick={() => setSelectedRegistration(null)}>
                ✕
              </Button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">NISN</p>
                  <p className="font-medium">{selectedRegistration.nisn}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Nama Lengkap</p>
                  <p className="font-medium">{selectedRegistration.nama}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Kelas</p>
                  <p className="font-medium">{selectedRegistration.kelas}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-medium">{selectedRegistration.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">No. Telepon</p>
                  <p className="font-medium">{selectedRegistration.noTelp}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Nama Orang Tua</p>
                  <p className="font-medium">{selectedRegistration.namaOrangTua}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-gray-600">Alamat</p>
                  <p className="font-medium">{selectedRegistration.alamat}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Biaya Pendaftaran</p>
                  <p className="font-medium">Rp {selectedRegistration.registrationFee.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Virtual Account</p>
                  <p className="font-medium font-mono">{selectedRegistration.virtualAccount || '-'}</p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex gap-2 justify-end">
              {selectedRegistration.status === 'PENDING_REGISTRATION' && selectedRegistration.registrationPaid && (
                <>
                  <Button variant="primary" onClick={() => {
                    handleApprove(selectedRegistration.id);
                    setSelectedRegistration(null);
                  }}>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Setujui Pendaftaran
                  </Button>
                  <Button variant="danger" onClick={() => {
                    handleReject(selectedRegistration.id);
                    setSelectedRegistration(null);
                  }}>
                    <XCircle className="w-4 h-4 mr-2" />
                    Tolak Pendaftaran
                  </Button>
                </>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
