'use client';

import { useState, useEffect, useMemo, Fragment } from 'react';
import { useRouter } from 'next/navigation';
import { fetchWithAuth } from '@/lib/api-client';
import { TreasurerSidebar } from '@/components/layout/TreasurerSidebar';
import { TreasurerHeader } from '@/components/layout/TreasurerHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Search, Download, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { jsPDF } from 'jspdf';

interface Student {
  id: string;
  nisn: string;
  nama: string;
  kelas: string;
  jenisKelamin?: string;
  status: string;
  email?: string;
  noTelp?: string;
  sppSummary?: {
    totalTagihan: number;
    periodAwal: string;
    periodTerbaru: string;
    statusTerbaru: string | null;
    billNumberTerbaru: string | null;
    statusCounts: {
      paid: number;
      partial: number;
      billed: number;
      overdue: number;
      cancelled: number;
      waived: number;
      unbilled: number;
    };
  };
  sppDetails?: Array<{
    id: string;
    billNumber: string;
    status: string;
    period: string;
    month?: number | null;
    year?: number | null;
    totalAmount: number;
    paidAmount: number;
    dueDate?: string | null;
    billDate?: string | null;
  }>;
}

function getBillingStatusBadge(status: string | null) {
  const map: Record<string, { label: string; variant: 'success' | 'warning' | 'error' | 'info' | 'default' }> = {
    PAID: { label: 'Lunas', variant: 'success' },
    PARTIAL: { label: 'Cicilan', variant: 'warning' },
    BILLED: { label: 'Ditagih', variant: 'info' },
    OVERDUE: { label: 'Tunggak', variant: 'error' },
    WAIVED: { label: 'Dibebaskan', variant: 'default' },
    CANCELLED: { label: 'Dibatalkan', variant: 'default' },
    UNBILLED: { label: 'Belum Tagih', variant: 'default' },
  };

  return map[status || ''] || { label: status || '-', variant: 'default' as const };
}

