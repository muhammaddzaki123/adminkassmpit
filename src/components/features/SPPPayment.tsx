'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Upload, CheckCircle, X, Filter, AlertCircle, Search } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { Table } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';

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
      .filter(p => p.status === 'PAID')
      .reduce((sum, p) => sum + p.amount, 0);
    
    const paidCount = paymentsData.filter(p => p.status === 'PAID').length;
    const pendingCount = paymentsData.filter(p => p.status === 'PENDING').length;
    const unpaidCount = paymentsData.filter(p => p.status === 'UNPAID').length;

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
        status: 'PAID',
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
        <Badge variant={item.status === 'PAID' ? 'success' : item.status === 'PENDING' ? 'warning' : 'error'}>
          {item.status === 'PAID' ? 'Lunas' : item.status === 'PENDING' ? 'Pending' : 'Belum'}
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
              { value: 'PAID', label: 'Lunas' },
              { value: 'PENDING', label: 'Pending' },
              { value: 'UNPAID', label: 'Belum Dibayar' },
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
              {row.description && (
                <span className="text-xs text-neutral-600 mr-2">{row.description}</span>
              )}
            </div>
          )}
        />
      </Card>

      {/* Input Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[#1c1c1c] text-xl font-bold">Input Pembayaran SPP</h3>
              <button onClick={() => { setShowModal(false); setMessage(null); }} className="text-[#4b5563] hover:text-[#1c1c1c]">
                <X className="w-6 h-6" />
              </button>
            </div>

            {message && (
              <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${
                message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
              }`}>
                {message.type === 'success' ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <AlertCircle className="w-5 h-5" />
                )}
                <span>{message.text}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Pilih Siswa"
                  value={formData.studentId}
                  onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                  options={[
                    { value: '', label: 'Pilih Siswa' },
                    ...students.map(s => ({
                      value: s.id,
                      label: `${s.nama} - ${s.kelas}`
                    }))
                  ]}
                  required
                />
                <Input
                  type="number"
                  label="Nominal"
                  placeholder="500000"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
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
              </div>

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
                  icon={<CheckCircle className="w-5 h-5" />}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Pembayaran'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
