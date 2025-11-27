'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  GraduationCap,
  CheckCircle,
  Clock,
  Upload,
  DollarSign,
  FileText,
  LogOut,
  User,
  Phone,
  Mail,
  MapPin,
} from 'lucide-react';

interface NewStudentData {
  id: string;
  nama: string;
  nisn: string;
  email: string | null;
  noTelp: string | null;
  alamat: string | null;
  kelasYangDituju: string;
  academicYear: string;
  enrollmentType: string;
  registrationDate: string;
  registrationFee: number;
  registrationPaid: boolean;
  paidAt: string | null;
  approvalStatus: string;
  approvedAt: string | null;
  rejectionReason: string | null;
  // Dokumen
  fotoSiswa: string | null;
  aktaKelahiran: string | null;
  kartuKeluarga: string | null;
  ijazahSebelumnya: string | null;
}

export default function NewStudentDashboard() {
  const router = useRouter();
  const [data, setData] = useState<NewStudentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/calon-siswa/profile');
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/calon-siswa/login');
          return;
        }
        throw new Error('Gagal memuat data');
      }
      const result = await response.json();
      setData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/calon-siswa/logout', { method: 'POST' });
    router.push('/calon-siswa/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat data...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center">
          <p className="text-red-600 mb-4">{error || 'Data tidak ditemukan'}</p>
          <Button onClick={() => router.push('/calon-siswa/login')}>
            Kembali ke Login
          </Button>
        </Card>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <Badge variant="success">Diterima</Badge>;
      case 'REJECTED':
        return <Badge variant="error">Ditolak</Badge>;
      default:
        return <Badge variant="warning">Menunggu Verifikasi</Badge>;
    }
  };

  const getPaymentStatusBadge = (paid: boolean) => {
    return paid ? (
      <Badge variant="success">Lunas</Badge>
    ) : (
      <Badge variant="error">Belum Bayar</Badge>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <GraduationCap className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Portal Calon Siswa</h1>
                <p className="text-sm text-gray-600">Dashboard Pendaftaran</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <Card className="mb-6 p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Selamat Datang, {data.nama}!
              </h2>
              <p className="text-gray-600 mb-4">
                NISN: {data.nisn} • Tahun Ajaran: {data.academicYear}
              </p>
              <div className="flex items-center gap-4">
                <div>
                  <span className="text-sm text-gray-600 mr-2">Status Pendaftaran:</span>
                  {getStatusBadge(data.approvalStatus)}
                </div>
                <div>
                  <span className="text-sm text-gray-600 mr-2">Status Pembayaran:</span>
                  {getPaymentStatusBadge(data.registrationPaid)}
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Rejection Notice */}
        {data.approvalStatus === 'REJECTED' && data.rejectionReason && (
          <Card className="mb-6 p-6 border-red-200 bg-red-50">
            <h3 className="font-semibold text-red-900 mb-2">
              Pendaftaran Ditolak
            </h3>
            <p className="text-red-700">{data.rejectionReason}</p>
            <p className="text-sm text-red-600 mt-2">
              Silakan hubungi admin untuk informasi lebih lanjut.
            </p>
          </Card>
        )}

        {/* Timeline Status */}
        <Card className="mb-6 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            Status Proses Pendaftaran
          </h3>
          
          <div className="space-y-6">
            {/* Step 1: Registrasi */}
            <div className="flex items-start">
              <div className="shrink-0">
                <div className="flex items-center justify-center w-10 h-10 bg-emerald-100 rounded-full">
                  <CheckCircle className="w-6 h-6 text-emerald-600" />
                </div>
              </div>
              <div className="ml-4 flex-1">
                <h4 className="text-sm font-semibold text-gray-900">Pendaftaran Akun</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Berhasil pada {new Date(data.registrationDate).toLocaleDateString('id-ID')}
                </p>
              </div>
            </div>

            {/* Step 2: Upload Dokumen */}
            <div className="flex items-start">
              <div className="shrink-0">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                  data.fotoSiswa && data.aktaKelahiran && data.kartuKeluarga
                    ? 'bg-emerald-100'
                    : 'bg-amber-100'
                }`}>
                  {data.fotoSiswa && data.aktaKelahiran && data.kartuKeluarga ? (
                    <CheckCircle className="w-6 h-6 text-emerald-600" />
                  ) : (
                    <Clock className="w-6 h-6 text-amber-600" />
                  )}
                </div>
              </div>
              <div className="ml-4 flex-1">
                <h4 className="text-sm font-semibold text-gray-900">Upload Dokumen</h4>
                <p className="text-sm text-gray-600 mt-1">
                  {data.fotoSiswa && data.aktaKelahiran && data.kartuKeluarga
                    ? 'Dokumen lengkap'
                    : 'Harap lengkapi dokumen'}
                </p>
              </div>
            </div>

            {/* Step 3: Pembayaran */}
            <div className="flex items-start">
              <div className="shrink-0">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                  data.registrationPaid ? 'bg-emerald-100' : 'bg-amber-100'
                }`}>
                  {data.registrationPaid ? (
                    <CheckCircle className="w-6 h-6 text-emerald-600" />
                  ) : (
                    <Clock className="w-6 h-6 text-amber-600" />
                  )}
                </div>
              </div>
              <div className="ml-4 flex-1">
                <h4 className="text-sm font-semibold text-gray-900">Pembayaran Pendaftaran</h4>
                <p className="text-sm text-gray-600 mt-1">
                  {data.registrationPaid
                    ? `Lunas pada ${data.paidAt ? new Date(data.paidAt).toLocaleDateString('id-ID') : '-'}`
                    : `Biaya: Rp ${data.registrationFee.toLocaleString('id-ID')}`}
                </p>
              </div>
            </div>

            {/* Step 4: Verifikasi Admin */}
            <div className="flex items-start">
              <div className="shrink-0">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                  data.approvalStatus === 'APPROVED'
                    ? 'bg-emerald-100'
                    : data.approvalStatus === 'REJECTED'
                    ? 'bg-red-100'
                    : 'bg-gray-100'
                }`}>
                  {data.approvalStatus === 'APPROVED' ? (
                    <CheckCircle className="w-6 h-6 text-emerald-600" />
                  ) : (
                    <Clock className="w-6 h-6 text-gray-400" />
                  )}
                </div>
              </div>
              <div className="ml-4 flex-1">
                <h4 className="text-sm font-semibold text-gray-900">Verifikasi Admin</h4>
                <p className="text-sm text-gray-600 mt-1">
                  {data.approvalStatus === 'APPROVED'
                    ? `Diterima pada ${data.approvedAt ? new Date(data.approvedAt).toLocaleDateString('id-ID') : '-'}`
                    : data.approvalStatus === 'REJECTED'
                    ? 'Pendaftaran ditolak'
                    : 'Menunggu verifikasi admin'}
                </p>
              </div>
            </div>
          </div>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Data Pribadi */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <User className="w-5 h-5 mr-2" />
              Data Pribadi
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Nama Lengkap</p>
                <p className="font-medium">{data.nama}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">NISN</p>
                <p className="font-medium">{data.nisn}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Kelas yang Dituju</p>
                <p className="font-medium">{data.kelasYangDituju}</p>
              </div>
              {data.email && (
                <div className="flex items-center text-sm">
                  <Mail className="w-4 h-4 mr-2 text-gray-400" />
                  <span>{data.email}</span>
                </div>
              )}
              {data.noTelp && (
                <div className="flex items-center text-sm">
                  <Phone className="w-4 h-4 mr-2 text-gray-400" />
                  <span>{data.noTelp}</span>
                </div>
              )}
              {data.alamat && (
                <div className="flex items-start text-sm">
                  <MapPin className="w-4 h-4 mr-2 text-gray-400 mt-0.5" />
                  <span>{data.alamat}</span>
                </div>
              )}
            </div>
          </Card>

          {/* Quick Actions */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Menu Aksi Cepat
            </h3>
            <div className="space-y-3">
              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={() => router.push('/calon-siswa/dokumen')}
              >
                <Upload className="w-5 h-5 mr-3" />
                Upload Dokumen
              </Button>
              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={() => router.push('/calon-siswa/pembayaran')}
                disabled={data.registrationPaid}
              >
                <DollarSign className="w-5 h-5 mr-3" />
                {data.registrationPaid ? 'Pembayaran Lunas' : 'Bayar Pendaftaran'}
              </Button>
              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={() => router.push('/calon-siswa/profil')}
              >
                <FileText className="w-5 h-5 mr-3" />
                Lihat Profil Lengkap
              </Button>
            </div>
          </Card>
        </div>

        {/* Info Box */}
        {data.approvalStatus === 'APPROVED' && (
          <Card className="mt-6 p-6 bg-emerald-50 border-emerald-200">
            <h3 className="font-semibold text-emerald-900 mb-2">
              Selamat! Pendaftaran Anda Diterima
            </h3>
            <p className="text-emerald-700 mb-4">
              Anda telah resmi menjadi siswa SMPIT. Admin akan menghubungi Anda untuk informasi lebih lanjut mengenai orientasi dan jadwal masuk.
            </p>
            <p className="text-sm text-emerald-600">
              Silakan tunggu informasi lebih lanjut dari pihak sekolah.
            </p>
          </Card>
        )}
      </main>
    </div>
  );
}
