'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TreasurerSidebar } from '@/components/layout/TreasurerSidebar';
import { TreasurerHeader } from '@/components/layout/TreasurerHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Database, Download, Upload, Archive, Clock, CheckCircle } from 'lucide-react';

export default function BackupPage() {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
  }, [router]);

  const backupHistory = [
    { id: '1', date: '2025-01-15 10:30', type: 'Auto', size: '24.5 MB', status: 'success' },
    { id: '2', date: '2025-01-14 10:30', type: 'Auto', size: '24.2 MB', status: 'success' },
    { id: '3', date: '2025-01-13 15:20', type: 'Manual', size: '24.1 MB', status: 'success' },
  ];

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
              <h1 className="text-3xl font-bold text-neutral-900">Backup Data</h1>
              <p className="text-neutral-600 mt-1">Kelola backup dan restore data sistem</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-linear-to-br from-blue-500 to-blue-600 text-white">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-white/20 rounded-lg">
                    <Database className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm opacity-90">Backup Terakhir</p>
                    <p className="text-lg font-bold">15 Januari 2025, 10:30</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="text-white border-white hover:bg-white/20" icon={<Download className="w-4 h-4" />}>
                    Download
                  </Button>
                </div>
              </Card>

              <Card className="bg-linear-to-br from-green-500 to-green-600 text-white">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-white/20 rounded-lg">
                    <Archive className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm opacity-90">Total Backup</p>
                    <p className="text-lg font-bold">{backupHistory.length} File</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="text-white border-white hover:bg-white/20" icon={<Archive className="w-4 h-4" />}>
                    Lihat Semua
                  </Button>
                </div>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Download className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-neutral-900">Backup Manual</h3>
                    <p className="text-sm text-neutral-600">Buat backup database sekarang</p>
                  </div>
                </div>
                <Button icon={<Download className="w-4 h-4" />} fullWidth>
                  Buat Backup Sekarang
                </Button>
              </Card>

              <Card>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <Upload className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-neutral-900">Restore Data</h3>
                    <p className="text-sm text-neutral-600">Kembalikan data dari backup</p>
                  </div>
                </div>
                <Button variant="outline" icon={<Upload className="w-4 h-4" />} fullWidth>
                  Restore dari File
                </Button>
              </Card>
            </div>

            <Card>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-neutral-900">Riwayat Backup</h2>
                <Button variant="ghost" size="sm" icon={<Clock className="w-4 h-4" />}>
                  Filter
                </Button>
              </div>
              <div className="space-y-3">
                {backupHistory.map((backup) => (
                  <div key={backup.id} className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Database className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-neutral-900">{backup.date}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={backup.type === 'Auto' ? 'primary' : 'warning'}>
                            {backup.type}
                          </Badge>
                          <span className="text-sm text-neutral-600">{backup.size}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost" icon={<Download className="w-4 h-4" />}>
                          Download
                        </Button>
                        <Button size="sm" variant="ghost" icon={<Upload className="w-4 h-4" />}>
                          Restore
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="bg-yellow-50 border-yellow-200">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Archive className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-900 mb-1">Backup Otomatis</h3>
                  <p className="text-sm text-neutral-600 mb-3">
                    Sistem akan membuat backup otomatis setiap hari pukul 10:30 WIB
                  </p>
                  <Button size="sm" variant="outline">
                    Pengaturan Backup Otomatis
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
