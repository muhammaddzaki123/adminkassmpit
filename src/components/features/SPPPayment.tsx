'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Upload, CheckCircle, X, Filter, AlertCircle, Search, Eye, FileText } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { Table } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { fetchWithAuth } from '@/lib/api-client';
import { AuditPayloadViewer, type AuditRawValue } from './AuditPayloadViewer';

interface Student {
  id: string;
  nama: string;
  nisn: string;
  kelas: string;
}

interface Payment {
  id: string;
  student: {
    nama: string;
    nisn: string;
    kelas: string;
  };
  paymentType: string;
  amount: number;
  month?: number;
  year?: number;
  status: string;
  paidAt?: string;
  description?: string;
}

interface PaymentDetail extends Payment {
  paymentNumber: string;
  externalId: string | null;
  transactionId: string | null;
  adminFee: number;
  totalAmount: number;
  notes: string | null;
  receiptUrl: string | null;
  createdAt: string;
  updatedAt: string;
  billing: {
    id: string;
    billNumber: string;
    status: string;
    totalAmount: number;
    paidAmount: number;
    student: {
      id: string;
      nama: string;
      nisn: string;
      email?: string | null;
      noTelp?: string | null;
      kelas: string;
    };
  };
  paymentDetails: Array<{
    description: string;
    amount: number;
    notes?: string | null;
  }>;
  auditPayload: {
    updatedAt: string;
    events: Array<{
      source: string;
      status: string;
      message?: string | null;
      recordedAt: string;
      raw?: AuditRawValue | null;
    }>;
  } | null;
}

interface Stats {
  totalAmount: number;
  totalStudents: number;
  paidCount: number;
  pendingCount: number;
  unpaidCount: number;
}

interface FormData {
  studentId: string;
  month: string;
  year: string;
  amount: string;
  paymentMethod: string;
}

