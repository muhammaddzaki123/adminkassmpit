'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { fetchWithAuth } from '@/lib/api-client';
import { TreasurerSidebar } from '@/components/layout/TreasurerSidebar';
import { TreasurerHeader } from '@/components/layout/TreasurerHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Search, Download, AlertCircle, ChevronDown, X } from 'lucide-react';
import { jsPDF } from 'jspdf';

interface SppDetail {
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
}

interface Student {
  id: string;
  nisn: string;
  nama: string;
  kelas: string;
  kelasLabel?: string;
  kelasGrade?: number | null;
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
  sppDetails?: SppDetail[];
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
  const [kelasFilter, setKelasFilter] = useState('all');
  const [sppLatestStatusFilter, setSppLatestStatusFilter] = useState('all');
  const [sppSortByOverdue, setSppSortByOverdue] = useState<'default' | 'overdue_desc' | 'overdue_asc'>('default');
  const [selectedStudentForModal, setSelectedStudentForModal] = useState<Student | null>(null);
  const [detailViewMode, setDetailViewMode] = useState<'all' | 'unpaid'>('all');
  const [showSppStatusMatrix, setShowSppStatusMatrix] = useState(false);
  const [matrixStatusView, setMatrixStatusView] = useState<'all' | 'risk'>('all');
  const [matrixSppStatusFilter, setMatrixSppStatusFilter] = useState<'all' | 'OVERDUE' | 'PARTIAL' | 'BILLED' | 'PAID' | 'UNBILLED'>('all');
  const [matrixSearchQuery, setMatrixSearchQuery] = useState('');
  const [matrixKelasFilter, setMatrixKelasFilter] = useState('all');
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
      const kelasLabel = s.kelasLabel || s.kelas || '-';
      const matchesSearch = searchQuery === '' ||
        s.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.nisn.includes(searchQuery);

      const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
      const matchesKelas = kelasFilter === 'all' || kelasLabel === kelasFilter;

      const latestSppStatus = (s.sppSummary?.statusTerbaru || 'NO_BILLING').toUpperCase();
      const overdueCount = s.sppSummary?.statusCounts.overdue || 0;
      const unpaidCount = (s.sppDetails || []).filter((detail) => !['PAID', 'WAIVED', 'CANCELLED'].includes(detail.status)).length;

      let matchesSppLatestStatus = false;
      if (sppLatestStatusFilter === 'all') {
        matchesSppLatestStatus = true;
      } else if (sppLatestStatusFilter === 'OVERDUE') {
        matchesSppLatestStatus = latestSppStatus === 'OVERDUE' || overdueCount > 0;
      } else if (sppLatestStatusFilter === 'UNPAID') {
        matchesSppLatestStatus = unpaidCount > 0;
      } else {
        matchesSppLatestStatus = latestSppStatus === sppLatestStatusFilter;
      }

