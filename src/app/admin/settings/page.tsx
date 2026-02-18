'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { fetchWithAuth } from '@/lib/api-client';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Settings, DollarSign, Bell, Save, RefreshCw } from 'lucide-react';

interface Setting {
  id: string;
  key: string;
  value: string;
  type: string;
  category: string;
  description: string | null;
}

interface GroupedSettings {
  FEES: Setting[];
  NOTIFICATION: Setting[];
  SYSTEM: Setting[];
}

export default function SettingsPage() {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [settings, setSettings] = useState<GroupedSettings>({
    FEES: [],
    NOTIFICATION: [],
    SYSTEM: []
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);

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

    fetchSettings();
  }, [router]);

  const fetchSettings = async () => {
    try {
      const response = await fetchWithAuth('/api/admin/settings');
      const result = await response.json();

      if (result.success && result.data) {
        const grouped = result.data.grouped || {};
        setSettings({
          FEES: Array.isArray(grouped.FEES) ? grouped.FEES : [],
          NOTIFICATION: Array.isArray(grouped.NOTIFICATION) ? grouped.NOTIFICATION : [],
          SYSTEM: Array.isArray(grouped.SYSTEM) ? grouped.SYSTEM : []
        });
      } else {
        // If no data or error, set empty arrays
        setSettings({
          FEES: [],
          NOTIFICATION: [],
          SYSTEM: []
        });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      // Set empty arrays on error
      setSettings({
        FEES: [],
        NOTIFICATION: [],
        SYSTEM: []
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSeedDefaults = async () => {
    if (!confirm('Apakah Anda yakin ingin menginisialisasi pengaturan default? Ini akan menambahkan pengaturan baru tanpa menghapus yang sudah ada.')) {
      return;
    }

    setSeeding(true);
    try {
      const response = await fetchWithAuth('/api/admin/settings', {
        method: 'POST'
      });

      const result = await response.json();

      if (result.success) {
        alert('Pengaturan default berhasil diinisialisasi!');
        fetchSettings();
      } else {
        alert('Gagal menginisialisasi pengaturan: ' + result.error);
      }
    } catch (error) {
      console.error('Error seeding settings:', error);
      alert('Terjadi kesalahan saat menginisialisasi pengaturan');
    } finally {
      setSeeding(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const userData = localStorage.getItem('user');
      const user = JSON.parse(userData || '{}');

      const allSettings = [
        ...settings.FEES,
        ...settings.NOTIFICATION,
        ...settings.SYSTEM
      ];

      const response = await fetchWithAuth('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          settings: allSettings.map(s => ({ key: s.key, value: s.value })),
          updatedBy: user.id
        })
      });

      const result = await response.json();

      if (result.success) {
        alert('Pengaturan berhasil disimpan!');
      } else {
        alert('Gagal menyimpan pengaturan: ' + result.error);
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Terjadi kesalahan saat menyimpan pengaturan');
    } finally {
      setSaving(false);
    }
  };

  const updateSettingValue = (category: keyof GroupedSettings, key: string, value: string) => {
    setSettings(prev => ({
      ...prev,
      [category]: prev[category].map(s =>
        s.key === key ? { ...s, value } : s
      )
    }));
  };

  const formatCurrency = (value: string) => {
    const number = parseInt(value.replace(/\D/g, ''));
    return isNaN(number) ? '' : number.toLocaleString('id-ID');
  };

  const parseCurrency = (formatted: string) => {
    return formatted.replace(/\D/g, '');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-neutral-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-neutral-600">Memuat pengaturan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <div className="hidden lg:block">
        <Sidebar userRole="admin" />
      </div>

      {isMobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="fixed left-0 top-0 bottom-0 z-50 lg:hidden">
            <Sidebar userRole="admin" />
          </div>
        </>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <Header onMenuClick={() => setIsMobileMenuOpen(true)} />

        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-neutral-900 flex items-center gap-3">
                  <Settings className="w-8 h-8 text-primary-600" />
                  Pengaturan Sistem
                </h1>
                <p className="text-neutral-600 mt-1">Kelola konfigurasi biaya, notifikasi, dan sistem</p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  icon={<RefreshCw className="w-4 h-4" />}
                  onClick={handleSeedDefaults}
                  disabled={seeding}
                >
                  {seeding ? 'Menginisialisasi...' : 'Inisialisasi Default'}
                </Button>
                <Button
                  icon={<Save className="w-4 h-4" />}
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                </Button>
              </div>
            </div>

            {/* Fees Settings */}
            <Card>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-green-100 rounded-lg">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-neutral-900">Pengaturan Biaya</h2>
                  <p className="text-sm text-neutral-600">Konfigurasi biaya pendaftaran dan pembayaran</p>
                </div>
              </div>

              <div className="space-y-4">
                {!settings.FEES || settings.FEES.length === 0 ? (
                  <div className="text-center py-8 text-neutral-500">
                    <p>Belum ada pengaturan biaya. Klik &ldquo;Inisialisasi Default&rdquo; untuk menambahkan.</p>
                  </div>
                ) : (
                  settings.FEES.map((setting) => (
                    <div key={setting.id} className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-neutral-50 rounded-lg">
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">
                          {setting.key.replace(/_/g, ' ')}
                        </label>
                        {setting.description && (
                          <p className="text-xs text-neutral-500">{setting.description}</p>
                        )}
                      </div>
                      <div>
                        <Input
                          type="text"
                          value={formatCurrency(setting.value)}
                          onChange={(e) => {
                            const rawValue = parseCurrency(e.target.value);
                            updateSettingValue('FEES', setting.key, rawValue);
                          }}
                          placeholder="0"
                          prefix="Rp"
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>

            {/* Notification Settings */}
            <Card>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Bell className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-neutral-900">Pengaturan Notifikasi</h2>
                  <p className="text-sm text-neutral-600">Konfigurasi email dan WhatsApp notifikasi</p>
                </div>
              </div>

              <div className="space-y-4">
                {!settings.NOTIFICATION || settings.NOTIFICATION.length === 0 ? (
                  <div className="text-center py-8 text-neutral-500">
                    <p>Belum ada pengaturan notifikasi. Klik &ldquo;Inisialisasi Default&rdquo; untuk menambahkan.</p>
                  </div>
                ) : (
                  settings.NOTIFICATION.map((setting) => (
                    <div key={setting.id} className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-neutral-50 rounded-lg">
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">
                          {setting.key.replace(/_/g, ' ')}
                        </label>
                        {setting.description && (
                          <p className="text-xs text-neutral-500">{setting.description}</p>
                        )}
                      </div>
                      <div>
                        {setting.type === 'BOOLEAN' ? (
                          <div className="flex items-center gap-3">
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={setting.value === 'true'}
                                onChange={(e) =>
                                  updateSettingValue('NOTIFICATION', setting.key, e.target.checked ? 'true' : 'false')
                                }
                              />
                              <div className="w-11 h-6 bg-neutral-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                              <span className="ml-3 text-sm font-medium text-neutral-700">
                                {setting.value === 'true' ? 'Aktif' : 'Nonaktif'}
                              </span>
                            </label>
                          </div>
                        ) : (
                          <Input
                            type="text"
                            value={setting.value}
                            onChange={(e) =>
                              updateSettingValue('NOTIFICATION', setting.key, e.target.value)
                            }
                            placeholder={setting.key.includes('KEY') ? 'Masukkan API key...' : 'Masukkan nilai...'}
                          />
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>

            {/* System Settings */}
            <Card>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Settings className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-neutral-900">Pengaturan Sistem</h2>
                  <p className="text-sm text-neutral-600">Konfigurasi umum sistem</p>
                </div>
              </div>

              <div className="space-y-4">
                {!settings.SYSTEM || settings.SYSTEM.length === 0 ? (
                  <div className="text-center py-8 text-neutral-500">
                    <p>Belum ada pengaturan sistem. Klik &ldquo;Inisialisasi Default&rdquo; untuk menambahkan.</p>
                  </div>
                ) : (
                  settings.SYSTEM.map((setting) => (
                    <div key={setting.id} className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-neutral-50 rounded-lg">
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">
                          {setting.key.replace(/_/g, ' ')}
                        </label>
                        {setting.description && (
                          <p className="text-xs text-neutral-500">{setting.description}</p>
                        )}
                      </div>
                      <div>
                        {setting.type === 'BOOLEAN' ? (
                          <div className="flex items-center gap-3">
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={setting.value === 'true'}
                                onChange={(e) =>
                                  updateSettingValue('SYSTEM', setting.key, e.target.checked ? 'true' : 'false')
                                }
                              />
                              <div className="w-11 h-6 bg-neutral-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                              <span className="ml-3 text-sm font-medium text-neutral-700">
                                {setting.value === 'true' ? 'Aktif' : 'Nonaktif'}
                              </span>
                            </label>
                          </div>
                        ) : (
                          <Input
                            type="text"
                            value={setting.value}
                            onChange={(e) =>
                              updateSettingValue('SYSTEM', setting.key, e.target.value)
                            }
                            placeholder="Masukkan nilai..."
                          />
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
