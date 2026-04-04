/**
 * WhatsApp Client Service
 * Menggunakan whatsapp-web.js untuk free WhatsApp integration
 * 
 * SETUP REQUIRED:
 * 1. Save folder `.wwebjs_auth` untuk session persistence
 * 2. Scan QR code pertama kali authentication
 * 3. Folder akan di-create otomatis setelah scan QR
 */

import { Client, LocalAuth, Message as WWebMessage } from 'whatsapp-web.js';
import * as fs from 'fs';
import * as path from 'path';
import qrcodeTerminal from 'qrcode-terminal';

let client: Client | null = null;
let isReady = false;

const AUTH_DIR = path.join(process.cwd(), '.wwebjs_auth');

// Ensure auth directory exists
if (!fs.existsSync(AUTH_DIR)) {
  fs.mkdirSync(AUTH_DIR, { recursive: true });
}

/**
 * Initialize WhatsApp client
 */
export async function initializeWhatsAppClient() {
  if (client && isReady) {
    console.log('WhatsApp client already initialized');
    return client;
  }

  if (client) {
    console.log('WhatsApp client exists but not ready');
    return client;
  }

  try {
    console.log('Initializing WhatsApp Web client...');
    
    client = new Client({
      authStrategy: new LocalAuth({
        clientId: 'kassmpit-client',
        dataPath: AUTH_DIR,
      }),
      puppeteer: {
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage', // Important untuk VPS dengan memory terbatas
        ],
      },
    });

    client.on('qr', (qr: string) => {
      console.warn('\n📱 SCAN QR CODE DENGAN WHATSAPP (Linked Devices):\n');
      qrcodeTerminal.generate(qr, { small: true });
    });

    client.on('ready', () => {
      isReady = true;
      console.log('✅ WhatsApp Web client adalah ready!');
    });

    client.on('authenticated', () => {
      console.log('✅ WhatsApp authenticated! Session saved.');
    });

    client.on('auth_failure', (msg) => {
      console.error('❌ WhatsApp authentication failed:', msg);
      isReady = false;
    });

    client.on('disconnected', (reason) => {
      console.warn('⚠️ WhatsApp disconnected:', reason);
      isReady = false;
      client = null;
    });

    client.on('message_create', (msg: WWebMessage) => {
      // Optional: Log incoming messages
      if (msg.from !== 'status@broadcast') {
        console.log(`📨 Message from ${msg.from}: ${msg.body}`);
      }
    });

    await client.initialize();
    return client;
  } catch (error) {
    console.error('Failed to initialize WhatsApp client:', error);
    throw error;
  }
}

/**
 * Ensure client is ready
 */
export async function ensureClientReady() {
  if (!client || !isReady) {
    console.log('Client not ready, attempting to initialize...');
    await initializeWhatsAppClient();
    
    // Wait up to 30 seconds for client to be ready
    let waited = 0;
    while (!isReady && waited < 30000) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      waited += 1000;
    }

    if (!isReady) {
      throw new Error(
        'WhatsApp client could not be initialized. Please scan QR code first.'
      );
    }
  }
  return client;
}

/**
 * Send WhatsApp message
 * Format nomor: +628123456789 atau langsung dari Student.noTelp
 */
export async function sendWhatsAppMessage(
  phoneNumber: string,
  message: string
): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  try {
    // Normalize phone number
    let normalizedPhone = phoneNumber;
    if (!normalizedPhone.includes('@')) {
      // Convert to WhatsApp format: use @c.us for individual chats
      if (!normalizedPhone.startsWith('+')) {
        normalizedPhone = `+62${normalizedPhone.replace(/^0/, '')}`;
      }
      normalizedPhone = normalizedPhone.replace(/\D/g, '');
      normalizedPhone = `${normalizedPhone}@c.us`;
    }

    const client_ready = await ensureClientReady();
    
    if (!client_ready) {
      throw new Error('WhatsApp client not initialized');
    }

    console.log(`Sending message to ${normalizedPhone}...`);
    const response = await client_ready.sendMessage(normalizedPhone, message);

    return {
      success: true,
      messageId: response.id.id,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`Failed to send WhatsApp message: ${errorMsg}`);
    return {
      success: false,
      error: errorMsg,
    };
  }
}

/**
 * Get client status
 */
export function getClientStatus(): {
  connected: boolean;
  ready: boolean;
  info?: {
    wid: string;
    pushname: string;
  };
} {
  if (!client) {
    return { connected: false, ready: false };
  }

  return {
    connected: client.pupBrowser?.connected ?? false,
    ready: isReady,
    info: client.info
      ? {
          wid: client.info.wid.user,
          pushname: client.info.pushname,
        }
      : undefined,
  };
}

/**
 * Gracefully destrutialize client
 */
export async function destroyClient() {
  if (client) {
    try {
      await client.destroy();
      client = null;
      isReady = false;
      console.log('WhatsApp client destroyed');
    } catch (error) {
      console.error('Error destroying client:', error);
    }
  }
}

export { client, isReady };
