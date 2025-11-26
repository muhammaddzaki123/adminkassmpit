// src/lib/notification.ts
import prisma from './prisma';

// ===========================
// EMAIL TEMPLATES
// ===========================

const emailTemplates = {
  'registration-pending': {
    subject: '📝 Pendaftaran Berhasil - Menunggu Pembayaran',
    html: (data: { nama: string; nisn: string; vaNumber: string; amount: number; expiredAt: string }) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Selamat Datang di SMP IT KASSMPIT!</h2>
        <p>Halo <strong>${data.nama}</strong>,</p>
        <p>Pendaftaran siswa baru dengan NISN <strong>${data.nisn}</strong> telah berhasil dibuat.</p>
        
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #1f2937;">Detail Pembayaran Pendaftaran</h3>
          <p><strong>Virtual Account:</strong> ${data.vaNumber}</p>
          <p><strong>Total Pembayaran:</strong> Rp ${data.amount.toLocaleString('id-ID')}</p>
          <p><strong>Berlaku hingga:</strong> ${data.expiredAt}</p>
        </div>
        
        <h3>Cara Pembayaran:</h3>
        <ol>
          <li>Buka aplikasi mobile banking atau ATM</li>
          <li>Pilih menu Transfer/Bayar</li>
          <li>Pilih Virtual Account</li>
          <li>Masukkan nomor VA di atas</li>
          <li>Masukkan nominal sesuai tagihan</li>
          <li>Konfirmasi pembayaran</li>
        </ol>
        
        <p style="color: #ef4444;"><strong>Penting:</strong> Pembayaran akan otomatis diverifikasi dan akun Anda akan aktif setelah pembayaran berhasil.</p>
        
        <p>Terima kasih,<br><strong>Tim SMP IT KASSMPIT</strong></p>
      </div>
    `
  },
  
  'registration-approved': {
    subject: '✅ Pendaftaran Disetujui - Akun Aktif',
    html: (data: { nama: string; nisn: string; username: string; kelas: string }) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #16a34a;">Selamat! Pendaftaran Anda Disetujui</h2>
        <p>Halo <strong>${data.nama}</strong>,</p>
        <p>Pembayaran pendaftaran Anda telah diterima dan diverifikasi. Akun Anda sekarang <strong>AKTIF</strong>!</p>
        
        <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #16a34a;">
          <h3 style="margin-top: 0; color: #15803d;">Informasi Akun Siswa</h3>
          <p><strong>Nama:</strong> ${data.nama}</p>
          <p><strong>NISN:</strong> ${data.nisn}</p>
          <p><strong>Kelas:</strong> ${data.kelas}</p>
          <p><strong>Username:</strong> ${data.username}</p>
        </div>
        
        <h3>Langkah Selanjutnya:</h3>
        <ol>
          <li>Login ke portal siswa menggunakan username dan password Anda</li>
          <li>Lengkapi profil siswa</li>
          <li>Cek jadwal pembayaran SPP bulanan</li>
          <li>Ikuti orientasi siswa baru (informasi menyusul)</li>
        </ol>
        
        <p>Jika ada pertanyaan, silakan hubungi admin sekolah.</p>
        
        <p>Selamat bergabung!<br><strong>Tim SMP IT KASSMPIT</strong></p>
      </div>
    `
  },
  
  'payment-success': {
    subject: '✅ Pembayaran Berhasil',
    html: (data: { nama: string; paymentType: string; amount: number; paidAt: string; transactionId: string }) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #16a34a;">Pembayaran Berhasil Diterima</h2>
        <p>Halo <strong>${data.nama}</strong>,</p>
        <p>Pembayaran Anda telah berhasil diproses dan tercatat dalam sistem kami.</p>
        
        <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #15803d;">Detail Pembayaran</h3>
          <p><strong>Jenis Pembayaran:</strong> ${data.paymentType}</p>
          <p><strong>Jumlah:</strong> Rp ${data.amount.toLocaleString('id-ID')}</p>
          <p><strong>Tanggal:</strong> ${data.paidAt}</p>
          <p><strong>ID Transaksi:</strong> ${data.transactionId}</p>
        </div>
        
        <p>Bukti pembayaran dapat Anda unduh dari portal siswa.</p>
        
        <p>Terima kasih,<br><strong>Tim SMP IT KASSMPIT</strong></p>
      </div>
    `
  },
  
  'payment-reminder': {
    subject: '⏰ Pengingat Pembayaran SPP',
    html: (data: { nama: string; bulan: string; amount: number; dueDate: string }) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f59e0b;">Pengingat Pembayaran SPP</h2>
        <p>Halo <strong>${data.nama}</strong>,</p>
        <p>Ini adalah pengingat bahwa pembayaran SPP bulan <strong>${data.bulan}</strong> akan jatuh tempo.</p>
        
        <div style="background-color: #fffbeb; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
          <h3 style="margin-top: 0; color: #d97706;">Detail Tagihan</h3>
          <p><strong>Bulan:</strong> ${data.bulan}</p>
          <p><strong>Jumlah:</strong> Rp ${data.amount.toLocaleString('id-ID')}</p>
          <p><strong>Jatuh Tempo:</strong> ${data.dueDate}</p>
        </div>
        
        <p>Silakan lakukan pembayaran melalui portal siswa atau Virtual Account yang telah disediakan.</p>
        
        <p>Terima kasih,<br><strong>Tim SMP IT KASSMPIT</strong></p>
      </div>
    `
  },
  
  'rereg-reminder': {
    subject: '🔄 Pengumuman Daftar Ulang Tahun Ajaran Baru',
    html: (data: { nama: string; academicYear: string; amount: number; deadline: string }) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Pengumuman Daftar Ulang</h2>
        <p>Halo <strong>${data.nama}</strong>,</p>
        <p>Tahun ajaran baru <strong>${data.academicYear}</strong> akan segera dimulai. Silakan lakukan daftar ulang untuk melanjutkan pendidikan di SMP IT KASSMPIT.</p>
        
        <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb;">
          <h3 style="margin-top: 0; color: #1e40af;">Informasi Daftar Ulang</h3>
          <p><strong>Tahun Ajaran:</strong> ${data.academicYear}</p>
          <p><strong>Biaya Daftar Ulang:</strong> Rp ${data.amount.toLocaleString('id-ID')}</p>
          <p><strong>Batas Waktu:</strong> ${data.deadline}</p>
        </div>
        
        <h3>Cara Daftar Ulang:</h3>
        <ol>
          <li>Login ke portal siswa</li>
          <li>Buka menu "Daftar Ulang"</li>
          <li>Lakukan pembayaran biaya daftar ulang</li>
          <li>Status Anda akan otomatis aktif setelah pembayaran berhasil</li>
        </ol>
        
        <p style="color: #ef4444;"><strong>Penting:</strong> Siswa yang tidak melakukan daftar ulang sebelum batas waktu tidak dapat mengikuti kegiatan pembelajaran.</p>
        
        <p>Terima kasih,<br><strong>Tim SMP IT KASSMPIT</strong></p>
      </div>
    `
  }
};

// ===========================
// WHATSAPP TEMPLATES
// ===========================

const whatsappTemplates = {
  'registration-pending': (data: { nama: string; vaNumber: string; amount: number }) => 
    `*PENDAFTARAN BERHASIL* ✅\n\nHalo *${data.nama}*,\n\nPendaftaran siswa baru Anda telah berhasil dibuat.\n\n*Detail Pembayaran:*\nVA Number: ${data.vaNumber}\nTotal: Rp ${data.amount.toLocaleString('id-ID')}\n\nSegera lakukan pembayaran melalui Virtual Account. Akun akan aktif otomatis setelah pembayaran berhasil.\n\n_SMP IT KASSMPIT_`,
  
  'registration-approved': (data: { nama: string; username: string; kelas: string }) => 
    `*PENDAFTARAN DISETUJUI* 🎉\n\nSelamat *${data.nama}*!\n\nPembayaran pendaftaran Anda telah diterima. Akun Anda sekarang AKTIF.\n\n*Info Akun:*\nUsername: ${data.username}\nKelas: ${data.kelas}\n\nSilakan login ke portal siswa untuk melanjutkan.\n\n_SMP IT KASSMPIT_`,
  
  'payment-success': (data: { nama: string; paymentType: string; amount: number }) => 
    `*PEMBAYARAN BERHASIL* ✅\n\nHalo *${data.nama}*,\n\nPembayaran ${data.paymentType} sebesar Rp ${data.amount.toLocaleString('id-ID')} telah berhasil diterima.\n\nTerima kasih!\n\n_SMP IT KASSMPIT_`,
  
  'payment-reminder': (data: { nama: string; bulan: string; amount: number; dueDate: string }) => 
    `*PENGINGAT PEMBAYARAN SPP* ⏰\n\nHalo *${data.nama}*,\n\nPembayaran SPP bulan *${data.bulan}* akan jatuh tempo:\n\nJumlah: Rp ${data.amount.toLocaleString('id-ID')}\nJatuh Tempo: ${data.dueDate}\n\nSilakan lakukan pembayaran melalui portal siswa.\n\n_SMP IT KASSMPIT_`,
  
  'rereg-reminder': (data: { nama: string; academicYear: string; amount: number; deadline: string }) => 
    `*PENGUMUMAN DAFTAR ULANG* 🔄\n\nHalo *${data.nama}*,\n\nSilakan lakukan daftar ulang untuk tahun ajaran ${data.academicYear}.\n\n*Detail:*\nBiaya: Rp ${data.amount.toLocaleString('id-ID')}\nBatas: ${data.deadline}\n\nLakukan pembayaran melalui portal siswa.\n\n_SMP IT KASSMPIT_`
};

// ===========================
// NOTIFICATION FUNCTIONS
// ===========================

/**
 * Send email notification
 */
export async function sendEmail(
  to: string,
  template: keyof typeof emailTemplates,
  data: Record<string, unknown>
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    // Get settings
    const emailEnabled = await getSettings('EMAIL_ENABLED');
    if (emailEnabled !== 'true') {
      console.log('Email notifications disabled');
      return { success: false, error: 'Email notifications disabled' };
    }

    const emailTemplate = emailTemplates[template];
    if (!emailTemplate) {
      throw new Error(`Email template '${template}' not found`);
    }

    // TODO: Implement actual email sending with Nodemailer/Resend
    // For now, we'll just log and simulate success
    console.log('📧 Sending email to:', to);
    console.log('Subject:', emailTemplate.subject);
    console.log('Template:', template);
    
    // Simulate email sending
    const messageId = `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Log notification
    await createNotificationLog({
      recipient: to,
      type: 'EMAIL',
      status: 'SENT',
      subject: emailTemplate.subject,
      content: emailTemplate.html(data as never),
      template,
      metadata: JSON.stringify(data),
      sentAt: new Date()
    });

    return { success: true, messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    
    // Log failed notification
    await createNotificationLog({
      recipient: to,
      type: 'EMAIL',
      status: 'FAILED',
      subject: emailTemplates[template]?.subject || 'Unknown',
      content: JSON.stringify(error),
      template,
      metadata: JSON.stringify(data)
    });

    return { success: false, error: String(error) };
  }
}

/**
 * Send WhatsApp notification
 */
export async function sendWhatsApp(
  phone: string,
  template: keyof typeof whatsappTemplates,
  data: Record<string, unknown>
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    // Get settings
    const waEnabled = await getSettings('WA_ENABLED');
    if (waEnabled !== 'true') {
      console.log('WhatsApp notifications disabled');
      return { success: false, error: 'WhatsApp notifications disabled' };
    }

    const waApiKey = await getSettings('WA_API_KEY');
    if (!waApiKey) {
      throw new Error('WhatsApp API key not configured');
    }

    const messageTemplate = whatsappTemplates[template];
    if (!messageTemplate) {
      throw new Error(`WhatsApp template '${template}' not found`);
    }

    const message = messageTemplate(data as never);

    // Format phone number (remove non-digits, add 62 if needed)
    let formattedPhone = phone.replace(/\D/g, '');
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '62' + formattedPhone.slice(1);
    }
    if (!formattedPhone.startsWith('62')) {
      formattedPhone = '62' + formattedPhone;
    }

    // TODO: Implement actual WhatsApp API call (Fonnte/Wablas)
    // For now, we'll just log and simulate success
    console.log('📱 Sending WhatsApp to:', formattedPhone);
    console.log('Message:', message);
    
    // Simulate WhatsApp sending
    const messageId = `wa_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Log notification
    await createNotificationLog({
      recipient: formattedPhone,
      type: 'WHATSAPP',
      status: 'SENT',
      content: message,
      template,
      metadata: JSON.stringify(data),
      sentAt: new Date()
    });

    return { success: true, messageId };
  } catch (error) {
    console.error('Error sending WhatsApp:', error);
    
    // Log failed notification
    await createNotificationLog({
      recipient: phone,
      type: 'WHATSAPP',
      status: 'FAILED',
      content: JSON.stringify(error),
      template,
      metadata: JSON.stringify(data)
    });

    return { success: false, error: String(error) };
  }
}

/**
 * Create notification log entry
 */
export async function createNotificationLog(data: {
  userId?: string;
  recipient: string;
  type: 'EMAIL' | 'WHATSAPP' | 'SMS';
  status: 'SENT' | 'FAILED' | 'PENDING';
  subject?: string;
  content: string;
  template?: string;
  metadata?: string;
  sentAt?: Date;
}) {
  try {
    const log = await prisma.notificationLog.create({
      data: {
        userId: data.userId,
        recipient: data.recipient,
        type: data.type,
        status: data.status,
        subject: data.subject,
        content: data.content,
        template: data.template,
        metadata: data.metadata,
        sentAt: data.sentAt
      }
    });

    return log;
  } catch (error) {
    console.error('Error creating notification log:', error);
    throw error;
  }
}

/**
 * Get system setting value
 */
export async function getSettings(key: string): Promise<string | null> {
  try {
    const setting = await prisma.systemSettings.findUnique({
      where: { key }
    });

    return setting?.value || null;
  } catch (error) {
    console.error(`Error getting setting '${key}':`, error);
    return null;
  }
}

/**
 * Update system setting
 */
export async function updateSettings(
  key: string,
  value: string,
  updatedBy?: string
): Promise<boolean> {
  try {
    await prisma.systemSettings.upsert({
      where: { key },
      update: {
        value,
        updatedBy,
        updatedAt: new Date()
      },
      create: {
        key,
        value,
        type: 'TEXT',
        category: 'SYSTEM',
        updatedBy
      }
    });

    return true;
  } catch (error) {
    console.error(`Error updating setting '${key}':`, error);
    return false;
  }
}

/**
 * Send notification (auto-detect channel based on settings)
 */
export async function sendNotification(
  recipient: { email?: string; phone?: string; userId?: string },
  template: string,
  data: Record<string, unknown>
): Promise<{ email?: boolean; whatsapp?: boolean }> {
  const results = {
    email: false,
    whatsapp: false
  };

  // Send email if available
  if (recipient.email && template in emailTemplates) {
    const emailResult = await sendEmail(
      recipient.email,
      template as keyof typeof emailTemplates,
      data
    );
    results.email = emailResult.success;
  }

  // Send WhatsApp if available
  if (recipient.phone && template in whatsappTemplates) {
    const waResult = await sendWhatsApp(
      recipient.phone,
      template as keyof typeof whatsappTemplates,
      data
    );
    results.whatsapp = waResult.success;
  }

  return results;
}