export function SPPPayment() {
  const [showModal, setShowModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [payments, setPayments] = useState<Payment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalAmount: 0,
    totalStudents: 0,
    paidCount: 0,
    pendingCount: 0,
    unpaidCount: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [detailPayment, setDetailPayment] = useState<PaymentDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<FormData>({
    studentId: '',
    month: new Date().getMonth() + 1 + '',
    year: new Date().getFullYear() + '',
    amount: '500000',
    paymentMethod: 'transfer'
  });

  const fetchPayments = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedClass !== 'all') params.append('kelas', selectedClass);
      if (selectedStatus !== 'all') params.append('status', selectedStatus);
      if (searchQuery) params.append('search', searchQuery);

      const res = await fetch(`/api/spp-payments?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setPayments(data.data);
          calculateStats(data.data);
        }
      }
    } catch (error) {
      console.error('Failed to fetch payments:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedClass, selectedStatus, searchQuery]);

  const calculateStats = (paymentsData: Payment[]) => {
    const totalAmount = paymentsData
      .filter(p => p.status === 'COMPLETED')
      .reduce((sum, p) => sum + p.amount, 0);
    
    const paidCount = paymentsData.filter(p => p.status === 'COMPLETED').length;
    const pendingCount = paymentsData.filter(p => p.status === 'PENDING').length;
    const unpaidCount = paymentsData.filter(p => !['COMPLETED', 'PENDING'].includes(p.status)).length;

    setStats({
      totalAmount,
      totalStudents: paymentsData.length,
      paidCount,
      pendingCount,
      unpaidCount
    });
  };

  const fetchStudents = async (kelas?: string) => {
    try {
      const params = new URLSearchParams();
      if (kelas) params.append('kelas', kelas);
      
      const res = await fetch(`/api/students?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setStudents(data.data);
        }
      }
    } catch (error) {
      console.error('Failed to fetch students:', error);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  useEffect(() => {
    if (showModal) {
      fetchStudents();
    }
  }, [showModal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.studentId) {
      setMessage({ type: 'error', text: 'Pilih siswa terlebih dahulu' });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      const payload = {
        studentId: formData.studentId,
        paymentType: 'SPP',
        amount: parseFloat(formData.amount),
        month: parseInt(formData.month),
        year: parseInt(formData.year),
        status: 'COMPLETED',
        paidAt: new Date().toISOString(),
        description: `Pembayaran SPP via ${formData.paymentMethod}`
      };

      const response = await fetch('/api/spp-payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessage({ type: 'success', text: 'Pembayaran berhasil disimpan!' });
        setTimeout(() => {
          setShowModal(false);
          setMessage(null);
          fetchPayments();
          resetForm();
        }, 1500);
      } else {
        setMessage({ type: 'error', text: data.error || 'Gagal menyimpan pembayaran' });
      }
    } catch (error) {
      console.error('Error submitting payment:', error);
      setMessage({ type: 'error', text: 'Terjadi kesalahan saat menyimpan pembayaran' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      studentId: '',
      month: new Date().getMonth() + 1 + '',
      year: new Date().getFullYear() + '',
      amount: '500000',
      paymentMethod: 'transfer'
    });
  };

  const getMonthName = (month: number) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
    return months[month - 1] || '-';
  };

  const openDetail = async (paymentId: string) => {
    setDetailLoading(true);
    setDetailError(null);
    setDetailPayment(null);

    try {
      const response = await fetchWithAuth(`/api/payment/${paymentId}/detail`);
      if (!response.ok) {
        const result = await response.json().catch(() => null);
        throw new Error(result?.error || `Gagal memuat detail pembayaran (${response.status})`);
      }

      const result = await response.json();
      if (result.success) {
        setDetailPayment(result.data.payment);
      } else {
        throw new Error(result.error || 'Gagal memuat detail pembayaran');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan';
      setDetailError(errorMessage);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setDetailPayment(null);
    setDetailError(null);
    setDetailLoading(false);
  };

  const columns = [
    {
      key: 'student',
      label: 'Nama Siswa',
      width: '25%',
      render: (item: Payment) => item.student?.nama || '-'
    },
    {
      key: 'kelas',
      label: 'Kelas',
      width: '10%',
      render: (item: Payment) => item.student?.kelas || '-'
    },
    {
      key: 'nisn',
      label: 'NISN',
      width: '15%',
      render: (item: Payment) => item.student?.nisn || '-'
    },
    { 
      key: 'periode', 
      label: 'Periode', 
      width: '12%',
      render: (item: Payment) => item.month && item.year ? `${getMonthName(item.month)} ${item.year}` : '-'
    },
    {
      key: 'amount',
      label: 'Nominal',
      width: '15%',
      render: (item: Payment) => `Rp ${item.amount.toLocaleString('id-ID')}`
    },
    {
      key: 'status',
      label: 'Status',
      width: '10%',
      render: (item: Payment) => (
        <Badge variant={item.status === 'COMPLETED' ? 'success' : item.status === 'PENDING' ? 'warning' : 'error'}>
          {item.status === 'COMPLETED' ? 'Lunas' : item.status === 'PENDING' ? 'Pending' : 'Belum'}
        </Badge>
      )
    },
    {
      key: 'paidAt',
      label: 'Tanggal Bayar',
      width: '13%',
      render: (item: Payment) => item.paidAt ? new Date(item.paidAt).toLocaleDateString('id-ID') : '-'
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[#1c1c1c] mb-2 text-2xl font-bold">Pencatatan Pembayaran SPP</h1>
          <p className="text-[#4b5563]">Kelola dan verifikasi pembayaran SPP siswa</p>
        </div>
        <Button variant="primary" icon={<Upload className="w-5 h-5" />} onClick={() => setShowModal(true)}>
          Input Pembayaran
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card padding="md">
          <p className="text-sm text-[#4b5563] mb-1">Total SPP Terkumpul</p>
          <h3 className="text-[#10b981] text-xl font-bold">Rp {stats.totalAmount.toLocaleString('id-ID')}</h3>
          <p className="text-xs text-[#4b5563] mt-2">{stats.totalStudents} pembayaran</p>
        </Card>
        <Card padding="md">
          <p className="text-sm text-[#4b5563] mb-1">Sudah Lunas</p>
          <h3 className="text-[#7ec242] text-xl font-bold">{stats.paidCount} Pembayaran</h3>
          <p className="text-xs text-[#4b5563] mt-2">
            {stats.totalStudents > 0 ? Math.round((stats.paidCount / stats.totalStudents) * 100) : 0}% dari total
          </p>
        </Card>
        <Card padding="md">
          <p className="text-sm text-[#4b5563] mb-1">Pending Verifikasi</p>
          <h3 className="text-[#f29a2e] text-xl font-bold">{stats.pendingCount} Pembayaran</h3>
          <p className="text-xs text-[#4b5563] mt-2">Perlu ditindaklanjuti</p>
        </Card>
        <Card padding="md">
          <p className="text-sm text-[#4b5563] mb-1">Belum Dibayar</p>
          <h3 className="text-[#ef4444] text-xl font-bold">{stats.unpaidCount} Pembayaran</h3>
          <p className="text-xs text-[#4b5563] mt-2">Tunggakan aktif</p>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex items-center gap-4">
          <Filter className="w-5 h-5 text-[#4b5563]" />
          <Select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            options={[
              { value: 'all', label: 'Semua Kelas' },
              { value: 'X-A', label: 'Kelas X-A' },
              { value: 'X-B', label: 'Kelas X-B' },
              { value: 'XI-A', label: 'Kelas XI-A' },
              { value: 'XI-B', label: 'Kelas XI-B' },
              { value: 'XII-A', label: 'Kelas XII-A' },
            ]}
            className="w-48"
          />
          <Select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            options={[
              { value: 'all', label: 'Semua Status' },
              { value: 'COMPLETED', label: 'Lunas' },
              { value: 'PENDING', label: 'Pending' },
              { value: 'FAILED', label: 'Gagal' },
            ]}
            className="w-48"
          />
          <Input
            type="search"
            placeholder="Cari nama atau NISN..."
            className="flex-1"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            icon={<Search className="w-4 h-4" />}
          />
        </div>
      </Card>

      {/* Table */}
      <Card padding="none">
        <Table
          columns={columns}
          data={payments}
          isLoading={isLoading}
          actions={(row) => (
            <div className="flex gap-2 justify-end">
              <Button
                size="sm"
                variant="outline"
                onClick={() => openDetail(row.id)}
              >
                <Eye className="w-4 h-4 mr-1" />
                Lihat Detail
              </Button>
            </div>
          )}
        />
      </Card>

      {detailPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <h3 className="text-[#1c1c1c] text-xl font-bold">Detail Pembayaran</h3>
                <p className="text-sm text-[#4b5563]">{detailPayment.paymentNumber}</p>
              </div>
              <button onClick={closeDetail} className="text-[#4b5563] hover:text-[#1c1c1c]">
                <X className="w-6 h-6" />
              </button>
            </div>

            {detailLoading ? (
              <div className="py-10 text-center text-[#4b5563]">Memuat detail...</div>
            ) : detailError ? (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">{detailError}</div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card padding="md" className="border-neutral-200">
                    <p className="text-xs uppercase tracking-[0.12em] text-[#4b5563] mb-2">Ringkasan</p>
                    <div className="space-y-2 text-sm text-[#1c1c1c]">
                      <p><span className="text-[#4b5563]">Siswa:</span> {detailPayment.billing.student.nama}</p>
                      <p><span className="text-[#4b5563]">NISN:</span> {detailPayment.billing.student.nisn}</p>
                      <p><span className="text-[#4b5563]">Kelas:</span> {detailPayment.billing.student.kelas}</p>
                      <p><span className="text-[#4b5563]">Status:</span> {detailPayment.status}</p>
                      <p><span className="text-[#4b5563]">Metode:</span> {detailPayment.paymentType}</p>
                      <p><span className="text-[#4b5563]">Nominal:</span> Rp {detailPayment.amount.toLocaleString('id-ID')}</p>
                      <p><span className="text-[#4b5563]">Bayar pada:</span> {detailPayment.paidAt ? new Date(detailPayment.paidAt).toLocaleString('id-ID') : '-'}</p>
                    </div>
                  </Card>

                  <Card padding="md" className="border-neutral-200">
                    <p className="text-xs uppercase tracking-[0.12em] text-[#4b5563] mb-2">Audit Ringkas</p>
                    <div className="space-y-2 text-sm text-[#1c1c1c]">
                      <p><span className="text-[#4b5563]">Notes:</span> {detailPayment.notes || '-'}</p>
                      <p><span className="text-[#4b5563]">No. Tagihan:</span> {detailPayment.billing.billNumber}</p>
                      <p><span className="text-[#4b5563]">Status Tagihan:</span> {detailPayment.billing.status}</p>
                      <p><span className="text-[#4b5563]">External ID:</span> {detailPayment.externalId || '-'}</p>
                      <p><span className="text-[#4b5563]">Transaction ID:</span> {detailPayment.transactionId || '-'}</p>
                      <p><span className="text-[#4b5563]">Updated:</span> {new Date(detailPayment.updatedAt).toLocaleString('id-ID')}</p>
                    </div>
                  </Card>
                </div>

                <Card padding="md" className="border-neutral-200">
                  <div className="flex items-center gap-2 mb-4">
                    <FileText className="w-4 h-4 text-[#4b5563]" />
                    <h4 className="font-semibold text-[#1c1c1c]">Riwayat Audit Pembayaran</h4>
                  </div>
                  <AuditPayloadViewer payload={detailPayment.auditPayload} />
                </Card>

                <Card padding="md" className="border-neutral-200">
                  <h4 className="font-semibold text-[#1c1c1c] mb-3">Detail Item Pembayaran</h4>
                  <div className="space-y-2 text-sm">
                    {detailPayment.paymentDetails.length > 0 ? detailPayment.paymentDetails.map((item, index) => (
                      <div key={`${item.description}-${index}`} className="flex items-center justify-between gap-4 rounded-lg border border-neutral-200 px-3 py-2">
                        <div>
                          <p className="font-medium text-[#1c1c1c]">{item.description}</p>
                          {item.notes && <p className="text-xs text-[#4b5563]">{item.notes}</p>}
                        </div>
                        <p className="font-semibold text-[#1c1c1c]">Rp {item.amount.toLocaleString('id-ID')}</p>
                      </div>
                    )) : (
                      <p className="text-[#4b5563]">Tidak ada detail tambahan.</p>
                    )}
                  </div>
                </Card>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Input Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <Card className="w-full max-w-2xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-[#1c1c1c] text-2xl font-bold">Input Pembayaran SPP</h3>
              </div>
              <button onClick={() => { setShowModal(false); setMessage(null); }} className="text-[#4b5563] hover:text-[#1c1c1c]">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Message Alert */}
            {message && (
              <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
                message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-800'
              }`}>
                {message.type === 'success' ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <AlertCircle className="w-5 h-5" />
                )}
                <span className="text-sm">{message.text}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Grid Layout - Simple */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Siswa */}
                <div className="md:col-span-2">
                  <Select
                    label="Nama Siswa"
                    value={formData.studentId}
                    onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                    options={[
                      { value: '', label: '-- Pilih Siswa --' },
                      ...students.map(s => ({
                        value: s.id,
                        label: `${s.nama} (${s.nisn}) - ${s.kelas}`
                      }))
                    ]}
                    required
                  />
                </div>

                {/* Nominal */}
                <Input
                  type="number"
                  label="Nominal (Rp)"
                  placeholder="500000"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                />

                {/* Bulan */}
                <Select
                  label="Bulan"
                  value={formData.month}
                  onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                  options={[
                    { value: '1', label: 'Januari' },
                    { value: '2', label: 'Februari' },
                    { value: '3', label: 'Maret' },
                    { value: '4', label: 'April' },
                    { value: '5', label: 'Mei' },
                    { value: '6', label: 'Juni' },
                    { value: '7', label: 'Juli' },
                    { value: '8', label: 'Agustus' },
                    { value: '9', label: 'September' },
                    { value: '10', label: 'Oktober' },
                    { value: '11', label: 'November' },
                    { value: '12', label: 'Desember' },
                  ]}
                  required
                />

                {/* Tahun */}
                <Select
                  label="Tahun"
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                  options={[
                    { value: '2023', label: '2023' },
                    { value: '2024', label: '2024' },
                    { value: '2025', label: '2025' },
                    { value: '2026', label: '2026' },
                  ]}
                  required
                />

                {/* Metode */}
                <Select
                  label="Metode Pembayaran"
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                  options={[
                    { value: 'transfer', label: 'Transfer Bank' },
                    { value: 'tunai', label: 'Tunai' },
                    { value: 'ewallet', label: 'E-Wallet' },
                    { value: 'va', label: 'Virtual Account' },
                  ]}
                  required
                />
              </div>

              {/* Preview Data */}
              {formData.studentId && (
                <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <p className="text-xs text-blue-600 font-medium">TOTAL</p>
                      <p className="text-lg font-bold text-blue-900">Rp {parseFloat(formData.amount || '0').toLocaleString('id-ID')}</p>
                    </div>
                    <div>
                      <p className="text-xs text-blue-600 font-medium">PERIODE</p>
                      <p className="text-sm font-bold text-blue-900">{getMonthName(parseInt(formData.month))} {formData.year}</p>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-xs text-blue-600 font-medium">SISWA</p>
                      <p className="text-sm font-bold text-blue-900">{students.find(s => s.id === formData.studentId)?.nama}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  fullWidth 
                  onClick={() => { setShowModal(false); setMessage(null); }}
                  disabled={isSubmitting}
                >
                  Batal
                </Button>
                <Button 
                  type="submit" 
                  variant="primary" 
                  fullWidth 
                  disabled={isSubmitting || !formData.studentId}
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
