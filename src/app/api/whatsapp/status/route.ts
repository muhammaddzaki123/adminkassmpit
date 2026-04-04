/**
 * GET /api/whatsapp/status
 * Check WhatsApp connection status
 * Returns connection status and authenticated user info if connected
 */

import { NextResponse } from 'next/server';
import { getClientStatus, initializeWhatsAppClient } from '@/lib/whatsapp-client';

export async function GET() {
  try {
    // If not initialized, try to initialize
    await initializeWhatsAppClient();
    
    const status = getClientStatus();

    return NextResponse.json({
      success: true,
      connected: status.connected,
      ready: status.ready,
      qrPending: !status.ready && status.connected === false,
      authenticatedAs: status.info
        ? {
            phone: status.info.wid,
            name: status.info.pushname,
          }
        : null,
      message: status.ready
        ? `Connected as ${status.info?.pushname || 'Unknown'}`
        : status.connected
        ? 'Waiting for QR code scan...'
        : 'Not connected. QR code scan required.',
      instructions: !status.ready
        ? `Open your WhatsApp app on your phone,
           go to Settings > Linked Devices > Link a Device,
           and scan the QR code displayed at server startup.`
        : undefined,
    });
  } catch (error) {
    console.error('WhatsApp status error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to check status',
      },
      { status: 500 }
    );
  }
}
