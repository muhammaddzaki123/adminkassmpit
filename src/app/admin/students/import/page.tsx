'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminHeader } from '@/components/layout/AdminHeader';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Upload, Download, CheckCircle, AlertCircle, FileSpreadsheet, ArrowLeft } from 'lucide-react';

interface ImportResult {
  success: number;
  failed: number;
  errors: { row: number; nisn: string; error: string }[];
}

export default function ImportStudentsPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
    }
  };

  const handleImport = async () => {
    if (!file) {
      alert('Pilih file Excel terlebih dahulu');
      return;
    }

    setImporting(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/admin/students/import', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
        setFile(null);
      } else {
        alert(data.message || 'Gagal import data');
      }
    } catch (error) {
      console.error('Error importing:', error);
      alert('Terjadi kesalahan saat import');
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    // Create template data
    const template = [
      ['NISN', 'Nama Lengkap', 'Kelas', 'Email', 'No Telepon', 'Alamat', 'Nama Orang Tua', 'Password'],
      ['1234567890', 'Ahmad Zaki', '7A', 'zaki@email.com', '081234567890', 'Jl. Contoh No. 1', 'Budi Santoso', 'password123'],
      ['0987654321', 'Siti Aisyah', '8B', 'aisyah@email.com', '082345678901', 'Jl. Contoh No. 2', 'Ahmad Wijaya', 'password456'],
    ];

    // Convert to CSV
    const csv = template.map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template_import_siswa.csv';
    a.click();
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <AdminSidebar />
      <div className="ml-64">
        <AdminHeader />
        <main className="pt-16 p-8">
          <div className="max-w-5xl mx-auto">
            <Button
              variant="ghost"
              icon={<ArrowLeft className="w-4 h-4" />}
              onClick={() => router.back()}
              className="mb-4"
            >
              Kembali
            </Button>

            {/* Header */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-neutral-900 mb-2">Import Siswa Massal</h1>
              <p className="text-neutral-600">Upload file CSV/Excel untuk menambahkan banyak siswa sekaligus</p>
            </div>

      {/* Instructions */}
      <Card className="p-6 mb-6 bg-blue-50 border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-3 flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          Panduan Import Data
        </h3>
        <ul className="space-y-2 text-sm text-blue-800">
          <li>• Download template Excel/CSV terlebih dahulu</li>
          <li>• Isi data siswa sesuai format template</li>
          <li>• Kolom yang wajib diisi: NISN, Nama, Kelas, Email, Password</li>
          <li>• Format NISN harus 10 digit angka (contoh: 1234567890)</li>
          <li>• Email harus unik dan valid</li>
          <li>• Password akan digunakan untuk login siswa (bisa diganti nanti)</li>
          <li>• Sistem akan otomatis membuat akun User untuk setiap siswa</li>
          <li>• Status siswa akan langsung ACTIVE (siswa bisa login)</li>
        </ul>
      </Card>

      {/* Download Template */}
      <Card className="p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <FileSpreadsheet className="w-8 h-8 text-emerald-500 mr-4" />
            <div>
              <h3 className="font-semibold text-neutral-900">Template Excel</h3>
              <p className="text-sm text-neutral-600">Download template untuk memudahkan input data</p>
            </div>
          </div>
          <Button variant="outline" onClick={downloadTemplate}>
            <Download className="w-4 h-4 mr-2" />
            Download Template
          </Button>
        </div>
      </Card>

      {/* Upload Area */}
      <Card className="p-6 mb-6">
        <div className="border-2 border-dashed border-neutral-300 rounded-lg p-8 text-center">
          <Upload className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
          
          <input
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileChange}
            className="hidden"
            id="file-upload"
          />
          
          {file ? (
            <div className="mb-4">
              <p className="text-sm text-neutral-600">File dipilih:</p>
              <p className="font-medium text-neutral-900">{file.name}</p>
              <p className="text-xs text-neutral-500">{(file.size / 1024).toFixed(2)} KB</p>
            </div>
          ) : (
            <div className="mb-4">
              <p className="text-neutral-600 mb-2">Upload file Excel atau CSV</p>
              <p className="text-sm text-neutral-500">Format: .xlsx, .xls, .csv (Max 5MB)</p>
            </div>
          )}

          <div className="flex gap-3 justify-center">
            <Button 
              variant="outline"
              onClick={() => document.getElementById('file-upload')?.click()}
            >
              {file ? 'Ganti File' : 'Pilih File'}
            </Button>
            
            {file && (
              <Button
                onClick={handleImport}
                disabled={importing}
              >
                {importing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Import Data
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Import Result */}
      {result && (
        <Card className="p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">Hasil Import</h3>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                <div className="flex items-center">
                  <CheckCircle className="w-6 h-6 text-emerald-600 mr-3" />
                  <div>
                    <p className="text-sm text-emerald-700">Berhasil</p>
                    <p className="text-2xl font-bold text-emerald-900">{result.success}</p>
                  </div>
                </div>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                  <AlertCircle className="w-6 h-6 text-red-600 mr-3" />
                  <div>
                    <p className="text-sm text-red-700">Gagal</p>
                    <p className="text-2xl font-bold text-red-900">{result.failed}</p>
                  </div>
                </div>
              </div>
            </div>

            {result.errors.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium text-neutral-900 mb-2">Detail Error:</h4>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-h-64 overflow-y-auto">
                  <ul className="space-y-2 text-sm text-red-800">
                    {result.errors.map((err, idx) => (
                      <li key={idx}>
                        <strong>Baris {err.row}</strong> (NISN: {err.nisn}): {err.error}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {result.success > 0 && (
              <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                <p className="text-sm text-emerald-800">
                  ✅ {result.success} siswa berhasil ditambahkan! Akun login sudah otomatis dibuat dan siswa bisa langsung login ke sistem.
                </p>
              </div>
            )}
          </div>
        </Card>
      )}

            {/* Info */}
            <Card className="p-6 mt-6 bg-neutral-50">
              <h3 className="font-semibold text-neutral-900 mb-3">Apa yang Terjadi Setelah Import?</h3>
              <div className="space-y-2 text-sm text-neutral-700">
                <p>✅ Setiap siswa akan dibuat record di tabel <code className="bg-neutral-200 px-1 rounded">students</code></p>
                <p>✅ Akun User dengan role STUDENT otomatis dibuat</p>
                <p>✅ Username = NISN siswa</p>
                <p>✅ Password = sesuai file Excel (bisa diganti siswa setelah login)</p>
                <p>✅ Status siswa = ACTIVE (langsung bisa login dan bayar SPP)</p>
                <p>✅ Virtual Account otomatis di-generate untuk pembayaran</p>
                <p>⚠️ NISN yang sudah ada akan di-skip (tidak akan duplikat)</p>
              </div>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
