'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminHeader } from '@/components/layout/AdminHeader';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Settings, Save, Database, Mail, Bell, Shield } from 'lucide-react';

export default function AdminSettings() {
  const router = useRouter();
  const [settings, setSettings] = useState({
    siteName: 'T-SMART',
    siteDescription: 'Treasury System for Schools',
    adminEmail: 'admin@tsmart.com',
    allowRegistration: false,
    emailNotifications: true,
    systemMaintenance: false,
    maxLoginAttempts: 5,
    sessionTimeout: 60,
    backupFrequency: 'daily',
  });

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/auth/login');
      return;
    }

    const user = JSON.parse(userData);
    if (user.role !== 'ADMIN') {
      router.push('/auth/login');
      return;
    }
  }, [router]);

  const handleSave = () => {
    alert('Pengaturan berhasil disimpan!');
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <AdminSidebar />
      <div className="ml-64">
        <AdminHeader />

        <main className="pt-16 p-8">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-neutral-900 mb-2">Pengaturan Sistem</h1>
                <p className="text-neutral-600">Konfigurasi sistem dan preferensi aplikasi</p>
              </div>
              <Button icon={<Save className="w-4 h-4" />} onClick={handleSave}>
                Simpan Perubahan
              </Button>
            </div>

            {/* General Settings */}
            <Card>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                  <Settings className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-neutral-900">Pengaturan Umum</h3>
                  <p className="text-sm text-neutral-600">Konfigurasi dasar aplikasi</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Nama Sistem
                  </label>
                  <Input
                    value={settings.siteName}
                    onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Deskripsi Sistem
                  </label>
                  <Input
                    value={settings.siteDescription}
                    onChange={(e) => setSettings({ ...settings, siteDescription: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Email Administrator
                  </label>
                  <Input
                    type="email"
                    value={settings.adminEmail}
                    onChange={(e) => setSettings({ ...settings, adminEmail: e.target.value })}
                    icon={<Mail className="w-4 h-4" />}
                  />
                </div>
              </div>
            </Card>

            {/* Security Settings */}
            <Card>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-neutral-900">Keamanan</h3>
                  <p className="text-sm text-neutral-600">Pengaturan keamanan sistem</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
                  <div>
                    <p className="font-medium text-neutral-900">Izinkan Registrasi User Baru</p>
                    <p className="text-sm text-neutral-600">Aktifkan pendaftaran user dari halaman publik</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.allowRegistration}
                      onChange={(e) => setSettings({ ...settings, allowRegistration: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-neutral-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Maksimal Percobaan Login
                  </label>
                  <Input
                    type="number"
                    value={settings.maxLoginAttempts}
                    onChange={(e) => setSettings({ ...settings, maxLoginAttempts: parseInt(e.target.value) })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Timeout Session (menit)
                  </label>
                  <Input
                    type="number"
                    value={settings.sessionTimeout}
                    onChange={(e) => setSettings({ ...settings, sessionTimeout: parseInt(e.target.value) })}
                  />
                </div>
              </div>
            </Card>

            {/* Notification Settings */}
            <Card>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-accent-100 rounded-lg flex items-center justify-center">
                  <Bell className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-neutral-900">Notifikasi</h3>
                  <p className="text-sm text-neutral-600">Pengaturan notifikasi sistem</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
                  <div>
                    <p className="font-medium text-neutral-900">Email Notifikasi</p>
                    <p className="text-sm text-neutral-600">Kirim notifikasi melalui email</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.emailNotifications}
                      onChange={(e) => setSettings({ ...settings, emailNotifications: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-neutral-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
              </div>
            </Card>

            {/* Database Settings */}
            <Card>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Database className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-neutral-900">Database & Backup</h3>
                  <p className="text-sm text-neutral-600">Pengaturan database dan backup</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
                  <div>
                    <p className="font-medium text-neutral-900">Mode Maintenance</p>
                    <p className="text-sm text-neutral-600">Nonaktifkan akses sementara untuk maintenance</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.systemMaintenance}
                      onChange={(e) => setSettings({ ...settings, systemMaintenance: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-neutral-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex-1">
                    <p className="font-medium text-neutral-900 mb-1">Backup Database</p>
                    <p className="text-sm text-neutral-600">Terakhir backup: 1 jam yang lalu</p>
                  </div>
                  <Button variant="outline">
                    Backup Sekarang
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
