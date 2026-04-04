/**
 * POST /api/whatsapp/send
 * Send WhatsApp message using whatsapp-web.js (FREE - no Twilio needed)
 * 
 * Body: { to, body, template? }
 * 
 * Note: Requires WhatsApp session to be authenticated first (check /api/whatsapp/status)
 */

import { NextRequest, NextResponse } from 'next/server';
import { sendWhatsAppMessage } from '@/lib/whatsapp';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, body: message, template } = body;

    if (!to || !message) {
      return NextResponse.json(
        { success: false, error: 'Phone number and message are required' },
        { status: 400 }
      );
    }

    // Send via whatsapp-web.js
    const result = await sendWhatsAppMessage({
      to,
      body: message,
      template,
    });

    // Log to NotificationLog
    if (result.success) {
      try {
        await prisma.notificationLog.create({
          data: {
            type: 'WHATSAPP',
            status: 'SENT',
            recipient: to,
            subject: `WhatsApp ${template || 'message'}`,
            content: message.substring(0, 500),
            template: template || 'custom',
            metadata: JSON.stringify({
              messageId: result.messageId,
              transport: 'whatsapp-web.js',
            }),
            sentAt: new Date(),
          },
        });
      } catch (logError) {
        console.warn('Failed to log notification:', logError);
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('WhatsApp send endpoint error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send message',
      },
      { status: 500 }
    );
  }
}
