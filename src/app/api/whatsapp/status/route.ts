/**
 * GET /api/whatsapp/status
 * Check WhatsApp connection status
 * Returns connection status and authenticated user info if connected
 */

import { NextResponse } from 'next/server';
import { getClientStatus, initializeWhatsAppClient } from '@/lib/whatsapp-client';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const shouldBootstrap = searchParams.get('refresh') === '1' || searchParams.get('bootstrap') === '1';

    if (shouldBootstrap) {
      await initializeWhatsAppClient();
    }
    
    const status = getClientStatus();
    const stateLabel = {
      ready: 'Ready',
      initializing: 'Memulai client',
      needs_scan: 'Perlu scan QR',
      session_locked: 'Session lock',
      disconnected: 'Terputus',
      error: 'Error',
      idle: 'Belum dimulai',
    }[status.state];

    const isScanRequired = status.state === 'needs_scan' || (status.ready === false && status.connected === false && !status.lastError);

    return NextResponse.json({
      success: true,
      connected: status.connected,
      ready: status.ready,
      state: status.state,
      stateLabel,
      qrPending: isScanRequired,
      sessionLocked: status.state === 'session_locked',
      lastError: status.lastError ?? null,
      authenticatedAs: status.info
        ? {
            phone: status.info.wid,
            name: status.info.pushname,
          }
        : null,
      message: status.ready
        ? `Connected as ${status.info?.pushname || 'Unknown'}`
        : status.state === 'session_locked'
        ? 'Sesi WhatsApp terkunci oleh browser lain.'
        : status.state === 'needs_scan'
        ? 'Menunggu scan QR code.'
        : 'Not connected. QR code scan required.',
      instructions: !status.ready
        ? status.state === 'session_locked'
          ? 'Klik Reset WA Connection untuk menutup browser yang mengunci session, lalu refresh status.'
          : 'Open your WhatsApp app on your phone, go to Settings > Linked Devices > Link a Device, lalu scan QR code saat diminta.'
        : undefined,
    });
  } catch (error) {
    console.error('WhatsApp status error:', error);
    return NextResponse.json(
      {
        success: false,
        state: 'error',
        error: error instanceof Error ? error.message : 'Failed to check status',
      },
      { status: 500 }
    );
  }
}
