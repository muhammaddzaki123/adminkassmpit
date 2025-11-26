'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Upload, Calendar, TrendingDown, Loader2 } from 'lucide-react';
import { Card, StatCard } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select, TextArea } from '@/components/ui/Input';
import { Table } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';

export function Expenses() {
  const [showModal, setShowModal] = useState(false);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      const res = await fetch('/api/expenses');
      if (res.ok) {
        const data = await res.json();
        setExpenses(data);
      }
    } catch (error) {
      console.error('Failed to fetch expenses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const columns = [
    {
      key: 'date',
      label: 'Tanggal',
      width: '12%',
      render: (item: any) => new Date(item.date).toLocaleDateString()
    },
    { key: 'category', label: 'Kategori', width: '12%' },
    { key: 'description', label: 'Keterangan', width: '35%' },
    {
      key: 'amount',
      label: 'Nominal',
      width: '15%',
      render: (item: any) => `Rp ${item.amount.toLocaleString('id-ID')}`
    },
    {
      key: 'status',
      label: 'Status',
      width: '12%',
      render: (item: any) => (
        <Badge variant={item.status === 'APPROVED' ? 'success' : 'warning'}>
          {item.status}
        </Badge>
      )
    },
    {
      key: 'receipt',
      label: 'Nota',
      width: '8%',
      render: (item: any) => item.receipt ? '✓' : '-'
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[#1c1c1c] mb-2 text-2xl font-bold">Pengeluaran Sekolah</h1>
          <p className="text-[#4b5563]">Kelola dan catat pengeluaran operasional</p>
        </div>
        <Button variant="primary" icon={<Plus className="w-5 h-5" />} onClick={() => setShowModal(true)}>
          Tambah Pengeluaran
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title="Total Pengeluaran Bulan Ini"
          value="Rp 45 Juta"
          icon={<TrendingDown className="w-6 h-6" />}
          color="warning"
        />
        <Card padding="md">
          <p className="text-sm text-[#4b5563] mb-1">Kategori Terbesar</p>
          <h3 className="text-[#1c1c1c] text-xl font-bold">Gaji Guru</h3>
          <p className="text-xs text-[#4b5563] mt-2">Rp 45.000.000</p>
        </Card>
        <Card padding="md">
          <p className="text-sm text-[#4b5563] mb-1">Pending Approval</p>
          <h3 className="text-[#f29a2e] text-xl font-bold">1 Item</h3>
          <p className="text-xs text-[#4b5563] mt-2">Perlu verifikasi</p>
        </Card>
        <Card padding="md">
          <p className="text-sm text-[#4b5563] mb-1">Sisa Anggaran</p>
          <h3 className="text-[#10b981] text-xl font-bold">Rp 22 Juta</h3>
          <p className="text-xs text-[#4b5563] mt-2">Dari Rp 67 Juta</p>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex items-center gap-4">
          <Calendar className="w-5 h-5 text-[#4b5563]" />
          <Select
            options={[
              { value: 'this-month', label: 'Bulan Ini' },
              { value: 'last-month', label: 'Bulan Lalu' },
              { value: 'this-year', label: 'Tahun Ini' },
              { value: 'custom', label: 'Custom Range' },
            ]}
            className="w-48"
          />
          <Select
            options={[
              { value: 'all', label: 'Semua Kategori' },
              { value: 'GAJI', label: 'Gaji' },
              { value: 'ATK', label: 'ATK' },
              { value: 'UTILITAS', label: 'Utilitas' },
              { value: 'PEMELIHARAAN', label: 'Pemeliharaan' },
            ]}
            className="w-48"
          />
        </div>
      </Card>

      {/* Table */}
      <Card padding="none">
        <Table
          columns={columns}
          data={expenses}
          isLoading={isLoading}
          actions={(row) => (
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" size="sm">Edit</Button>
              <Button variant="ghost" size="sm">Nota</Button>
            </div>
          )}
        />
      </Card>

      {/* Input Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-[#1c1c1c] mb-6 text-xl font-bold">Tambah Pengeluaran</h3>

            <form className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  type="date"
                  label="Tanggal"
                  defaultValue="2024-11-24"
                />
                <Select
                  label="Kategori"
                  options={[
                    { value: '', label: 'Pilih Kategori' },
                    { value: 'GAJI', label: 'Gaji' },
                    { value: 'ATK', label: 'ATK' },
                    { value: 'UTILITAS', label: 'Utilitas' },
                    { value: 'PEMELIHARAAN', label: 'Pemeliharaan' },
                    { value: 'OPERASIONAL', label: 'Operasional' },
                    { value: 'LAINNYA', label: 'Lain-lain' },
                  ]}
                />
              </div>

              <TextArea
                label="Keterangan"
                placeholder="Deskripsi pengeluaran..."
                rows={3}
              />

              <Input
                type="number"
                label="Nominal"
                placeholder="0"
              />

              <div>
                <label className="block text-sm mb-2 text-[#374151]">Upload Nota/Bukti</label>
                <div className="border-2 border-dashed border-[#d1d5db] rounded-xl p-8 text-center hover:border-[#7ec242] transition-colors cursor-pointer">
                  <Upload className="w-12 h-12 text-[#4b5563] mx-auto mb-3" />
                  <p className="text-sm text-[#4b5563]">Klik untuk upload atau drag & drop</p>
                  <p className="text-xs text-[#4b5563] mt-1">PNG, JPG atau PDF (Max. 5MB)</p>
                </div>
              </div>

              <div className="bg-[#dbeafe] border border-[#3b82f6] rounded-xl p-4">
                <p className="text-sm text-[#1e40af]">
                  💡 Saldo akan otomatis dihitung setelah pengeluaran disimpan
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" fullWidth onClick={() => setShowModal(false)}>
                  Batal
                </Button>
                <Button type="submit" variant="primary" fullWidth>
                  Simpan Pengeluaran
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
