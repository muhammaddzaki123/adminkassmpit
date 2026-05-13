import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

interface StudentRow {
  nisn: string;
  nama: string;
  kelas?: string;
}

function normalizeClassKey(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';
    
    let csvText = '';

    // Handle multipart/form-data
    if (contentType.includes('multipart/form-data')) {
      try {
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
          return NextResponse.json(
            { message: 'File tidak ditemukan dalam form data' },
            { status: 400 }
          );
        }

        csvText = await file.text();
      } catch (formError) {
        console.error('Error parsing form data:', formError);
        return NextResponse.json(
          { message: 'Gagal membaca form data. Pastikan file di-upload dengan benar.' },
          { status: 400 }
        );
      }
    } 
    // Handle JSON with base64 file
    else if (contentType.includes('application/json')) {
      try {
        const body = await req.json();
        if (body.fileContent) {
          csvText = Buffer.from(body.fileContent, 'base64').toString('utf-8');
        } else if (body.file) {
          csvText = body.file;
        }

        if (!csvText) {
          return NextResponse.json(
            { message: 'File content tidak ditemukan' },
            { status: 400 }
          );
        }
      } catch (jsonError) {
        console.error('Error parsing JSON:', jsonError);
        return NextResponse.json(
          { message: 'Format request tidak valid' },
          { status: 400 }
        );
      }
    } else {
      // Fallback: try to read as text
      try {
        csvText = await req.text();
      } catch (textError) {
        console.error('Error reading request body:', textError);
        return NextResponse.json(
          { message: `Content-Type tidak didukung: ${contentType}. Gunakan multipart/form-data.` },
          { status: 415 }
        );
      }
    }

    if (!csvText || csvText.trim().length === 0) {
      return NextResponse.json(
        { message: 'File CSV kosong' },
        { status: 400 }
      );
    }

    const [activeAcademicYear, activeClasses] = await Promise.all([
      prisma.academicYear.findFirst({ where: { isActive: true } }),
      prisma.class.findMany({
        where: { isActive: true },
        orderBy: [{ grade: 'asc' }, { name: 'asc' }],
      }),
    ]);

    const classLookup = new Map<string, { id: string; name: string; grade: number }>();
    for (const cls of activeClasses) {
      const aliases = [
        cls.name,
        `${cls.grade} - ${cls.name}`,
        `${cls.grade}-${cls.name}`,
        `${cls.grade} ${cls.name}`,
        `${cls.grade}${cls.name}`,
      ];

      for (const alias of aliases) {
        classLookup.set(normalizeClassKey(alias), cls);
      }
    }

    // Parse CSV
    const lines = csvText.split('\n');
    
    const students: StudentRow[] = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const values = line.split(',').map(v => v.trim());
      if (values.length < 2) continue;
      
      students.push({
        nisn: values[0],
        nama: values[1],
        kelas: values[2] || '',
      });
    }

    if (students.length === 0) {
      return NextResponse.json(
        { message: 'Tidak ada data siswa yang ditemukan di file' },
        { status: 400 }
      );
    }

    // Process each student
    const results = {
      success: 0,
      failed: 0,
      errors: [] as { row: number; nisn: string; error: string }[],
    };

    for (let i = 0; i < students.length; i++) {
      const student = students[i];
      const rowNumber = i + 2; // +2 because of header and 0-index

      try {
        // Validate NISN
        if (!student.nisn || student.nisn.length !== 10 || !/^\d+$/.test(student.nisn)) {
          throw new Error('NISN harus 10 digit angka');
        }

        if (!student.nama || student.nama.trim().length === 0) {
          throw new Error('Nama tidak boleh kosong');
        }

        let matchedClass: { id: string; name: string; grade: number } | undefined;
        const kelasInput = student.kelas?.trim();
        if (kelasInput) {
          matchedClass = classLookup.get(normalizeClassKey(kelasInput));

          if (!matchedClass) {
            throw new Error(`Kelas "${kelasInput}" tidak ditemukan atau tidak aktif`);
          }

          if (!activeAcademicYear) {
            throw new Error('Tidak ada tahun ajaran aktif untuk assign kelas');
          }
        }

        // Check if NISN exists
        const existing = await prisma.student.findUnique({
          where: { nisn: student.nisn },
        });

        if (existing) {
          throw new Error('NISN sudah terdaftar');
        }

        // Generate VA (Virtual Account)
        const vaNumber = `8808${Date.now().toString().slice(-6)}${i}`;

        // Hash default password
        const defaultPassword = 'password123';
        const hashedPassword = await bcrypt.hash(defaultPassword, 10);

        // Use transaction to ensure both Student and User are created together
        await prisma.$transaction(async (tx) => {
          // Create Student
          const newStudent = await tx.student.create({
            data: {
              nisn: student.nisn,
              nama: student.nama,
              status: 'ACTIVE',
              virtualAccount: vaNumber,
              enrollmentType: 'NEW',
            },
          });

          // Create User account
          await tx.user.create({
            data: {
              username: student.nisn,
              password: hashedPassword,
              nama: student.nama,
              role: 'STUDENT',
              studentId: newStudent.id,
              isActive: true,
            },
          });

          if (matchedClass && activeAcademicYear) {
            await tx.studentClass.create({
              data: {
                studentId: newStudent.id,
                classId: matchedClass.id,
                academicYearId: activeAcademicYear.id,
                isActive: true,
              },
            });
          }
        });

        results.success++;
      } catch (error) {
        console.error(`Error importing student ${student.nisn}:`, error);
        results.failed++;
        results.errors.push({
          row: rowNumber,
          nisn: student.nisn,
          error: error instanceof Error ? error.message : 'Kesalahan tidak diketahui',
        });
      }
    }

    return NextResponse.json(results);

  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json(
      { 
        message: `Terjadi kesalahan saat import: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error: process.env.NODE_ENV === 'development' ? error : undefined,
      },
      { status: 500 }
    );
  }
}
