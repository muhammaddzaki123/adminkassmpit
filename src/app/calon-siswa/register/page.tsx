'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { ArrowLeft, UserPlus, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function RegisterCalonSiswaPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    nama: '',
    nisn: '',
    tempatLahir: '',
    tanggalLahir: '',
    jenisKelamin: 'L',
    agama: '',
    alamat: '',
    noTelp: '',
    email: '',
    namaAyah: '',
    namaIbu: '',
    noTelpOrtu: '',
    pekerjaanAyah: '',
    pekerjaanIbu: '',
    enrollmentType: 'NEW',
    kelasYangDituju: '',
    asalSekolah: '',
    password: '',
    confirmPassword: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateStep1 = () => {
    if (!formData.nama || !formData.nisn || !formData.tanggalLahir || !formData.email) {
      alert('Harap lengkapi data pribadi yang wajib diisi');
      return false;
    }
    if (formData.nisn.length !== 10) {
      alert('NISN harus 10 digit');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!formData.namaAyah || !formData.namaIbu || !formData.noTelpOrtu) {
      alert('Harap lengkapi data orang tua');
      return false;
    }
    return true;
  };

  const validateStep3 = () => {
    if (!formData.kelasYangDituju || !formData.enrollmentType) {
      alert('Harap lengkapi data pendaftaran');
      return false;
    }
    if (formData.enrollmentType === 'TRANSFER' && !formData.asalSekolah) {
      alert('Asal sekolah harus diisi untuk siswa pindahan');
      return false;
    }
    if (!formData.password || formData.password.length < 6) {
      alert('Password minimal 6 karakter');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      alert('Password dan konfirmasi password tidak sama');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2);
    } else if (currentStep === 2 && validateStep2()) {
      setCurrentStep(3);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateStep3()) return;

    setIsLoading(true);

    try {
      const response = await fetch('/api/calon-siswa/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        alert(
          `Pendaftaran berhasil!\n\n` +
          `NISN: ${formData.nisn}\n` +
          `Password: ${formData.password}\n\n` +
          `Silakan login menggunakan NISN dan password Anda.`
        );
        router.push('/calon-siswa/login');
      } else {
        alert(data.error || 'Pendaftaran gagal');
      }
    } catch (error) {
      console.error('Registration error:', error);
      alert('Terjadi kesalahan saat mendaftar');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-primary-50 to-blue-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <Link href="/calon-siswa/login" className="inline-flex items-center text-neutral-700 hover:text-primary mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Kembali ke Login
        </Link>

        <Card className="p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
              <UserPlus className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-neutral-900 mb-2">Pendaftaran Calon Siswa</h1>
            <p className="text-neutral-600">SMP IT Assalaam</p>
          </div>

          <div className="flex justify-between mb-8">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex-1 flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                  currentStep >= step ? 'bg-primary text-white' : 'bg-neutral-200 text-neutral-500'
                }`}>
                  {currentStep > step ? <CheckCircle className="w-6 h-6" /> : step}
                </div>
                {step < 3 && (
                  <div className={`flex-1 h-1 mx-2 ${
                    currentStep > step ? 'bg-primary' : 'bg-neutral-200'
                  }`} />
                )}
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            {currentStep === 1 && (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold mb-4">Data Pribadi Siswa</h3>
                
                <Input
                  label="Nama Lengkap"
                  name="nama"
                  placeholder="Masukkan nama lengkap"
                  value={formData.nama}
                  onChange={handleInputChange}
                  required
                />

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="NISN"
                    name="nisn"
                    placeholder="10 digit NISN"
                    value={formData.nisn}
                    onChange={handleInputChange}
                    maxLength={10}
                    required
                  />
                  <Input
                    label="Email"
                    name="email"
                    type="email"
                    placeholder="email@contoh.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Tempat Lahir"
                    name="tempatLahir"
                    placeholder="Kota kelahiran"
                    value={formData.tempatLahir}
                    onChange={handleInputChange}
                  />
                  <Input
                    label="Tanggal Lahir"
                    name="tanggalLahir"
                    type="date"
                    value={formData.tanggalLahir}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Select
                    label="Jenis Kelamin"
                    name="jenisKelamin"
                    value={formData.jenisKelamin}
                    onChange={handleInputChange}
                    options={[
                      { value: 'L', label: 'Laki-laki' },
                      { value: 'P', label: 'Perempuan' },
                    ]}
                    required
                  />
                  <Input
                    label="Agama"
                    name="agama"
                    placeholder="Islam"
                    value={formData.agama}
                    onChange={handleInputChange}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Alamat</label>
                  <textarea
                    name="alamat"
                    className="w-full p-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    rows={3}
                    placeholder="Alamat lengkap"
                    value={formData.alamat}
                    onChange={handleInputChange}
                  />
                </div>

                <Input
                  label="No. Telepon"
                  name="noTelp"
                  placeholder="08xxxxxxxxxx"
                  value={formData.noTelp}
                  onChange={handleInputChange}
                />

                <div className="flex justify-end pt-4">
                  <Button type="button" onClick={handleNext}>
                    Selanjutnya
                  </Button>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold mb-4">Data Orang Tua/Wali</h3>

                <Input
                  label="Nama Ayah"
                  name="namaAyah"
                  placeholder="Nama lengkap ayah"
                  value={formData.namaAyah}
                  onChange={handleInputChange}
                  required
                />

                <Input
                  label="Pekerjaan Ayah"
                  name="pekerjaanAyah"
                  placeholder="Pekerjaan ayah"
                  value={formData.pekerjaanAyah}
                  onChange={handleInputChange}
                />

                <Input
                  label="Nama Ibu"
                  name="namaIbu"
                  placeholder="Nama lengkap ibu"
                  value={formData.namaIbu}
                  onChange={handleInputChange}
                  required
                />

                <Input
                  label="Pekerjaan Ibu"
                  name="pekerjaanIbu"
                  placeholder="Pekerjaan ibu"
                  value={formData.pekerjaanIbu}
                  onChange={handleInputChange}
                />

                <Input
                  label="No. Telepon Orang Tua"
                  name="noTelpOrtu"
                  placeholder="08xxxxxxxxxx"
                  value={formData.noTelpOrtu}
                  onChange={handleInputChange}
                  required
                />

                <div className="flex justify-between pt-4">
                  <Button type="button" variant="outline" onClick={() => setCurrentStep(1)}>
                    Kembali
                  </Button>
                  <Button type="button" onClick={handleNext}>
                    Selanjutnya
                  </Button>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold mb-4">Data Pendaftaran</h3>

                <Select
                  label="Jenis Pendaftaran"
                  name="enrollmentType"
                  value={formData.enrollmentType}
                  onChange={handleInputChange}
                  options={[
                    { value: 'NEW', label: 'Siswa Baru' },
                    { value: 'TRANSFER', label: 'Pindahan' },
                  ]}
                  required
                />

                <Input
                  label="Kelas yang Dituju"
                  name="kelasYangDituju"
                  placeholder="Contoh: 7"
                  value={formData.kelasYangDituju}
                  onChange={handleInputChange}
                  required
                />

                {formData.enrollmentType === 'TRANSFER' && (
                  <Input
                    label="Asal Sekolah"
                    name="asalSekolah"
                    placeholder="Nama sekolah asal"
                    value={formData.asalSekolah}
                    onChange={handleInputChange}
                    required
                  />
                )}

                <div className="border-t border-neutral-200 pt-4 mt-6">
                  <h4 className="font-semibold mb-4">Buat Password untuk Login</h4>
                  
                  <Input
                    label="Password"
                    name="password"
                    type="password"
                    placeholder="Minimal 6 karakter"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                  />

                  <Input
                    label="Konfirmasi Password"
                    name="confirmPassword"
                    type="password"
                    placeholder="Ketik ulang password"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                  <p className="text-sm text-blue-800">
                    Setelah mendaftar, Anda akan login menggunakan <strong>NISN</strong> dan <strong>password</strong> yang dibuat.
                  </p>
                </div>

                <div className="flex justify-between pt-4">
                  <Button type="button" variant="outline" onClick={() => setCurrentStep(2)}>
                    Kembali
                  </Button>
                  <Button type="submit" isLoading={isLoading}>
                    Daftar Sekarang
                  </Button>
                </div>
              </div>
            )}
          </form>
        </Card>

        <p className="text-center text-neutral-600 mt-6">
          Sudah punya akun?{' '}
          <Link href="/calon-siswa/login" className="text-primary hover:underline font-semibold">
            Login di sini
          </Link>
        </p>
      </div>
    </div>
  );
}
