'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { CheckCircle, Clock, AlertCircle, Loader } from 'lucide-react';

interface RegistrationStatus {
  nisn: string;
  nama: string;
  kelas: string;
  registrationFee: number;
  registrationPaid: boolean;
  status: string;
  approvalStatus: string;
  virtualAccount: string;
}

export default function RegistrationStatusPage() {
  const [status, setStatus] = useState<RegistrationStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/registration/status');
      if (!response.ok) {
        throw new Error(`Failed to fetch status: ${response.status}`);
      }
      if (!response.headers.get('content-type')?.includes('application/json')) {
        throw new Error('Expected JSON response');
      }
      const data = await response.json();
      setStatus(data);
    } catch (error) {
      console.error('Error fetching status:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-emerald-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 text-emerald-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Memuat status pendaftaran...</p>
        </div>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="min-h-screen bg-linear-to-br from-emerald-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Data Tidak Ditemukan</h1>
          <p className="text-gray-600 mb-6">Status pendaftaran Anda tidak dapat dimuat</p>
          <Button variant="primary" onClick={() => window.location.href = '/register/student'}>
            Daftar Sekarang
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-emerald-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full p-8">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <Clock className="w-10 h-10 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Status Pendaftaran</h1>
          <p className="text-gray-600">SMPiT Arrasyid - Tahun Ajaran 2024/2025</p>
        </div>

        {/* Student Info */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">NISN</p>
              <p className="font-semibold text-gray-900">{status.nisn}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Nama Lengkap</p>
              <p className="font-semibold text-gray-900">{status.nama}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Kelas</p>
              <p className="font-semibold text-gray-900">{status.kelas}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Virtual Account</p>
              <p className="font-semibold font-mono text-gray-900">{status.virtualAccount}</p>
            </div>
          </div>
        </div>

        {/* Status Timeline */}
        <div className="space-y-4 mb-6">
          {/* Step 1: Registration */}
          <div className="flex items-start">
            <div className="shrink-0">
              <div className="flex items-center justify-center w-8 h-8 bg-emerald-100 rounded-full">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
            <div className="ml-4 flex-1">
              <h3 className="text-sm font-semibold text-gray-900">Registrasi Berhasil</h3>
              <p className="text-sm text-gray-600">Akun Anda telah dibuat</p>
            </div>
            <Badge variant="success">Selesai</Badge>
          </div>

          {/* Step 2: Payment */}
          <div className="flex items-start">
            <div className="shrink-0">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                status.registrationPaid ? 'bg-emerald-100' : 'bg-amber-100'
              }`}>
                {status.registrationPaid ? (
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                ) : (
                  <Clock className="w-5 h-5 text-amber-600" />
                )}
              </div>
            </div>
            <div className="ml-4 flex-1">
              <h3 className="text-sm font-semibold text-gray-900">Pembayaran</h3>
              <p className="text-sm text-gray-600">
                {status.registrationPaid 
                  ? `Rp ${status.registrationFee.toLocaleString()} - Lunas`
                  : `Transfer Rp ${status.registrationFee.toLocaleString()} ke VA ${status.virtualAccount}`
                }
              </p>
            </div>
            <Badge variant={status.registrationPaid ? 'success' : 'warning'}>
              {status.registrationPaid ? 'Lunas' : 'Menunggu'}
            </Badge>
          </div>

          {/* Step 3: Admin Approval */}
          <div className="flex items-start">
            <div className="shrink-0">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                status.approvalStatus === 'APPROVED' 
                  ? 'bg-emerald-100' 
                  : status.approvalStatus === 'REJECTED'
                  ? 'bg-red-100'
                  : 'bg-gray-100'
              }`}>
                {status.approvalStatus === 'APPROVED' ? (
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                ) : status.approvalStatus === 'REJECTED' ? (
                  <AlertCircle className="w-5 h-5 text-red-600" />
                ) : (
                  <Clock className="w-5 h-5 text-gray-400" />
                )}
              </div>
            </div>
            <div className="ml-4 flex-1">
              <h3 className="text-sm font-semibold text-gray-900">Verifikasi Admin</h3>
              <p className="text-sm text-gray-600">
                {status.approvalStatus === 'APPROVED'
                  ? 'Pendaftaran Anda telah disetujui!'
                  : status.approvalStatus === 'REJECTED'
                  ? 'Pendaftaran ditolak, silakan hubungi admin'
                  : 'Menunggu verifikasi dari admin sekolah'
                }
              </p>
            </div>
            <Badge 
              variant={
                status.approvalStatus === 'APPROVED' 
                  ? 'success' 
                  : status.approvalStatus === 'REJECTED'
                  ? 'error'
                  : 'default'
              }
            >
              {status.approvalStatus === 'APPROVED' 
                ? 'Disetujui' 
                : status.approvalStatus === 'REJECTED'
                ? 'Ditolak'
                : 'Pending'
              }
            </Badge>
          </div>
        </div>

        {/* Info Box */}
        {status.approvalStatus === 'PENDING' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-blue-600 mr-3 shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-1">Informasi:</p>
                {!status.registrationPaid ? (
                  <p>Silakan lakukan pembayaran terlebih dahulu agar pendaftaran Anda dapat diproses oleh admin.</p>
                ) : (
                  <p>Pembayaran Anda sudah diterima. Admin akan segera memverifikasi pendaftaran Anda. Anda akan menerima notifikasi setelah pendaftaran disetujui.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {status.approvalStatus === 'APPROVED' && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <CheckCircle className="w-5 h-5 text-emerald-600 mr-3 shrink-0 mt-0.5" />
              <div className="text-sm text-emerald-800">
                <p className="font-semibold mb-1">Selamat! 🎉</p>
                <p>Pendaftaran Anda telah disetujui. Anda sekarang dapat login ke portal siswa dan melakukan pembayaran daftar ulang.</p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3">
          {status.approvalStatus === 'APPROVED' ? (
            <>
              <Button 
                variant="primary" 
                className="w-full"
                onClick={() => window.location.href = '/student/login'}
              >
                Login ke Portal Siswa
              </Button>
              <p className="text-center text-sm text-gray-600">
                Gunakan <strong>NISN</strong> dan <strong>password</strong> yang Anda buat saat registrasi
              </p>
            </>
          ) : (
            <>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => fetchStatus()}
              >
                Refresh Status
              </Button>
              <p className="text-center text-sm text-gray-600">
                Butuh bantuan? Hubungi admin sekolah
              </p>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}
