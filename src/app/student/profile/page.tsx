'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { StudentSidebar } from '@/components/layout/StudentSidebar';
import { StudentHeader } from '@/components/layout/StudentHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { User, Mail, Phone, MapPin, School, CreditCard, Edit } from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({
    nama: 'Ahmad Zaki',
    nisn: '001234567',
    kelas: '8A',
    email: 'ahmad.zaki@student.school.id',
    noTelp: '08123456789',
    alamat: 'Jl. Pendidikan No. 123, Jakarta',
    namaOrangTua: 'Bapak Ahmad',
    noTelpOrangTua: '08198765432',
    virtualAccount: '8888812345678901',
  });

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/auth/login');
      return;
    }

    const user = JSON.parse(userData);
    if (user.role !== 'STUDENT') {
      router.push('/auth/login');
      return;
    }
  }, [router]);

  const handleSave = () => {
    // Save profile changes
    alert('Profil berhasil diperbarui!');
    setIsEditing(false);
  };

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <div className="hidden lg:block">
        <StudentSidebar />
      </div>

      {isMobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="fixed left-0 top-0 bottom-0 z-50 lg:hidden">
            <StudentSidebar />
          </div>
        </>
      )}

      <div className="flex-1 flex flex-col min-w-0 lg:ml-64">
        <StudentHeader onMenuClick={() => setIsMobileMenuOpen(true)} />
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto mt-16">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-neutral-900">Profil Siswa</h1>
                <p className="text-neutral-600 mt-1">Informasi data pribadi Anda</p>
              </div>
              {!isEditing && (
                <Button icon={<Edit className="w-4 h-4" />} onClick={() => setIsEditing(true)}>
                  Edit Profil
                </Button>
              )}
            </div>

            {/* Profile Picture */}
            <Card>
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center">
                  <User className="w-12 h-12 text-primary-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-neutral-900">{profile.nama}</h2>
                  <p className="text-neutral-600">NISN: {profile.nisn}</p>
                  <p className="text-neutral-600">Kelas: {profile.kelas}</p>
                </div>
              </div>
            </Card>

            {/* Personal Information */}
            <Card>
              <h3 className="text-lg font-semibold text-neutral-900 mb-4">Data Pribadi</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Nama Lengkap
                    </div>
                  </label>
                  <Input
                    value={profile.nama}
                    onChange={(e) => setProfile({ ...profile, nama: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      <div className="flex items-center gap-2">
                        <School className="w-4 h-4" />
                        NISN
                      </div>
                    </label>
                    <Input value={profile.nisn} disabled />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      <div className="flex items-center gap-2">
                        <School className="w-4 h-4" />
                        Kelas
                      </div>
                    </label>
                    <Input value={profile.kelas} disabled />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Email
                    </div>
                  </label>
                  <Input
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      No. Telepon
                    </div>
                  </label>
                  <Input
                    value={profile.noTelp}
                    onChange={(e) => setProfile({ ...profile, noTelp: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Alamat
                    </div>
                  </label>
                  <Input
                    value={profile.alamat}
                    onChange={(e) => setProfile({ ...profile, alamat: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>
              </div>
            </Card>

            {/* Parent Information */}
            <Card>
              <h3 className="text-lg font-semibold text-neutral-900 mb-4">Data Orang Tua</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Nama Orang Tua / Wali
                    </div>
                  </label>
                  <Input
                    value={profile.namaOrangTua}
                    onChange={(e) => setProfile({ ...profile, namaOrangTua: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      No. Telepon Orang Tua
                    </div>
                  </label>
                  <Input
                    value={profile.noTelpOrangTua}
                    onChange={(e) => setProfile({ ...profile, noTelpOrangTua: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>
              </div>
            </Card>

            {/* Payment Information */}
            <Card>
              <h3 className="text-lg font-semibold text-neutral-900 mb-4">Informasi Pembayaran</h3>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    Virtual Account Number
                  </div>
                </label>
                <div className="flex items-center gap-3">
                  <Input value={profile.virtualAccount} disabled />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(profile.virtualAccount);
                      alert('Nomor VA berhasil disalin!');
                    }}
                  >
                    Salin
                  </Button>
                </div>
                <p className="text-xs text-neutral-600 mt-2">
                  Gunakan nomor ini untuk pembayaran via Virtual Account
                </p>
              </div>
            </Card>

            {isEditing && (
              <div className="flex gap-3">
                <Button onClick={handleSave} className="flex-1">
                  Simpan Perubahan
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                  className="flex-1"
                >
                  Batal
                </Button>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