export default function StudentsPage() {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sppLatestStatusFilter, setSppLatestStatusFilter] = useState('all');
  const [sppSortByOverdue, setSppSortByOverdue] = useState<'default' | 'overdue_desc' | 'overdue_asc'>('default');
  const [expandedStudentIds, setExpandedStudentIds] = useState<string[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

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

    fetchStudents();
  }, [router]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await fetchWithAuth('/api/students');
      if (!response.ok) {
        throw new Error(`Failed to fetch students: ${response.status}`);
      }
      if (!response.headers.get('content-type')?.includes('application/json')) {
        throw new Error('Expected JSON from students API');
      }
      const data = await response.json();
      
      if (data.success) {
        setStudents(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      alert('Gagal memuat data siswa.');
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchesSearch = searchQuery === '' ||
        s.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.nisn.includes(searchQuery);

      const matchesStatus = statusFilter === 'all' || s.status === statusFilter;

      const latestSppStatus = (s.sppSummary?.statusTerbaru || 'NO_BILLING').toUpperCase();
      const overdueCount = s.sppSummary?.statusCounts.overdue || 0;
      const matchesSppLatestStatus = sppLatestStatusFilter === 'all'
        || (sppLatestStatusFilter === 'OVERDUE' && (latestSppStatus === 'OVERDUE' || overdueCount > 0))
        || latestSppStatus === sppLatestStatusFilter;

      return matchesSearch && matchesStatus && matchesSppLatestStatus;
    });
  }, [students, searchQuery, statusFilter, sppLatestStatusFilter]);

  const displayedStudents = useMemo(() => {
    const rows = [...filteredStudents];

    if (sppSortByOverdue === 'default') {
      return rows;
    }

    rows.sort((a, b) => {
      const overdueA = a.sppSummary?.statusCounts.overdue || 0;
      const overdueB = b.sppSummary?.statusCounts.overdue || 0;

      if (overdueA === overdueB) {
        return a.nama.localeCompare(b.nama, 'id-ID');
      }

      return sppSortByOverdue === 'overdue_desc' ? overdueB - overdueA : overdueA - overdueB;
    });

    return rows;
  }, [filteredStudents, sppSortByOverdue]);

  const sppAggregateSummary = useMemo(() => {
    return displayedStudents.reduce(
      (acc, student) => {
        acc.totalSiswa += 1;
        acc.totalTagihan += student.sppSummary?.totalTagihan || 0;
        acc.totalLunas += student.sppSummary?.statusCounts.paid || 0;
        acc.totalCicilan += student.sppSummary?.statusCounts.partial || 0;
        acc.totalTunggak += student.sppSummary?.statusCounts.overdue || 0;
        return acc;
      },
      {
        totalSiswa: 0,
        totalTagihan: 0,
        totalLunas: 0,
        totalCicilan: 0,
        totalTunggak: 0,
      }
    );
  }, [displayedStudents]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(value || 0);
  };

  const formatDate = (value?: string | null) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('id-ID');
  };

  const toggleSppDetails = (studentId: string) => {
    setExpandedStudentIds((prev) => (
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    ));
  };

  const getStudentExportRows = (rows: Student[]) => {
    return rows.map((s, index) => {
      const summary = s.sppSummary;
      const latest = getBillingStatusBadge(summary?.statusTerbaru || null);

      return {
        no: index + 1,
        nisn: s.nisn,
        nama: s.nama,
        kelas: s.kelas,
        statusSiswa: s.status,
        statusSppTerbaru: latest.label,
        billTerbaru: summary?.billNumberTerbaru || '-',
        periodeAwal: summary?.periodAwal || '-',
        periodeTerbaru: summary?.periodTerbaru || '-',
        totalTagihan: summary?.totalTagihan || 0,
        lunas: summary?.statusCounts.paid || 0,
        cicilan: summary?.statusCounts.partial || 0,
        tunggak: summary?.statusCounts.overdue || 0,
      };
    });
  };

  const downloadFile = (content: BlobPart, fileName: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportCsv = () => {
    const rows = getStudentExportRows(displayedStudents);
    const headers = [
      'No',
      'NISN',
      'Nama',
      'Kelas',
      'Status Siswa',
      'Status SPP Terbaru',
      'No Tagihan Terbaru',
      'Periode Awal',
      'Periode Terbaru',
      'Total Tagihan',
      'Lunas',
      'Cicilan',
      'Tunggak',
    ];

    const csvLines = [
      'Rekap SPP',
      `Total Siswa,${sppAggregateSummary.totalSiswa}`,
      `Total Tagihan,${sppAggregateSummary.totalTagihan}`,
      `Total Lunas,${sppAggregateSummary.totalLunas}`,
      `Total Cicilan,${sppAggregateSummary.totalCicilan}`,
      `Total Tunggak,${sppAggregateSummary.totalTunggak}`,
      '',
      'Rekap SPP Per Siswa',
      headers.join(','),
      ...rows.map(r => [
        r.no,
        `"${r.nisn}"`,
        `"${r.nama.replace(/"/g, '""')}"`,
        `"${r.kelas}"`,
        `"${r.statusSiswa}"`,
        `"${r.statusSppTerbaru}"`,
        `"${r.billTerbaru}"`,
        `"${r.periodeAwal}"`,
        `"${r.periodeTerbaru}"`,
        r.totalTagihan,
        r.lunas,
        r.cicilan,
        r.tunggak,
      ].join(',')),
    ];

    downloadFile(`\uFEFF${csvLines.join('\n')}`, `rekap-spp-siswa-${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv;charset=utf-8;');
  };

  const handleExportSpreadsheet = () => {
    const rows = getStudentExportRows(displayedStudents);
    const tableHeader = `
      <tr>
        <th>No</th>
        <th>NISN</th>
        <th>Nama</th>
        <th>Kelas</th>
        <th>Status Siswa</th>
        <th>Status SPP Terbaru</th>
        <th>No Tagihan Terbaru</th>
        <th>Periode Awal</th>
        <th>Periode Terbaru</th>
        <th>Total Tagihan</th>
        <th>Lunas</th>
        <th>Cicilan</th>
        <th>Tunggak</th>
      </tr>
    `;

    const tableRows = rows.map(r => `
      <tr>
        <td>${r.no}</td>
        <td>${r.nisn}</td>
        <td>${r.nama}</td>
        <td>${r.kelas}</td>
        <td>${r.statusSiswa}</td>
        <td>${r.statusSppTerbaru}</td>
        <td>${r.billTerbaru}</td>
        <td>${r.periodeAwal}</td>
        <td>${r.periodeTerbaru}</td>
        <td>${r.totalTagihan}</td>
        <td>${r.lunas}</td>
        <td>${r.cicilan}</td>
        <td>${r.tunggak}</td>
      </tr>
    `).join('');

    const html = `
      <html>
        <head>
          <meta charset="utf-8" />
          <style>
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid #d4d4d8; padding: 6px; font-size: 12px; }
            th { background: #f5f5f5; }
          </style>
        </head>
        <body>
          <h3>Rekap SPP</h3>
          <table>
            <tbody>
              <tr><td>Total Siswa</td><td>${sppAggregateSummary.totalSiswa}</td></tr>
              <tr><td>Total Tagihan</td><td>${sppAggregateSummary.totalTagihan}</td></tr>
              <tr><td>Total Lunas</td><td>${sppAggregateSummary.totalLunas}</td></tr>
              <tr><td>Total Cicilan</td><td>${sppAggregateSummary.totalCicilan}</td></tr>
              <tr><td>Total Tunggak</td><td>${sppAggregateSummary.totalTunggak}</td></tr>
            </tbody>
          </table>
          <h3>Rekap SPP Per Siswa</h3>
          <table>
            <thead>${tableHeader}</thead>
            <tbody>${tableRows}</tbody>
          </table>
        </body>
      </html>
    `;

    downloadFile(`\uFEFF${html}`, `rekap-spp-siswa-${new Date().toISOString().slice(0, 10)}.xls`, 'application/vnd.ms-excel;charset=utf-8;');
  };

  const handleExportPdf = () => {
    const rows = getStudentExportRows(displayedStudents);
    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 40;

    doc.setFontSize(14);
    doc.text('Rekap SPP Per Siswa', 40, y);
    y += 20;

    doc.setFontSize(10);
    doc.text(`Tanggal Export: ${new Date().toLocaleDateString('id-ID')}`, 40, y);
    y += 16;
    doc.text(`Jumlah Data: ${rows.length}`, 40, y);
    y += 20;
    doc.text(`Total Tagihan: ${sppAggregateSummary.totalTagihan} | Lunas: ${sppAggregateSummary.totalLunas} | Cicilan: ${sppAggregateSummary.totalCicilan} | Tunggak: ${sppAggregateSummary.totalTunggak}`, 40, y, { maxWidth: pageWidth - 80 });
    y += 20;

    doc.setDrawColor(180);
    doc.line(40, y, pageWidth - 40, y);
    y += 14;

    doc.setFontSize(9);
    rows.forEach((row, index) => {
      const line = `${index + 1}. ${row.nama} (${row.nisn}) | ${row.kelas} | SPP: ${row.statusSppTerbaru} | Lunas ${row.lunas}/${row.totalTagihan} | Tunggak ${row.tunggak} | Periode ${row.periodeAwal} - ${row.periodeTerbaru}`;

      if (y > 560) {
        doc.addPage();
        y = 40;
      }

      doc.text(line, 40, y, { maxWidth: pageWidth - 80 });
      y += 14;
    });

    doc.save(`rekap-spp-siswa-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const getStudentStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; color: 'success' | 'warning' | 'error' | 'info' }> = {
      ACTIVE: { label: 'Aktif', color: 'success' },
      INACTIVE: { label: 'Nonaktif', color: 'error' },
      GRADUATED: { label: 'Lulus', color: 'info' },
      PENDING_REGISTRATION: { label: 'Pending', color: 'warning' },
    };
    return statusMap[status] || { label: status, color: 'info' as const };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-neutral-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-neutral-600">Memuat data...</p>
        </div>
      </div>
    );
  }

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
            <div>
              <h1 className="text-3xl font-bold text-neutral-900">Data Siswa</h1>
              <p className="text-neutral-600 mt-1">Kelola data siswa dan pembayaran</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card padding="md" className="text-center">
                <p className="text-2xl font-bold text-primary-600">
                  {students.filter(s => s.status === 'ACTIVE').length}
                </p>
                <p className="text-sm text-neutral-600 mt-1">Siswa Aktif</p>
              </Card>
              <Card padding="md" className="text-center">
                <p className="text-2xl font-bold text-yellow-600">
                  {students.filter(s => s.status === 'PENDING_REGISTRATION').length}
                </p>
                <p className="text-sm text-neutral-600 mt-1">Pending Registrasi</p>
              </Card>
              <Card padding="md" className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {students.filter(s => s.status === 'GRADUATED').length}
                </p>
                <p className="text-sm text-neutral-600 mt-1">Lulus</p>
              </Card>
            </div>

            <Card>
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <Input
                    placeholder="Cari nama atau NISN..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    icon={<Search className="w-4 h-4" />}
                  />
                </div>
                <div className="w-full md:w-40">
                  <Select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    options={[
                      { value: 'all', label: 'Semua Status' },
                      { value: 'ACTIVE', label: 'Aktif' },
                      { value: 'INACTIVE', label: 'Nonaktif' },
                      { value: 'GRADUATED', label: 'Lulus' },
                      { value: 'PENDING_REGISTRATION', label: 'Pending' },
                    ]}
                  />
                </div>
                <div className="w-full md:w-48">
                  <Select
                    value={sppLatestStatusFilter}
                    onChange={(e) => setSppLatestStatusFilter(e.target.value)}
                    options={[
                      { value: 'all', label: 'Semua SPP Terbaru' },
                      { value: 'OVERDUE', label: 'SPP Terbaru: Tunggak' },
                      { value: 'PARTIAL', label: 'SPP Terbaru: Cicilan' },
                      { value: 'BILLED', label: 'SPP Terbaru: Ditagih' },
                      { value: 'PAID', label: 'SPP Terbaru: Lunas' },
                      { value: 'UNBILLED', label: 'SPP Terbaru: Belum Tagih' },
                      { value: 'NO_BILLING', label: 'Belum Ada Tagihan' },
                    ]}
                  />
                </div>
                <div className="w-full md:w-48">
                  <Select
                    value={sppSortByOverdue}
                    onChange={(e) => setSppSortByOverdue(e.target.value as 'default' | 'overdue_desc' | 'overdue_asc')}
                    options={[
                      { value: 'default', label: 'Urutan Default' },
                      { value: 'overdue_desc', label: 'Tunggak Tertinggi' },
                      { value: 'overdue_asc', label: 'Tunggak Terendah' },
                    ]}
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-6">
                <Button variant="outline" icon={<Download className="w-4 h-4" />} onClick={handleExportCsv}>
                  Export CSV
                </Button>
                <Button variant="outline" icon={<Download className="w-4 h-4" />} onClick={handleExportSpreadsheet}>
                  Export Excel
                </Button>
                <Button variant="outline" icon={<Download className="w-4 h-4" />} onClick={handleExportPdf}>
                  Export PDF
                </Button>
              </div>

              {displayedStudents.length === 0 ? (
                <div className="text-center py-12">
                  <AlertCircle className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
                  <p className="text-neutral-600">Tidak ada siswa ditemukan</p>
                </div>
              ) : (
                <div className="w-full overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-[#f9fafb] border-b border-[#e5e7eb]">
                      <tr>
                        <th className="px-4 py-3 font-medium text-[#4b5563] w-[12%]">NISN</th>
                        <th className="px-4 py-3 font-medium text-[#4b5563] w-[20%]">Nama Siswa</th>
                        <th className="px-4 py-3 font-medium text-[#4b5563] w-[8%]">Kelas</th>
                        <th className="px-4 py-3 font-medium text-[#4b5563] w-[8%]">JK</th>
                        <th className="px-4 py-3 font-medium text-[#4b5563] w-[40%]">Status SPP (Awal - Terbaru)</th>
                        <th className="px-4 py-3 font-medium text-[#4b5563] w-[12%]">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e5e7eb]">
                      {displayedStudents.map((student) => {
                        const summary = student.sppSummary;
                        const latest = getBillingStatusBadge(summary?.statusTerbaru || null);
                        const studentStatus = getStudentStatusBadge(student.status);
                        const isExpanded = expandedStudentIds.includes(student.id);
                        const canExpand = (student.sppDetails?.length || 0) > 0;

                        return (
                          <Fragment key={student.id}>
                            <tr className="hover:bg-[#f9fafb] transition-colors align-top">
                              <td className="px-4 py-3 text-[#1c1c1c]">{student.nisn}</td>
                              <td className="px-4 py-3 text-[#1c1c1c] font-medium">{student.nama}</td>
                              <td className="px-4 py-3 text-[#1c1c1c]">{student.kelas || '-'}</td>
                              <td className="px-4 py-3 text-[#1c1c1c]">{student.jenisKelamin || '-'}</td>
                              <td className="px-4 py-3 text-[#1c1c1c]">
                                {!summary || summary.totalTagihan === 0 ? (
                                  <div className="text-sm text-neutral-500">
                                    <p>Belum ada tagihan SPP</p>
                                  </div>
                                ) : (
                                  <div className="space-y-2">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <Badge variant={latest.variant}>{latest.label}</Badge>
                                      <span className="text-xs text-neutral-500">{summary.billNumberTerbaru || '-'}</span>
                                    </div>
                                    <p className="text-xs text-neutral-700">
                                      Periode: {summary.periodAwal} - {summary.periodTerbaru}
                                    </p>
                                    <p className="text-xs text-neutral-500">
                                      Lunas {summary.statusCounts.paid}/{summary.totalTagihan} • Cicilan {summary.statusCounts.partial} • Tunggak {summary.statusCounts.overdue}
                                    </p>
                                    {canExpand && (
                                      <button
                                        type="button"
                                        onClick={() => toggleSppDetails(student.id)}
                                        className="inline-flex items-center gap-1 text-xs text-primary-700 hover:text-primary-800 font-medium"
                                      >
                                        {isExpanded ? (
                                          <>
                                            <ChevronUp className="w-3.5 h-3.5" />
                                            Sembunyikan detail SPP
                                          </>
                                        ) : (
                                          <>
                                            <ChevronDown className="w-3.5 h-3.5" />
                                            Lihat detail SPP per bulan
                                          </>
                                        )}
                                      </button>
                                    )}
                                  </div>
                                )}
                              </td>
                              <td className="px-4 py-3 text-[#1c1c1c]">
                                <Badge variant={studentStatus.color}>{studentStatus.label}</Badge>
                              </td>
                            </tr>

                            {isExpanded && canExpand && (
                              <tr className="bg-neutral-50">
                                <td colSpan={6} className="px-4 py-4">
                                  <div className="rounded-lg border border-neutral-200 bg-white overflow-x-auto">
                                    <table className="w-full text-xs md:text-sm">
                                      <thead className="bg-neutral-100 border-b border-neutral-200">
                                        <tr>
                                          <th className="px-3 py-2 text-left font-medium text-neutral-600">Periode</th>
                                          <th className="px-3 py-2 text-left font-medium text-neutral-600">No Tagihan</th>
                                          <th className="px-3 py-2 text-left font-medium text-neutral-600">Status</th>
                                          <th className="px-3 py-2 text-right font-medium text-neutral-600">Total</th>
                                          <th className="px-3 py-2 text-right font-medium text-neutral-600">Dibayar</th>
                                          <th className="px-3 py-2 text-left font-medium text-neutral-600">Jatuh Tempo</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-neutral-200">
                                        {student.sppDetails?.map((detail) => {
                                          const badge = getBillingStatusBadge(detail.status);
                                          return (
                                            <tr key={detail.id}>
                                              <td className="px-3 py-2">{detail.period}</td>
                                              <td className="px-3 py-2">{detail.billNumber}</td>
                                              <td className="px-3 py-2">
                                                <Badge variant={badge.variant}>{badge.label}</Badge>
                                              </td>
                                              <td className="px-3 py-2 text-right">{formatCurrency(detail.totalAmount)}</td>
                                              <td className="px-3 py-2 text-right">{formatCurrency(detail.paidAmount)}</td>
                                              <td className="px-3 py-2">{formatDate(detail.dueDate)}</td>
                                            </tr>
                                          );
                                        })}
                                      </tbody>
                                    </table>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </Fragment>
                        );
                      })}
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
