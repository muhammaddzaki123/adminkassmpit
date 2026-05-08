'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { fetchWithAuth } from '@/lib/api-client';
import { AdminHeader } from '@/components/layout/AdminHeader';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { ArrowLeft, Save, User, School, Users } from 'lucide-react';

type StudentStatus = 'ACTIVE' | 'AWAITING_REREG' | 'GRADUATED' | 'ARCHIVED' | 'DROPPED_OUT' | 'TRANSFERRED';

interface StudentDetail {
  id: string;
  nama: string;
  nisn: string;
  noTelp: string | null;
  email: string | null;
  alamat: string | null;
  namaOrangTua: string | null;
  noTelpOrangTua: string | null;
  status: StudentStatus;
  virtualAccount: string | null;
  enrollmentType: string | null;
  admissionDate: string;
  graduationDate: string | null;
  birthPlace: string | null;
  birthDate: string | null;
  gender: string | null;
  religion: string | null;
  allowInstallments: boolean;
  currentClass: {
    classId: string;
    className: string;
    grade: number;
    academicYearId: string;
    academicYear: string;
    isActive: boolean;
  } | null;
  linkedAccount: {
    id: string;
    username: string;
    email: string | null;
    nama: string;
    role: string;
    isActive: boolean;
  } | null;
}

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

