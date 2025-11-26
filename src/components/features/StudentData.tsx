'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Upload, Download, Users, Search } from 'lucide-react';
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
  status: string;
  sppStatus: string;
  daftarUlangStatus: string;
}

export function StudentData() {
  const [showImportModal, setShowImportModal] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const res = await fetch('/api/students');
      if (res.ok) {
        const data = await res.json();
        setStudents(data);
      }
    } catch (error) {
      console.error('Failed to fetch students:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const columns = [
    { key: 'nama', label: 'Nama Siswa', width: '25%' },
    { key: 'nisn', label: 'NISN', width: '15%' },
    { key: 'kelas', label: 'Kelas', width: '10%' },
    {
      key: 'status',
      label: 'Status',
      width: '12%',
      render: (item: Student) => (
        <Badge variant={item.status === 'ACTIVE' ? 'success' : 'default'}>
          {item.status}
        </Badge>
      )
    },
    {
      key: 'sppStatus',
      label: 'SPP',
      width: '12%',
      render: (item: Student) => (
        <Badge variant={item.sppStatus === 'PAID' ? 'success' : 'error'}>
          {item.sppStatus === 'PAID' ? 'Lunas' : 'Tunggakan'}
        </Badge>
      )
    },
    {
      key: 'daftarUlangStatus',
      label: 'Daftar Ulang',
      width: '12%',
      render: (item: Student) => (
        <Badge variant={item.daftarUlangStatus === 'PAID' ? 'success' : item.daftarUlangStatus === 'PENDING' ? 'warning' : 'error'}>
          {item.daftarUlangStatus === 'PAID' ? 'Lunas' : item.daftarUlangStatus === 'PENDING' ? 'Cicilan' : 'Belum'}
        </Badge>
      )
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[#1c1c1c] mb-2 text-2xl font-bold">Data Siswa</h1>
          <p className="text-[#4b5563]">Kelola data siswa dan status pembayaran</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" icon={<Download className="w-5 h-5" />}>
            Export Excel
          </Button>
          <Button variant="accent" icon={<Upload className="w-5 h-5" />} onClick={() => setShowImportModal(true)}>
            Import Excel
          </Button>
          <Button variant="primary" icon={<Plus className="w-5 h-5" />}>
            Tambah Siswa
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card padding="md">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-linear-to-br from-[#7ec242] to-[#4c7924] rounded-xl flex items-center justify-center text-white">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-[#4b5563] mb-1">Total Siswa Aktif</p>
              <h3 className="text-[#1c1c1c] text-xl font-bold">{students.length}</h3>
            </div>
          </div>
        </Card>
        {/* Placeholder stats */}
        <Card padding="md">
          <p className="text-sm text-[#4b5563] mb-1">Kelas X</p>
          <h3 className="text-[#1c1c1c] text-xl font-bold">120 Siswa</h3>
          <p className="text-xs text-[#4b5563] mt-2">4 kelas paralel</p>
        </Card>
        <Card padding="md">
          <p className="text-sm text-[#4b5563] mb-1">Kelas XI</p>
          <h3 className="text-[#1c1c1c] text-xl font-bold">115 Siswa</h3>
          <p className="text-xs text-[#4b5563] mt-2">4 kelas paralel</p>
        </Card>
        <Card padding="md">
          <p className="text-sm text-[#4b5563] mb-1">Kelas XII</p>
          <h3 className="text-[#1c1c1c] text-xl font-bold">115 Siswa</h3>
          <p className="text-xs text-[#4b5563] mt-2">4 kelas paralel</p>
        </Card>
      </div>

      {/* Filters & Search */}
      <Card>
        <div className="flex items-center gap-4">
          <Search className="w-5 h-5 text-[#4b5563]" />
          <Input
            type="search"
            placeholder="Cari nama atau NISN..."
            className="flex-1"
          />
          <Select
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
            options={[
              { value: 'all', label: 'Semua Status' },
              { value: 'ACTIVE', label: 'Aktif' },
              { value: 'GRADUATED', label: 'Lulus' },
              { value: 'ARCHIVED', label: 'Arsip' },
            ]}
            className="w-48"
          />
        </div>
      </Card>

      {/* Table */}
      <Card padding="none">
        <Table
          columns={columns}
          data={students}
          isLoading={isLoading}
          actions={() => (
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" size="sm">Detail</Button>
              <Button variant="ghost" size="sm">Edit</Button>
            </div>
          )}
        />
      </Card>

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl">
            <h3 className="text-[#1c1c1c] mb-6 text-xl font-bold">Import Data Siswa</h3>

            <div className="space-y-6">
              {/* Instructions */}
              <div className="bg-[#dbeafe] border border-[#3b82f6] rounded-xl p-4">
                <h5 className="text-[#1e40af] mb-2 font-medium">📋 Instruksi Import</h5>
                <ol className="text-sm text-[#1e40af] space-y-1 list-decimal list-inside">
                  <li>Download template Excel terlebih dahulu</li>
                  <li>Isi data siswa sesuai format template</li>
                  <li>Upload file Excel yang sudah diisi</li>
                  <li>Sistem akan memvalidasi dan import data</li>
                </ol>
              </div>

              {/* Download Template */}
              <div className="text-center">
                <Button variant="outline" icon={<Download className="w-5 h-5" />}>
                  Download Template Excel
                </Button>
              </div>

              {/* Upload Area */}
              <div>
                <label className="block text-sm mb-2 text-neutral-600">Upload File Excel</label>
                <div className="border-2 border-dashed border-[#d1d5db] rounded-xl p-12 text-center hover:border-[#7ec242] transition-colors cursor-pointer">
                  <Upload className="w-16 h-16 text-[#4b5563] mx-auto mb-4" />
                  <h4 className="text-[#1c1c1c] mb-2 font-medium">Klik untuk upload atau drag & drop</h4>
                  <p className="text-sm text-[#4b5563]">Format: .xlsx atau .xls (Max. 10MB)</p>
                  <p className="text-xs text-[#4b5563] mt-2">Maksimal 1000 siswa per upload</p>
                </div>
              </div>

              {/* Archive Option */}
              <div className="flex items-center gap-3 p-4 bg-[#f5f6f7] rounded-xl">
                <input
                  type="checkbox"
                  id="archive-graduated"
                  className="rounded border-[#d1d5db]"
                />
                <label htmlFor="archive-graduated" className="text-sm text-[#1c1c1c] cursor-pointer">
                  Otomatis arsipkan siswa yang sudah lulus
                </label>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button type="button" variant="outline" fullWidth onClick={() => setShowImportModal(false)}>
                  Batal
                </Button>
                <Button type="button" variant="primary" fullWidth icon={<Upload className="w-5 h-5" />}>
                  Import Data
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