      return matchesSearch && matchesStatus && matchesKelas && matchesSppLatestStatus;
    });
  }, [students, searchQuery, statusFilter, kelasFilter, sppLatestStatusFilter]);

  const uniqueKelas = useMemo(() => {
    const kelasValues = Array.from(
      new Set(
        students
          .map((student) => student.kelasLabel || student.kelas || '-')
          .filter((kelas) => kelas && kelas !== '-')
      )
    );

    return kelasValues.sort((a, b) => {
      const gradeA = Number((a.match(/\b(\d+)\b/) || [])[1] || 999);
      const gradeB = Number((b.match(/\b(\d+)\b/) || [])[1] || 999);

      if (gradeA !== gradeB) return gradeA - gradeB;
      return a.localeCompare(b, 'id-ID');
    });
  }, [students]);

  const displayedStudents = useMemo(() => {
    const compareByClassThenName = (a: Student, b: Student) => {
      const gradeA = a.kelasGrade ?? Number((a.kelasLabel || a.kelas || '').match(/\b(\d+)\b/)?.[1] || 999);
      const gradeB = b.kelasGrade ?? Number((b.kelasLabel || b.kelas || '').match(/\b(\d+)\b/)?.[1] || 999);

      if (gradeA !== gradeB) return gradeA - gradeB;

      const kelasA = (a.kelasLabel || a.kelas || '').toLowerCase();
      const kelasB = (b.kelasLabel || b.kelas || '').toLowerCase();
      const kelasCompare = kelasA.localeCompare(kelasB, 'id-ID');
      if (kelasCompare !== 0) return kelasCompare;

      return a.nama.localeCompare(b.nama, 'id-ID');
    };

    const rows = [...filteredStudents];

    if (sppSortByOverdue === 'default') {
      rows.sort(compareByClassThenName);
      return rows;
    }

    rows.sort((a, b) => {
      const overdueA = a.sppSummary?.statusCounts.overdue || 0;
      const overdueB = b.sppSummary?.statusCounts.overdue || 0;

      if (overdueA === overdueB) {
        return compareByClassThenName(a, b);
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

  const sppPeriods = useMemo(() => {
    const periodMap = new Map<string, { key: string; label: string; year: number; month: number }>();

    displayedStudents.forEach((student) => {
      (student.sppDetails || []).forEach((detail) => {
        const year = detail.year ?? 0;
        const month = detail.month ?? 0;
        const key = `${year}-${month}`;
        if (!periodMap.has(key)) {
          periodMap.set(key, {
            key,
            label: detail.period,
            year,
            month,
          });
        }
      });
    });

    return Array.from(periodMap.values()).sort((a, b) => {
      if (a.year === b.year) return a.month - b.month;
      return a.year - b.year;
    });
  }, [displayedStudents]);

  const isOutstandingStatus = (status: string) => {
    return !['PAID', 'WAIVED', 'CANCELLED'].includes(status);
  };

  const matrixStudents = useMemo(() => {
    let baseRows = displayedStudents;

    if (matrixStatusView === 'risk') {
      baseRows = baseRows.filter((student) =>
        (student.sppDetails || []).some((detail) => isOutstandingStatus(detail.status))
      );
    }

    if (matrixSppStatusFilter !== 'all') {
      baseRows = baseRows.filter((student) =>
        (student.sppDetails || []).some((detail) => detail.status === matrixSppStatusFilter)
      );
    }

    return baseRows;
  }, [displayedStudents, matrixStatusView, matrixSppStatusFilter]);

  const visibleSppPeriods = useMemo(() => {
    if (matrixStatusView === 'all' && matrixSppStatusFilter === 'all') return sppPeriods;

    return sppPeriods.filter((period) => {
      return matrixStudents.some((student) => {
        const detail = (student.sppDetails || []).find(
          (d) => `${d.year ?? 0}-${d.month ?? 0}` === period.key
        );
        if (!detail) return false;
        if (matrixSppStatusFilter !== 'all' && detail.status !== matrixSppStatusFilter) return false;
        if (matrixStatusView === 'risk' && !isOutstandingStatus(detail.status)) return false;
        return true;
      });
    });
  }, [sppPeriods, matrixStudents, matrixStatusView, matrixSppStatusFilter]);

  const sppMatrixByStudent = useMemo(() => {
    return displayedStudents.reduce<Record<string, Record<string, SppDetail>>>((acc, student) => {
      const perPeriod = (student.sppDetails || []).reduce<Record<string, SppDetail>>((detailAcc, detail) => {
        const key = `${detail.year ?? 0}-${detail.month ?? 0}`;
        detailAcc[key] = detail;
        return detailAcc;
      }, {});

      acc[student.id] = perPeriod;
      return acc;
    }, {});
  }, [displayedStudents]);

  const filteredMatrixStudents = useMemo(() => {
    return matrixStudents.filter((student) => {
      const matchesSearch =
        matrixSearchQuery === '' ||
        student.nama.toLowerCase().includes(matrixSearchQuery.toLowerCase()) ||
        student.nisn.includes(matrixSearchQuery);
      const kelasLabel = student.kelasLabel || student.kelas || '-';
      const matchesKelas = matrixKelasFilter === 'all' || kelasLabel === matrixKelasFilter;
      return matchesSearch && matchesKelas;
    });
  }, [matrixStudents, matrixSearchQuery, matrixKelasFilter]);

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
    const student = displayedStudents.find((s) => s.id === studentId) || null;
    if (!student) return;

    setDetailViewMode(sppLatestStatusFilter === 'OVERDUE' || sppLatestStatusFilter === 'UNPAID' ? 'unpaid' : 'all');
    setSelectedStudentForModal(student);
  };

  const closeSppDetailsModal = () => {
    setSelectedStudentForModal(null);
    setDetailViewMode('all');
  };

  const getDetailRowsForModal = () => {
    if (!selectedStudentForModal) return [];
    const allRows = selectedStudentForModal.sppDetails || [];
    if (detailViewMode === 'all') return allRows;
    return allRows.filter((detail) => !['PAID', 'WAIVED', 'CANCELLED'].includes(detail.status));
  };

  const getStudentExportRows = (rows: Student[]) => {
    return rows.map((s, index) => {
      const summary = s.sppSummary;
      const latest = getBillingStatusBadge(summary?.statusTerbaru || null);

      return {
        no: index + 1,
        nisn: s.nisn,
        nama: s.nama,
        kelas: s.kelasLabel || s.kelas,
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

  const getSppCellBackgroundClass = (status: string) => {
    const map: Record<string, string> = {
      OVERDUE: 'bg-red-100 border border-red-200',
      PARTIAL: 'bg-amber-100 border border-amber-200',
      BILLED: 'bg-blue-100 border border-blue-200',
      UNBILLED: 'bg-neutral-100 border border-neutral-200',
      PAID: 'bg-green-100 border border-green-200',
      WAIVED: 'bg-zinc-100 border border-zinc-200',
      CANCELLED: 'bg-zinc-100 border border-zinc-200',
    };

    return map[status] || 'bg-white border border-neutral-200';
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
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:flex lg:flex-row gap-2 sm:gap-3 mb-4">
                <div className="col-span-2 sm:col-span-3 lg:flex-1">
                  <Input
                    placeholder="Cari nama atau NISN..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    icon={<Search className="w-4 h-4" />}
                  />
                </div>
                <div>
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
                <div>
                  <Select
                    value={kelasFilter}
                    onChange={(e) => setKelasFilter(e.target.value)}
                    options={[
                      { value: 'all', label: 'Semua Kelas' },
                      ...uniqueKelas.map((kelas) => ({ value: kelas, label: kelas })),
                    ]}
                  />
                </div>
                <div>
                  <Select
                    value={sppLatestStatusFilter}
                    onChange={(e) => setSppLatestStatusFilter(e.target.value)}
                    options={[
                      { value: 'all', label: 'Semua SPP' },
                      { value: 'OVERDUE', label: 'Tunggakan' },
                      { value: 'UNPAID', label: 'Belum Bayar' },
                      { value: 'PARTIAL', label: 'Cicilan' },
                      { value: 'BILLED', label: 'Ditagih' },
                      { value: 'PAID', label: 'Lunas' },
                      { value: 'UNBILLED', label: 'Belum Tagih' },
                      { value: 'NO_BILLING', label: 'Belum Ada Tagihan' },
                    ]}
                  />
                </div>
                <div>
                  <Select
                    value={sppSortByOverdue}
                    onChange={(e) => setSppSortByOverdue(e.target.value as 'default' | 'overdue_desc' | 'overdue_asc')}
                    options={[
                      { value: 'default', label: 'Urutan Default' },
                      { value: 'overdue_desc', label: 'Tunggak ↓' },
                      { value: 'overdue_asc', label: 'Tunggak ↑' },
                    ]}
                  />
                </div>
                <div>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchQuery('');
                      setStatusFilter('all');
                      setKelasFilter('all');
                      setSppLatestStatusFilter('all');
                      setSppSortByOverdue('default');
                    }}
                    className="w-full"
                  >
                    Reset
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                <Button variant="outline" icon={<Download className="w-4 h-4" />} onClick={handleExportCsv}>
                  <span className="hidden sm:inline">Export </span>CSV
                </Button>
                <Button variant="outline" icon={<Download className="w-4 h-4" />} onClick={handleExportSpreadsheet}>
                  <span className="hidden sm:inline">Export </span>Excel
                </Button>
                <Button variant="outline" icon={<Download className="w-4 h-4" />} onClick={handleExportPdf}>
                  <span className="hidden sm:inline">Export </span>PDF
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowSppStatusMatrix(true)}
                  className="ml-auto"
                >
                  <span className="hidden sm:inline">Tampilkan </span>Status SPP
                </Button>
              </div>

              {displayedStudents.length === 0 ? (
                <div className="text-center py-12">
                  <AlertCircle className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
                  <p className="text-neutral-600">Tidak ada siswa ditemukan</p>
                </div>
              ) : (
                <>
                  {/* Desktop table */}
                  <div className="hidden md:block w-full overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-neutral-50 border-b border-neutral-200">
                        <tr>
                          <th className="px-4 py-3 font-medium text-neutral-600">NISN</th>
                          <th className="px-4 py-3 font-medium text-neutral-600">Nama Siswa</th>
                          <th className="px-4 py-3 font-medium text-neutral-600">Kelas</th>
                          <th className="px-4 py-3 font-medium text-neutral-600">JK</th>
                          <th className="px-4 py-3 font-medium text-neutral-600">Status SPP</th>
                          <th className="px-4 py-3 font-medium text-neutral-600">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-200">
                        {displayedStudents.map((student) => {
                          const summary = student.sppSummary;
                          const latest = getBillingStatusBadge(summary?.statusTerbaru || null);
                          const studentStatus = getStudentStatusBadge(student.status);
                          const canExpand = (student.sppDetails?.length || 0) > 0;
                          const unpaidCount = (student.sppDetails || []).filter((d) => !['PAID', 'WAIVED', 'CANCELLED'].includes(d.status)).length;
                          return (
                            <tr key={student.id} className="hover:bg-neutral-50 transition-colors align-top">
                              <td className="px-4 py-3 text-neutral-800 text-sm">{student.nisn}</td>
                              <td className="px-4 py-3 font-medium text-neutral-900">{student.nama}</td>
                              <td className="px-4 py-3 text-neutral-700">{student.kelasLabel || student.kelas || '-'}</td>
                              <td className="px-4 py-3 text-neutral-700">{student.jenisKelamin || '-'}</td>
                              <td className="px-4 py-3">
                                {!summary || summary.totalTagihan === 0 ? (
                                  <span className="text-sm text-neutral-400">Belum ada tagihan</span>
                                ) : (
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <Badge variant={latest.variant}>{latest.label}</Badge>
                                      <span className="text-xs text-neutral-400">{summary.billNumberTerbaru || '-'}</span>
                                    </div>
                                    <p className="text-xs text-neutral-500">Periode: {summary.periodAwal} – {summary.periodTerbaru}</p>
                                    <p className="text-xs text-neutral-400">Lunas {summary.statusCounts.paid}/{summary.totalTagihan} · Cicilan {summary.statusCounts.partial} · Tunggak {summary.statusCounts.overdue}</p>
                                    {(sppLatestStatusFilter === 'OVERDUE' || sppLatestStatusFilter === 'UNPAID') && (
                                      <p className="text-xs text-amber-700 font-medium">Belum dibayar: {unpaidCount} tagihan</p>
                                    )}
                                    {canExpand && (
                                      <button type="button" onClick={() => toggleSppDetails(student.id)}
                                        className="inline-flex items-center gap-1 text-xs text-primary-700 hover:text-primary-800 font-medium mt-0.5">
                                        <ChevronDown className="w-3.5 h-3.5" />Lihat detail
                                      </button>
                                    )}
                                  </div>
                                )}
                              </td>
                              <td className="px-4 py-3">
                                <Badge variant={studentStatus.color}>{studentStatus.label}</Badge>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile card list */}
                  <div className="md:hidden divide-y divide-neutral-200">
                    {displayedStudents.map((student) => {
                      const summary = student.sppSummary;
                      const latest = getBillingStatusBadge(summary?.statusTerbaru || null);
                      const studentStatus = getStudentStatusBadge(student.status);
                      const canExpand = (student.sppDetails?.length || 0) > 0;
                      const unpaidCount = (student.sppDetails || []).filter((d) => !['PAID', 'WAIVED', 'CANCELLED'].includes(d.status)).length;
                      return (
                        <div key={student.id} className="p-4 space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-semibold text-neutral-900 text-sm">{student.nama}</p>
                              <p className="text-xs text-neutral-500">{student.nisn} · {student.kelasLabel || student.kelas || '-'} · {student.jenisKelamin || '-'}</p>
                            </div>
                            <Badge variant={studentStatus.color}>{studentStatus.label}</Badge>
                          </div>
                          {!summary || summary.totalTagihan === 0 ? (
                            <p className="text-xs text-neutral-400">Belum ada tagihan SPP</p>
                          ) : (
                            <div className="bg-neutral-50 rounded-lg p-2.5 space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge variant={latest.variant}>{latest.label}</Badge>
                                <span className="text-xs text-neutral-400">{summary.billNumberTerbaru || '-'}</span>
                              </div>
                              <p className="text-xs text-neutral-500">Periode: {summary.periodAwal} – {summary.periodTerbaru}</p>
                              <p className="text-xs text-neutral-400">Lunas {summary.statusCounts.paid}/{summary.totalTagihan} · Cicilan {summary.statusCounts.partial} · Tunggak {summary.statusCounts.overdue}</p>
                              {(sppLatestStatusFilter === 'OVERDUE' || sppLatestStatusFilter === 'UNPAID') && (
                                <p className="text-xs text-amber-700 font-medium">Belum dibayar: {unpaidCount} tagihan</p>
                              )}
                              {canExpand && (
                                <button type="button" onClick={() => toggleSppDetails(student.id)}
                                  className="inline-flex items-center gap-1 text-xs text-primary-700 font-medium mt-0.5">
                                  <ChevronDown className="w-3.5 h-3.5" />Lihat detail SPP
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </Card>

            {/* Modal: Status SPP Semua Siswa */}
            {showSppStatusMatrix && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 lg:p-10" aria-modal="true">
                {/* Backdrop */}
                <div
                  className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                  onClick={() => {
                    setShowSppStatusMatrix(false);
                    setMatrixStatusView('all');
                    setMatrixSppStatusFilter('all');
                    setMatrixSearchQuery('');
                    setMatrixKelasFilter('all');
                  }}
                />
                {/* Floating Panel */}
                <div className="relative z-10 flex flex-col w-full max-w-[95vw] xl:max-w-7xl h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden">
                {/* Modal Header */}
                <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-neutral-100 shrink-0 bg-white">
                  <div>
                    <h2 className="text-lg font-semibold text-neutral-900">Status SPP Semua Siswa per Bulan</h2>
                    <p className="text-sm text-neutral-500 mt-0.5">
                      Geser horizontal untuk melihat status semua bulan per siswa.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowSppStatusMatrix(false);
                      setMatrixStatusView('all');
                      setMatrixSppStatusFilter('all');
                      setMatrixSearchQuery('');
                      setMatrixKelasFilter('all');
                    }}
                    className="p-2 rounded-lg hover:bg-neutral-100 text-neutral-500 hover:text-neutral-700 transition-colors shrink-0"
                    aria-label="Tutup"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Modal Toolbar */}
                <div className="px-4 sm:px-5 py-3 border-b border-neutral-200 shrink-0 space-y-2.5">
                  {/* Legend — hidden on very small screens to save space */}
                  <div className="hidden sm:flex flex-wrap items-center gap-1.5 text-xs text-neutral-600">
                    <span className="font-medium text-neutral-700 mr-0.5">Legend:</span>
                    <span className="inline-flex items-center rounded-full border border-red-200 bg-red-100 px-2 py-0.5">Merah: Tunggak</span>
                    <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-100 px-2 py-0.5">Kuning: Cicilan</span>
                    <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-100 px-2 py-0.5">Biru: Ditagih</span>
                    <span className="inline-flex items-center rounded-full border border-green-200 bg-green-100 px-2 py-0.5">Hijau: Lunas</span>
                    <span className="inline-flex items-center rounded-full border border-neutral-200 bg-neutral-100 px-2 py-0.5">Abu: Lainnya</span>
                  </div>
                  {/* Search + Kelas + Status in one responsive row */}
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="flex gap-2 flex-1 min-w-0">
                      <div className="flex-1 min-w-0">
                        <Input
                          placeholder="Cari nama / NISN..."
                          value={matrixSearchQuery}
                          onChange={(e) => setMatrixSearchQuery(e.target.value)}
                          icon={<Search className="w-4 h-4" />}
                        />
                      </div>
                      <div className="w-36 sm:w-44 shrink-0">
                        <Select
                          value={matrixKelasFilter}
                          onChange={(e) => setMatrixKelasFilter(e.target.value)}
                          options={[
                            { value: 'all', label: 'Semua Kelas' },
                            ...uniqueKelas.map((kelas) => ({ value: kelas, label: kelas })),
                          ]}
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 items-center flex-wrap sm:flex-nowrap shrink-0">
                      <Button
                        size="sm"
                        variant={matrixStatusView === 'all' ? 'primary' : 'outline'}
                        onClick={() => setMatrixStatusView('all')}
                      >
                        Semua
                      </Button>
                      <Button
                        size="sm"
                        variant={matrixStatusView === 'risk' ? 'primary' : 'outline'}
                        onClick={() => setMatrixStatusView('risk')}
                      >
                        Tunggakan
                      </Button>
                      <div className="w-44 sm:w-52">
                        <Select
                          value={matrixSppStatusFilter}
                          onChange={(e) =>
                            setMatrixSppStatusFilter(
                              e.target.value as 'all' | 'OVERDUE' | 'PARTIAL' | 'BILLED' | 'PAID' | 'UNBILLED'
                            )
                          }
                          options={[
                            { value: 'all', label: 'Semua Status' },
                            { value: 'OVERDUE', label: 'Tunggak' },
                            { value: 'PARTIAL', label: 'Cicilan' },
                            { value: 'BILLED', label: 'Ditagih' },
                            { value: 'PAID', label: 'Lunas' },
                            { value: 'UNBILLED', label: 'Belum Ditagih' },
                          ]}
                        />
                      </div>
                      {(matrixSearchQuery !== '' || matrixKelasFilter !== 'all' || matrixStatusView !== 'all' || matrixSppStatusFilter !== 'all') && (
                        <button
                          type="button"
                          onClick={() => {
                            setMatrixSearchQuery('');
                            setMatrixKelasFilter('all');
                            setMatrixStatusView('all');
                            setMatrixSppStatusFilter('all');
                          }}
                          className="text-xs text-neutral-500 hover:text-neutral-700 underline whitespace-nowrap"
                        >
                          Reset
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Modal Body — scrollable matrix */}
                <div className="flex-1 overflow-auto">
                  {filteredMatrixStudents.length === 0 || visibleSppPeriods.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-neutral-500">
                      Data SPP bulanan belum tersedia untuk ditampilkan.
                    </div>
                  ) : (
                    <table className="text-sm min-w-max w-full">
                      <thead className="bg-neutral-100 border-b border-neutral-200">
                        <tr>
                          <th className="px-3 py-3 text-left font-medium text-neutral-700 sticky top-0 left-0 z-30 bg-neutral-100 min-w-[130px]">NISN</th>
                          <th className="px-3 py-3 text-left font-medium text-neutral-700 sticky top-0 left-[130px] z-30 bg-neutral-100 min-w-[220px]">Nama</th>
                          <th className="px-3 py-3 text-left font-medium text-neutral-700 sticky top-0 left-[350px] z-30 bg-neutral-100 min-w-[90px]">Kelas</th>
                          {visibleSppPeriods.map((period) => (
                            <th key={period.key} className="px-3 py-3 text-left font-medium text-neutral-700 min-w-[180px] sticky top-0 z-20 bg-neutral-100">
                              {period.label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-200">
                        {filteredMatrixStudents.map((student) => (
                          <tr key={`matrix-${student.id}`} className="hover:bg-neutral-50">
                            <td className="px-3 py-3 sticky left-0 z-10 bg-white min-w-[130px]">{student.nisn}</td>
                            <td className="px-3 py-3 sticky left-[130px] z-10 bg-white min-w-[220px] font-medium">{student.nama}</td>
                            <td className="px-3 py-3 sticky left-[350px] z-10 bg-white min-w-[90px]">{student.kelasLabel || student.kelas || '-'}</td>
                            {visibleSppPeriods.map((period) => {
                              const detail = sppMatrixByStudent[student.id]?.[period.key];
                              if (!detail) {
                                return (
                                  <td key={`${student.id}-${period.key}`} className="px-3 py-3 text-neutral-400 min-w-[180px]">-</td>
                                );
                              }

                              const badge = getBillingStatusBadge(detail.status);
                              const showAsEmpty = matrixStatusView === 'risk' && !isOutstandingStatus(detail.status);

                              if (showAsEmpty) {
                                return (
                                  <td key={`${student.id}-${period.key}`} className="px-3 py-3 text-neutral-300 min-w-[180px]">-</td>
                                );
                              }

                              if (matrixSppStatusFilter !== 'all' && detail.status !== matrixSppStatusFilter) {
                                return (
                                  <td key={`${student.id}-${period.key}`} className="px-3 py-3 text-neutral-300 min-w-[180px]">-</td>
                                );
                              }

                              return (
                                <td key={`${student.id}-${period.key}`} className="px-3 py-3 min-w-[180px]">
                                  <div className={`space-y-1 rounded-md p-2 ${getSppCellBackgroundClass(detail.status)}`}>
                                    <Badge variant={badge.variant}>{badge.label}</Badge>
                                    <p className="text-xs text-neutral-600">{detail.billNumber}</p>
                                    <p className="text-xs text-neutral-500">{formatCurrency(detail.paidAmount)} / {formatCurrency(detail.totalAmount)}</p>
                                  </div>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
                </div>
              </div>
            )}

            {selectedStudentForModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                <div className="bg-white rounded-xl shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
                  <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-neutral-200">
                    <div>
                      <h3 className="text-lg font-semibold text-neutral-900">Detail Pembayaran SPP</h3>
                      <p className="text-sm text-neutral-600">
                        {selectedStudentForModal.nama} ({selectedStudentForModal.nisn}) • Kelas {selectedStudentForModal.kelasLabel || selectedStudentForModal.kelas || '-'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={closeSppDetailsModal}
                      className="text-neutral-500 hover:text-neutral-700"
                      aria-label="Tutup modal detail SPP"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="px-5 py-4 flex flex-wrap gap-3 border-b border-neutral-200">
                    <Button
                      variant={detailViewMode === 'all' ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => setDetailViewMode('all')}
                    >
                      Semua Tagihan
                    </Button>
                    <Button
                      variant={detailViewMode === 'unpaid' ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => setDetailViewMode('unpaid')}
                    >
                      Belum Dibayar / Tunggakan
                    </Button>
                  </div>

                  <div className="p-5 overflow-auto max-h-[65vh]">
                    {getDetailRowsForModal().length === 0 ? (
                      <div className="text-center py-10 text-neutral-600">
                        Tidak ada data untuk mode yang dipilih.
                      </div>
                    ) : (
                      <div className="rounded-lg border border-neutral-200 overflow-x-auto">
                        <table className="w-full text-sm">
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
                            {getDetailRowsForModal().map((detail) => {
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
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