export default function EditStudentPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const studentId = params?.id;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [student, setStudent] = useState<StudentDetail | null>(null);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYearOption[]>([]);

  const [formData, setFormData] = useState({
    nama: '',
    nisn: '',
    noTelp: '',
    email: '',
    allowInstallments: false,
    alamat: '',
    namaOrangTua: '',
    noTelpOrangTua: '',
    status: 'ACTIVE' as StudentStatus,
    virtualAccount: '',
    enrollmentType: 'CONTINUING',
    admissionDate: '',
    graduationDate: '',
    birthPlace: '',
    birthDate: '',
    gender: '',
    religion: '',
    classId: '',
    academicYearId: '',
  });

  const activeAcademicYearId = useMemo(
    () => academicYears.find((item) => item.isActive)?.id || academicYears[0]?.id || '',
    [academicYears]
  );

  useEffect(() => {
    if (!studentId) return;

    const load = async () => {
      try {
        const [studentRes, classesRes, yearsRes] = await Promise.all([
          fetchWithAuth(`/api/admin/students/${studentId}`),
          fetchWithAuth('/api/admin/classes'),
          fetchWithAuth('/api/admin/academic-years'),
        ]);

        if (!studentRes.ok) throw new Error('Gagal memuat data siswa');
        if (!classesRes.ok) throw new Error('Gagal memuat data kelas');
        if (!yearsRes.ok) throw new Error('Gagal memuat data tahun ajaran');

        const studentJson = await studentRes.json();
        const classesJson = await classesRes.json();
        const yearsJson = await yearsRes.json();

        const studentData: StudentDetail = studentJson.data;
        setStudent(studentData);
        setClasses(classesJson.data || []);
        setAcademicYears(yearsJson.data || []);

        setFormData({
          nama: studentData.nama,
          nisn: studentData.nisn,
          noTelp: studentData.noTelp || '',
          email: studentData.email || '',
          allowInstallments: studentData.allowInstallments,
          alamat: studentData.alamat || '',
          namaOrangTua: studentData.namaOrangTua || '',
          noTelpOrangTua: studentData.noTelpOrangTua || '',
          status: studentData.status,
          virtualAccount: studentData.virtualAccount || '',
          enrollmentType: studentData.enrollmentType || 'CONTINUING',
          admissionDate: studentData.admissionDate ? studentData.admissionDate.slice(0, 10) : '',
          graduationDate: studentData.graduationDate ? studentData.graduationDate.slice(0, 10) : '',
          birthPlace: studentData.birthPlace || '',
          birthDate: studentData.birthDate ? studentData.birthDate.slice(0, 10) : '',
          gender: studentData.gender || '',
          religion: studentData.religion || '',
          classId: studentData.currentClass?.classId || '',
          academicYearId: studentData.currentClass?.academicYearId || activeAcademicYearId,
        });
      } catch (error) {
        console.error('Failed to load edit form:', error);
        alert(error instanceof Error ? error.message : 'Gagal memuat data siswa');
        router.push('/admin/students');
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [activeAcademicYearId, router, studentId]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!studentId) return;
    if (!formData.nama || !formData.nisn || !formData.status) {
      alert('Nama, NISN, dan status harus diisi');
      return;
    }

    if (formData.classId && !formData.academicYearId) {
      alert('Tahun ajaran wajib dipilih jika kelas diubah');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetchWithAuth(`/api/admin/students/${studentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Gagal memperbarui data siswa');
      }

      alert('Data siswa berhasil diperbarui');
      router.push('/admin/students');
    } catch (error) {
      console.error('Error updating student:', error);
      alert(error instanceof Error ? error.message : 'Terjadi kesalahan saat menyimpan data siswa');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <p className="text-neutral-600">Memuat data siswa...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <AdminSidebar />
      <div className="lg:ml-64">
        <AdminHeader />
        <main className="pt-16 p-4 sm:p-6 lg:p-8">
          <div className="max-w-4xl mx-auto">
            <Button
              variant="ghost"
              icon={<ArrowLeft className="w-4 h-4" />}
              onClick={() => router.back()}
              className="mb-4"
            >
              Kembali
            </Button>

            <Card className="mb-6">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <h1 className="text-2xl font-bold text-neutral-900 mb-2">Edit Data Siswa</h1>
                  <p className="text-neutral-600">
                    Perbarui identitas siswa, data orang tua, status, dan penempatan kelas aktif.
                  </p>
                </div>
                {student?.linkedAccount && (
                  <div className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm">
                    <p className="font-semibold text-neutral-900">Akun Terkait</p>
                    <p className="text-neutral-600">{student.linkedAccount.username}</p>
                    <p className="text-neutral-500 text-xs">Role: {student.linkedAccount.role}</p>
                  </div>
                )}
              </div>
            </Card>

            <form onSubmit={handleSubmit} className="space-y-6">
              <Card>
                <div className="flex items-center gap-2 mb-4">
                  <User className="w-5 h-5 text-primary-600" />
                  <h2 className="text-lg font-semibold text-neutral-900">Identitas Siswa</h2>
                </div>
                <div className="space-y-4">
                  <Input
                    label="Nama Lengkap"
                    name="nama"
                    value={formData.nama}
                    onChange={handleChange}
                    required
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="NISN"
                      name="nisn"
                      value={formData.nisn}
                      onChange={handleChange}
                      required
                    />
                    <Input
                      label="Virtual Account"
                      name="virtualAccount"
                      value={formData.virtualAccount}
                      onChange={handleChange}
                      placeholder="Opsional"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Email"
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                    />
                    <Input
                      label="No. Telepon"
                      name="noTelp"
                      value={formData.noTelp}
                      onChange={handleChange}
                    />
                  </div>

                  <Input
                    label="Alamat"
                    name="alamat"
                    value={formData.alamat}
                    onChange={handleChange}
                  />
                </div>
              </Card>

              <Card>
                <div className="flex items-center gap-2 mb-4">
                  <Users className="w-5 h-5 text-primary-600" />
                  <h2 className="text-lg font-semibold text-neutral-900">Data Orang Tua / Wali</h2>
                </div>
                <div className="space-y-4">
                  <Input
                    label="Nama Orang Tua / Wali"
                    name="namaOrangTua"
                    value={formData.namaOrangTua}
                    onChange={handleChange}
                  />
                  <Input
                    label="No. Telepon Orang Tua / Wali"
                    name="noTelpOrangTua"
                    value={formData.noTelpOrangTua}
                    onChange={handleChange}
                  />
                </div>
              </Card>

              <Card>
                <div className="flex items-center gap-2 mb-4">
                  <School className="w-5 h-5 text-primary-600" />
                  <h2 className="text-lg font-semibold text-neutral-900">Data Akademik</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select
                    label="Status Siswa"
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    options={[
                      { value: 'ACTIVE', label: 'Aktif' },
                      { value: 'AWAITING_REREG', label: 'Menunggu Daftar Ulang' },
                      { value: 'GRADUATED', label: 'Lulus' },
                      { value: 'ARCHIVED', label: 'Diarsipkan' },
                      { value: 'DROPPED_OUT', label: 'Keluar / DO' },
                      { value: 'TRANSFERRED', label: 'Pindah' },
                    ]}
                  />

                  <Select
                    label="Jenis Masuk"
                    name="enrollmentType"
                    value={formData.enrollmentType}
                    onChange={handleChange}
                    options={[
                      { value: 'NEW', label: 'Baru' },
                      { value: 'CONTINUING', label: 'Lanjutan' },
                      { value: 'TRANSFER', label: 'Pindahan' },
                    ]}
                  />

                  <Input
                    label="Tempat Lahir"
                    name="birthPlace"
                    value={formData.birthPlace}
                    onChange={handleChange}
                  />

                  <Input
                    label="Tanggal Lahir"
                    type="date"
                    name="birthDate"
                    value={formData.birthDate}
                    onChange={handleChange}
                  />

                  <Select
                    label="Jenis Kelamin"
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    options={[
                      { value: '', label: 'Pilih Jenis Kelamin' },
                      { value: 'L', label: 'Laki-laki' },
                      { value: 'P', label: 'Perempuan' },
                    ]}
                  />

                  <Input
                    label="Agama"
                    name="religion"
                    value={formData.religion}
                    onChange={handleChange}
                  />

                  <Input
                    label="Tanggal Masuk"
                    type="date"
                    name="admissionDate"
                    value={formData.admissionDate}
                    onChange={handleChange}
                  />

                  <Input
                    label="Tanggal Lulus"
                    type="date"
                    name="graduationDate"
                    value={formData.graduationDate}
                    onChange={handleChange}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <Select
                    label="Tahun Ajaran"
                    name="academicYearId"
                    value={formData.academicYearId}
                    onChange={handleChange}
                    options={[
                      { value: '', label: 'Pilih Tahun Ajaran' },
                      ...academicYears.map((year) => ({
                        value: year.id,
                        label: `${year.year}${year.isActive ? ' (Aktif)' : ''}`,
                      })),
                    ]}
                  />

                  <Select
                    label="Kelas Aktif"
                    name="classId"
                    value={formData.classId}
                    onChange={handleChange}
                    options={[
                      { value: '', label: 'Pilih Kelas' },
                      ...classes.map((item) => ({
                        value: item.id,
                        label: `${item.name} - Kelas ${item.grade}`,
                      })),
                    ]}
                  />
                </div>

                <div className="mt-4">
                  <label className="flex items-center gap-3 rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={formData.allowInstallments}
                      onChange={(e) => setFormData((prev) => ({ ...prev, allowInstallments: e.target.checked }))}
                      className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                    />
                    <div>
                      <p className="text-sm font-medium text-neutral-900">Izinkan cicilan</p>
                      <p className="text-xs text-neutral-500">Aktifkan hanya untuk siswa yang memang boleh bayar bertahap.</p>
                    </div>
                  </label>
                </div>

                {student?.currentClass && (
                  <p className="text-xs text-neutral-500 mt-3">
                    Kelas aktif saat ini: {student.currentClass.className} / {student.currentClass.academicYear}
                  </p>
                )}
              </Card>

              <Card>
                <div className="flex justify-end gap-3">
                  <Button variant="outline" type="button" onClick={() => router.back()}>
                    Batal
                  </Button>
                  <Button type="submit" icon={<Save className="w-4 h-4" />} isLoading={submitting}>
                    Simpan Perubahan
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