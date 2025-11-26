import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET - Fetch all system settings
export async function GET() {
  try {
    const settings = await prisma.systemSettings.findMany({
      orderBy: [
        { category: 'asc' },
        { key: 'asc' }
      ]
    });

    // Group by category
    const grouped = settings.reduce((acc, setting) => {
      if (!acc[setting.category]) {
        acc[setting.category] = [];
      }
      acc[setting.category].push(setting);
      return acc;
    }, {} as Record<string, typeof settings>);

    return NextResponse.json({
      success: true,
      data: {
        settings,
        grouped
      }
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

// PUT - Update multiple settings
export async function PUT(request: NextRequest) {
  try {
    const { settings, updatedBy } = await request.json();

    if (!settings || !Array.isArray(settings)) {
      return NextResponse.json(
        { success: false, error: 'Invalid settings data' },
        { status: 400 }
      );
    }

    // Update settings in transaction
    const updatePromises = settings.map((setting: { key: string; value: string }) =>
      prisma.systemSettings.upsert({
        where: { key: setting.key },
        update: {
          value: setting.value,
          updatedBy,
          updatedAt: new Date()
        },
        create: {
          key: setting.key,
          value: setting.value,
          type: 'TEXT',
          category: 'SYSTEM',
          updatedBy
        }
      })
    );

    await Promise.all(updatePromises);

    return NextResponse.json({
      success: true,
      message: 'Settings updated successfully'
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}

// POST - Create or seed default settings
export async function POST() {
  try {
    const defaultSettings = [
      // Fees
      { key: 'REGISTRATION_FEE', value: '3000000', type: 'NUMBER', category: 'FEES', description: 'Biaya pendaftaran siswa baru' },
      { key: 'REREG_FEE', value: '2000000', type: 'NUMBER', category: 'FEES', description: 'Biaya daftar ulang tahunan' },
      { key: 'SPP_MONTHLY', value: '500000', type: 'NUMBER', category: 'FEES', description: 'Biaya SPP per bulan' },
      
      // Notification
      { key: 'EMAIL_ENABLED', value: 'true', type: 'BOOLEAN', category: 'NOTIFICATION', description: 'Enable email notifications' },
      { key: 'WA_ENABLED', value: 'false', type: 'BOOLEAN', category: 'NOTIFICATION', description: 'Enable WhatsApp notifications' },
      { key: 'WA_API_KEY', value: '', type: 'TEXT', category: 'NOTIFICATION', description: 'WhatsApp API key (Fonnte/Wablas)' },
      { key: 'WA_DEVICE', value: '', type: 'TEXT', category: 'NOTIFICATION', description: 'WhatsApp device ID' },
      
      // System
      { key: 'ACADEMIC_YEAR', value: '2024/2025', type: 'TEXT', category: 'SYSTEM', description: 'Tahun ajaran aktif' },
      { key: 'AUTO_APPROVAL', value: 'true', type: 'BOOLEAN', category: 'SYSTEM', description: 'Auto-approve registration after payment' },
      { key: 'PAYMENT_EXPIRY_HOURS', value: '24', type: 'NUMBER', category: 'SYSTEM', description: 'Payment expiry time in hours' }
    ];

    const seedPromises = defaultSettings.map(setting =>
      prisma.systemSettings.upsert({
        where: { key: setting.key },
        update: {},
        create: setting
      })
    );

    await Promise.all(seedPromises);

    return NextResponse.json({
      success: true,
      message: 'Default settings seeded successfully'
    });
  } catch (error) {
    console.error('Error seeding settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to seed settings' },
      { status: 500 }
    );
  }
}
