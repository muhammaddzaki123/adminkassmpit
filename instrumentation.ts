/**
 * Instrumentation file for Next.js
 * This runs on server startup to initialize WhatsApp client
 * 
 * Reference: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { initializeWhatsAppClient } = await import('@/lib/whatsapp-client');
    
    try {
      console.log('🚀 Initializing WhatsApp client on server startup...');
      await initializeWhatsAppClient();
      console.log('✅ WhatsApp client initialization requested.');
      console.log('📱 Please scan the QR code that should appear in the console.');
    } catch (error) {
      console.warn('⚠️ WhatsApp client initialization warning:', error);
      // Don't block server startup if WhatsApp fails to initialize
      // User can retry via /api/whatsapp/status
    }
  }
}
