'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TreasurerSidebar } from '@/components/layout/TreasurerSidebar';
import { TreasurerHeader } from '@/components/layout/TreasurerHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { Plus, Search, Calendar, Download, CheckCircle, AlertCircle } from 'lucide-react';

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
  paidAt: string;
  description?: string;
}

interface FormData {
  studentId: string;
  studentName: string;
  paymentType: string;
  amount: string;
  month: string;
  year: string;
  paidAt: string;
  description: string;
}

export default function PaymentPage() {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [showStudentList, setShowStudentList] = useState(false);
  const [recentPayments, setRecentPayments] = useState<Payment[]>([]);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const [formData, setFormData] = useState<FormData>({
    studentId: '',
    studentName: '',
    paymentType: 'SPP',
    amount: '',
    month: new Date().getMonth() + 1 + '',
    year: new Date().getFullYear() + '',
    paidAt: new Date().toISOString().split('T')[0],
    description: ''
  });

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/auth/login');
      return;
    }

    const user = JSON.parse(userData);
    if (user.role !== 'TREASURER') {
      router.push('/auth/login');
      return;
    }

    fetchRecentPayments();
  }, [router]);

  const fetchRecentPayments = async () => {
    try {
      const response = await fetch('/api/spp-payments?limit=10');
      if (!response.ok) {
        throw new Error(`Failed to fetch payments: ${response.status}`);
      }
      if (!response.headers.get('content-type')?.includes('application/json')) {
        throw new Error('Expected JSON from payments API');
      }
      const data = await response.json();
      if (data.success) {
        setRecentPayments(data.data);
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
    }
  };

  const searchStudents = async (query: string) => {
    if (query.length < 2) {
      setStudents([]);
      return;
    }

    try {
      const response = await fetch(`/api/students?search=${query}`);
      if (!response.ok) {
        throw new Error(`Failed to search students: ${response.status}`);
      }
      if (!response.headers.get('content-type')?.includes('application/json')) {
        throw new Error('Expected JSON from students API');
      }
      const data = await response.json();
      if (data.success) {
        setStudents(data.data.slice(0, 10));
        setShowStudentList(true);
      }
    } catch (error) {
      console.error('Error searching students:', error);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    searchStudents(value);
  };

  const selectStudent = (student: Student) => {
    setFormData({
      ...formData,
      studentId: student.id,
      studentName: `${student.nama} (${student.nisn}) - ${student.kelas}`
    });
    setSearchQuery(`${student.nama} (${student.nisn}) - ${student.kelas}`);
    setShowStudentList(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.studentId) {
      setMessage({ type: 'error', text: 'Pilih siswa terlebih dahulu' });
      return;
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setMessage({ type: 'error', text: 'Jumlah pembayaran harus lebih dari 0' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const payload = {
        studentId: formData.studentId,
        paymentType: formData.paymentType,
        amount: parseFloat(formData.amount),
        month: formData.paymentType === 'SPP' ? parseInt(formData.month) : undefined,
        year: formData.paymentType === 'SPP' ? parseInt(formData.year) : undefined,
        paidAt: new Date(formData.paidAt).toISOString(),
        description: formData.description || undefined,
        status: 'PAID'
      };

      const response = await fetch('/api/spp-payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessage({ type: 'success', text: 'Pembayaran berhasil disimpan!' });
        handleReset();
        fetchRecentPayments();
      } else {
        setMessage({ type: 'error', text: data.error || 'Gagal menyimpan pembayaran' });
      }
    } catch (error) {
      console.error('Error submitting payment:', error);
      setMessage({ type: 'error', text: 'Terjadi kesalahan saat menyimpan pembayaran' });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      studentId: '',
      studentName: '',
      paymentType: 'SPP',
      amount: '',
      month: new Date().getMonth() + 1 + '',
      year: new Date().getFullYear() + '',
      paidAt: new Date().toISOString().split('T')[0],
      description: ''
    });
    setSearchQuery('');
    setStudents([]);
    setMessage(null);
  };

  const handleExport = () => {
    const csv = [
      ['Tanggal', 'NISN', 'Nama', 'Kelas', 'Jenis', 'Bulan', 'Tahun', 'Jumlah', 'Keterangan'],
      ...recentPayments.map(p => [
        new Date(p.paidAt).toLocaleDateString('id-ID'),
        p.student.nisn,
        p.student.nama,
        p.student.kelas,
        p.paymentType,
        p.month || '-',
        p.year || '-',
        p.amount,
        p.description || '-'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pembayaran_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <div className="hidden lg:block">
        <TreasurerSidebar />
      </div>

      {isMobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="fixed left-0 top-0 bottom-0 z-50 lg:hidden">
            <TreasurerSidebar />
          </div>
        </>
      )}

      <div className="flex-1 flex flex-col min-w-0 lg:ml-64">
        <TreasurerHeader onMenuClick={() => setIsMobileMenuOpen(true)} />
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto mt-16">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-neutral-900">Input Pembayaran</h1>
                <p className="text-neutral-600 mt-1">Input pembayaran SPP siswa</p>
              </div>
              <Button 
                icon={<Download className="w-4 h-4" />} 
                variant="outline"
                onClick={handleExport}
                disabled={recentPayments.length === 0}
              >
                Export
              </Button>
            </div>

            {message && (
              <Card className={`border-2 ${message.type === 'success' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}`}>
                <div className="flex items-center gap-2">
                  {message.type === 'success' ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  )}
                  <p className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
                    {message.text}
                  </p>
                </div>
              </Card>
            )}

            <Card>
              <h2 className="text-xl font-semibold text-neutral-900 mb-4">Form Pembayaran</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="relative">
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      NISN / Nama Siswa <span className="text-red-500">*</span>
                    </label>
                    <Input 
                      placeholder="Cari siswa..." 
                      icon={<Search className="w-4 h-4" />}
                      value={searchQuery}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      onFocus={() => students.length > 0 && setShowStudentList(true)}
                    />
                    {showStudentList && students.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                        {students.map((student) => (
                          <button
                            key={student.id}
                            type="button"
                            onClick={() => selectStudent(student)}
                            className="w-full text-left px-4 py-3 hover:bg-neutral-50 border-b border-neutral-100 last:border-b-0"
                          >
                            <p className="font-medium text-neutral-900">{student.nama}</p>
                            <p className="text-sm text-neutral-600">NISN: {student.nisn} • {student.kelas}</p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Jenis Pembayaran <span className="text-red-500">*</span>
                    </label>
                    <Select
                      value={formData.paymentType}
                      onChange={(e) => setFormData({ ...formData, paymentType: e.target.value })}
                      options={[
                        { value: 'SPP', label: 'SPP' },
                        { value: 'DAFTAR_ULANG', label: 'Daftar Ulang' },
                        { value: 'LAINNYA', label: 'Lainnya' },
                      ]}
                    />
                  </div>
                  
                  {formData.paymentType === 'SPP' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">Bulan</label>
                        <Select
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
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">Tahun</label>
                        <Select
                          value={formData.year}
                          onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                          options={[
                            { value: '2023', label: '2023' },
                            { value: '2024', label: '2024' },
                            { value: '2025', label: '2025' },
                            { value: '2026', label: '2026' },
                          ]}
                        />
                      </div>
                    </>
                  )}
                  
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Jumlah <span className="text-red-500">*</span>
                    </label>
                    <Input 
                      type="number" 
                      placeholder="500000"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Tanggal Bayar <span className="text-red-500">*</span>
                    </label>
                    <Input 
                      type="date" 
                      icon={<Calendar className="w-4 h-4" />}
                      value={formData.paidAt}
                      onChange={(e) => setFormData({ ...formData, paidAt: e.target.value })}
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Keterangan</label>
                  <Input 
                    placeholder="Catatan pembayaran (opsional)"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    type="submit" 
                    icon={<Plus className="w-4 h-4" />}
                    disabled={loading}
                  >
                    {loading ? 'Menyimpan...' : 'Simpan Pembayaran'}
                  </Button>
                  <Button type="button" variant="outline" onClick={handleReset}>
                    Reset
                  </Button>
                </div>
              </form>
            </Card>

            <Card>
              <h2 className="text-xl font-semibold text-neutral-900 mb-4">Pembayaran Terakhir</h2>
              {recentPayments.length === 0 ? (
                <div className="text-center py-8 text-neutral-500">
                  <p>Belum ada pembayaran yang diinput</p>
                  <p className="text-sm mt-2">Pembayaran yang ditambahkan akan muncul di sini</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-neutral-50 border-b border-neutral-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-neutral-600 uppercase">Tanggal</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-neutral-600 uppercase">NISN</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-neutral-600 uppercase">Nama</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-neutral-600 uppercase">Kelas</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-neutral-600 uppercase">Jenis</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-neutral-600 uppercase">Periode</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-neutral-600 uppercase">Jumlah</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200">
                      {recentPayments.map((payment) => (
                        <tr key={payment.id} className="hover:bg-neutral-50">
                          <td className="px-4 py-3 text-sm text-neutral-900">
                            {new Date(payment.paidAt).toLocaleDateString('id-ID')}
                          </td>
                          <td className="px-4 py-3 text-sm text-neutral-600">{payment.student.nisn}</td>
                          <td className="px-4 py-3 text-sm font-medium text-neutral-900">{payment.student.nama}</td>
                          <td className="px-4 py-3 text-sm text-neutral-600">{payment.student.kelas}</td>
                          <td className="px-4 py-3 text-sm text-neutral-600">{payment.paymentType}</td>
                          <td className="px-4 py-3 text-sm text-neutral-600">
                            {payment.month && payment.year ? 
                              `${payment.month}/${payment.year}` : 
                              '-'
                            }
                          </td>
                          <td className="px-4 py-3 text-sm font-semibold text-neutral-900 text-right">
                            Rp {payment.amount.toLocaleString('id-ID')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
