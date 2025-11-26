'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Upload, CheckCircle, X, Filter } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { Table } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';

interface Payment {
  id: string;
  student: {
    nama: string;
    nisn: string;
    kelas: string;
  };
  bulan: string;
  nominal: number;
  status: string;
  tanggalBayar?: string;
}

export function SPPPayment() {
  const [showModal, setShowModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPayments = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedClass !== 'all') params.append('kelas', selectedClass);
      if (selectedStatus !== 'all') params.append('status', selectedStatus);

      const res = await fetch(`/api/spp-payments?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setPayments(data);
      }
    } catch (error) {
      console.error('Failed to fetch payments:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedClass, selectedStatus]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

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
    { key: 'bulan', label: 'Bulan', width: '15%' },
    {
      key: 'nominal',
      label: 'Nominal',
      width: '15%',
      render: (item: Payment) => `Rp ${item.nominal.toLocaleString('id-ID')}`
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
      key: 'tanggalBayar',
      label: 'Tanggal Bayar',
      width: '10%',
      render: (item: Payment) => item.tanggalBayar ? new Date(item.tanggalBayar).toLocaleDateString() : '-'
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
          <h3 className="text-[#10b981] text-xl font-bold">Rp 67.000.000</h3>
          <p className="text-xs text-[#4b5563] mt-2">350 siswa aktif</p>
        </Card>
        <Card padding="md">
          <p className="text-sm text-[#4b5563] mb-1">Sudah Lunas</p>
          <h3 className="text-[#7ec242] text-xl font-bold">305 Siswa</h3>
          <p className="text-xs text-[#4b5563] mt-2">87% dari total</p>
        </Card>
        <Card padding="md">
          <p className="text-sm text-[#4b5563] mb-1">Pending Verifikasi</p>
          <h3 className="text-[#f29a2e] text-xl font-bold">34 Siswa</h3>
          <p className="text-xs text-[#4b5563] mt-2">Perlu ditindaklanjuti</p>
        </Card>
        <Card padding="md">
          <p className="text-sm text-[#4b5563] mb-1">Belum Dibayar</p>
          <h3 className="text-[#ef4444] text-xl font-bold">11 Siswa</h3>
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
              <Button variant="ghost" size="sm">Detail</Button>
              {row.status === 'PENDING' && (
                <Button variant="primary" size="sm">Verifikasi</Button>
              )}
            </div>
          )}
        />
      </Card>

      {/* Input Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[#1c1c1c] text-xl font-bold">Input Pembayaran SPP</h3>
              <button onClick={() => setShowModal(false)} className="text-[#4b5563] hover:text-[#1c1c1c]">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Kelas"
                  options={[
                    { value: '', label: 'Pilih Kelas' },
                    { value: 'X-A', label: 'Kelas X-A' },
                    { value: 'X-B', label: 'Kelas X-B' },
                  ]}
                />
                <Select
                  label="Nama Siswa"
                  options={[
                    { value: '', label: 'Pilih Siswa' },
                    { value: '1', label: 'Ahmad Zaki Mubarak' },
                  ]}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Bulan"
                  options={[
                    { value: '', label: 'Pilih Bulan' },
                    { value: 'nov', label: 'November 2024' },
                    { value: 'des', label: 'Desember 2024' },
                  ]}
                />
                <Input
                  type="number"
                  label="Nominal"
                  placeholder="500000"
                  defaultValue="500000"
                />
              </div>

              <Select
                label="Metode Pembayaran"
                options={[
                  { value: '', label: 'Pilih Metode' },
                  { value: 'transfer', label: 'Transfer Bank' },
                  { value: 'tunai', label: 'Tunai' },
                  { value: 'ewallet', label: 'E-Wallet' },
                ]}
              />

              <div>
                <label className="block text-sm mb-2 text-neutral-600">Upload Bukti Transfer</label>
                <div className="border-2 border-dashed border-[#d1d5db] rounded-xl p-8 text-center hover:border-[#7ec242] transition-colors cursor-pointer">
                  <Upload className="w-12 h-12 text-[#4b5563] mx-auto mb-3" />
                  <p className="text-sm text-[#4b5563]">Klik untuk upload atau drag & drop</p>
                  <p className="text-xs text-[#4b5563] mt-1">PNG, JPG atau PDF (Max. 5MB)</p>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" fullWidth onClick={() => setShowModal(false)}>
                  Batal
                </Button>
                <Button type="submit" variant="primary" fullWidth icon={<CheckCircle className="w-5 h-5" />}>
                  Simpan Pembayaran
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
