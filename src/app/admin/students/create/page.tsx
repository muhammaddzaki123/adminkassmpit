'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchWithAuth } from '@/lib/api-client';
import { AdminHeader } from '@/components/layout/AdminHeader';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { ArrowLeft, Save, School, CalendarRange } from 'lucide-react';

interface ClassOption {
  id: string;
  name: string;
  grade: number;
}

interface AcademicYearOption {
  id: string;
  year: string;
  isActive: boolean;
}

export default function CreateStudentPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYearOption[]>([]);
  const [formData, setFormData] = useState({
    nama: '',
    nisn: '',
    classId: '',
    academicYearId: '',
    tempatLahir: '',
    tanggalLahir: '',
    jenisKelamin: 'L',
    alamat: '',
    namaAyah: '',
    namaIbu: '',
    noTelpOrtu: '',
  });

  const activeAcademicYearId = useMemo(
    () => academicYears.find((item) => item.isActive)?.id || academicYears[0]?.id || '',
    [academicYears]
  );

  useEffect(() => {
    const load = async () => {
      try {
        const [classesRes, yearsRes] = await Promise.all([
          fetchWithAuth('/api/admin/classes'),
          fetchWithAuth('/api/admin/academic-years'),
        ]);

        if (classesRes.ok) {
          const classesJson = await classesRes.json();
          setClasses(classesJson.data || []);
        }

        if (yearsRes.ok) {
          const yearsJson = await yearsRes.json();
          setAcademicYears(yearsJson.data || []);
          const activeYear = (yearsJson.data || []).find((item: AcademicYearOption) => item.isActive);
          if (activeYear) {
            setFormData((prev) => ({ ...prev, academicYearId: activeYear.id }));
          }
        }
      } catch (error) {
        console.error('Failed to load class/year options:', error);
      }
    };

    void load();
  }, []);

  useEffect(() => {
    if (!formData.academicYearId && activeAcademicYearId) {
      setFormData((prev) => ({ ...prev, academicYearId: activeAcademicYearId }));
    }
  }, [activeAcademicYearId, formData.academicYearId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nama || !formData.nisn || !formData.classId || !formData.academicYearId) {
      alert('Nama, NISN, Kelas, dan Tahun Ajaran harus diisi');
      return;
    }

    setIsSubmitting(true);

    try {
      const userData = localStorage.getItem('user');
      const adminId = userData ? JSON.parse(userData).id : '';

      const response = await fetchWithAuth('/api/admin/students/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, adminId }),
      });

      if (response.ok) {
        const result = await response.json();
        const { username, password } = result.data.credentials;

        alert(
          `✅ Siswa berhasil ditambahkan!\n\n` +
          `Username: ${username}\n` +
          `Password: ${password}\n\n` +
          `Harap simpan informasi ini dengan baik.`
        );

        router.push('/admin/students');
      } else {
        const error = await response.json();
        alert(error.message || 'Gagal menambahkan siswa');
      }
    } catch (error) {
      console.error('Error creating student:', error);
      alert('Terjadi kesalahan');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <AdminSidebar />
      <div className="ml-64">
        <AdminHeader />
        <main className="pt-16 p-8">
          <div className="max-w-3xl mx-auto">
            <Button
              variant="ghost"
              icon={<ArrowLeft className="w-4 h-4" />}
              onClick={() => router.back()}
              className="mb-4"
            >
              Kembali
            </Button>

            <Card className="mb-6">
              <h1 className="text-2xl font-bold text-neutral-900 mb-2">Tambah Siswa Langsung</h1>
              <p className="text-neutral-600">
                Tambahkan siswa baru tanpa melalui proses pendaftaran calon siswa
              </p>
            </Card>

            <form onSubmit={handleSubmit}>
              <Card className="mb-6">
                <h3 className="text-lg font-semibold mb-4">Data Siswa</h3>
                <div className="space-y-4">
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
                      <div className="grid grid-cols-1 gap-4">
                        <Select
                          label="Tahun Ajaran"
                          name="academicYearId"
                          value={formData.academicYearId}
                          onChange={handleInputChange}
                          options={[
                            { value: '', label: 'Pilih Tahun Ajaran' },
                            ...academicYears.map((year) => ({
                              value: year.id,
                              label: `${year.year}${year.isActive ? ' (Aktif)' : ''}`,
                            })),
                          ]}
                          required
                        />
                        <Select
                          label="Kelas"
                          name="classId"
                          value={formData.classId}
                          onChange={handleInputChange}
                          options={[
                            { value: '', label: 'Pilih Kelas' },
                            ...classes.map((item) => ({
                              value: item.id,
                              label: `Kelas ${item.grade} - ${item.name}`,
                            })),
                          ]}
                          required
                        />
                      </div>
                  </div>

                    <div className="rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3 flex items-start gap-3">
                      <School className="w-5 h-5 text-primary-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-neutral-900">Assignment cepat</p>
                        <p className="text-xs text-neutral-600 mt-1">
                          Pilih tahun ajaran aktif dan kelas untuk langsung membuat relasi siswa ke kelas+tahun ajaran.
                        </p>
                      </div>
                    </div>

                    <div className="rounded-lg border border-neutral-200 bg-primary-50 px-4 py-3 flex items-start gap-3">
                      <CalendarRange className="w-5 h-5 text-primary-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-neutral-900">Default tahun ajaran</p>
                        <p className="text-xs text-neutral-600 mt-1">
                          Sistem otomatis mengisi tahun ajaran aktif jika belum dipilih manual.
                        </p>
                      </div>
                    </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Tempat Lahir"
                      name="tempatLahir"
                      placeholder="Masukkan tempat lahir"
                      value={formData.tempatLahir}
                      onChange={handleInputChange}
                    />
                    <Input
                      label="Tanggal Lahir"
                      name="tanggalLahir"
                      type="date"
                      value={formData.tanggalLahir}
                      onChange={handleInputChange}
                    />
                  </div>

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

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Alamat
                    </label>
                    <textarea
                      name="alamat"
                      className="w-full p-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      rows={3}
                      placeholder="Masukkan alamat lengkap"
                      value={formData.alamat}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </Card>

              <Card className="mb-6">
                <h3 className="text-lg font-semibold mb-4">Data Orang Tua/Wali</h3>
                <div className="space-y-4">
                  <Input
                    label="Nama Ayah"
                    name="namaAyah"
                    placeholder="Masukkan nama ayah"
                    value={formData.namaAyah}
                    onChange={handleInputChange}
                  />
                  <Input
                    label="Nama Ibu"
                    name="namaIbu"
                    placeholder="Masukkan nama ibu"
                    value={formData.namaIbu}
                    onChange={handleInputChange}
                  />
                  <Input
                    label="No. Telepon Orang Tua"
                    name="noTelpOrtu"
                    placeholder="08xxxxxxxxxx"
                    value={formData.noTelpOrtu}
                    onChange={handleInputChange}
                  />
                </div>
              </Card>

              <Card>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-amber-800">
                    ⚠️ Setelah submit, username dan password akan ditampilkan <strong>SATU KALI</strong>. Harap simpan dengan baik.
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button
                    type="submit"
                    icon={<Save className="w-4 h-4" />}
                    isLoading={isSubmitting}
                    fullWidth
                  >
                    Simpan Siswa
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    fullWidth
                    onClick={() => router.back()}
                  >
                    Batal
                  </Button>
                </div>
              </Card>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
