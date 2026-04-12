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
import { execFile } from 'child_process';
import { promisify } from 'util';
import qrcodeTerminal from 'qrcode-terminal';

let client: Client | null = null;
let isReady = false;
let initializingPromise: Promise<Client> | null = null;
let connectionState: 'idle' | 'initializing' | 'needs_scan' | 'session_locked' | 'ready' | 'disconnected' | 'error' = 'idle';
let lastInitError: string | null = null;

const AUTH_DIR = path.join(process.cwd(), '.wwebjs_auth');
const execFileAsync = promisify(execFile);

function resolveBrowserExecutablePath(): string | undefined {
  const fromEnv = process.env.WHATSAPP_CHROME_PATH;
  if (fromEnv && fs.existsSync(fromEnv)) {
    return fromEnv;
  }

  const candidates = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return undefined;
}

// Ensure auth directory exists
if (!fs.existsSync(AUTH_DIR)) {
  fs.mkdirSync(AUTH_DIR, { recursive: true });
}

async function removeAuthDirectory() {
  if (!fs.existsSync(AUTH_DIR)) {
    return;
  }

  await fs.promises.rm(AUTH_DIR, { recursive: true, force: true });
  fs.mkdirSync(AUTH_DIR, { recursive: true });
}

function isBrowserAlreadyRunningError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error || '');
  return /browser is already running/i.test(message) && /userDataDir/i.test(message);
}

async function killLockedBrowserProcesses() {
  if (process.platform !== 'win32') {
    return { skipped: true, killed: 0 };
  }

  const sessionToken = '.wwebjs_auth\\session-kassmpit-client';
  const script = `
    $processes = Get-CimInstance Win32_Process | Where-Object {
      $_.CommandLine -and $_.CommandLine -like '*${sessionToken}*' -and ($_.Name -like 'chrome*' -or $_.Name -like 'msedge*')
    }

    $count = 0
    foreach ($process in $processes) {
      try {
        Stop-Process -Id $process.ProcessId -Force -ErrorAction SilentlyContinue
        $count++
      } catch {
      }
    }

    Write-Output $count
  `;

  const { stdout } = await execFileAsync('powershell.exe', [
    '-NoProfile',
    '-NonInteractive',
    '-ExecutionPolicy', 'Bypass',
    '-Command',
    script,
  ]);

  const killed = Number.parseInt(String(stdout).trim(), 10);

  return {
    skipped: false,
    killed: Number.isNaN(killed) ? 0 : killed,
  };
}

async function destroyCurrentClient() {
  if (!client) {
    return;
  }

  try {
    await client.destroy();
  } catch (error) {
    console.warn('Ignoring error while destroying WhatsApp client:', error);
  } finally {
    client = null;
    isReady = false;
  }
}

/**
 * Initialize WhatsApp client
 */
export async function initializeWhatsAppClient() {
  if (client && isReady) {
    console.log('WhatsApp client already initialized');
    connectionState = 'ready';
    return client;
  }

  if (initializingPromise) {
    console.log('WhatsApp client initialization already in progress');
    return initializingPromise;
  }

  initializingPromise = (async () => {
    try {
      connectionState = 'initializing';
      lastInitError = null;

      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          console.log('Initializing WhatsApp Web client...');
          const browserExecutablePath = resolveBrowserExecutablePath();

          if (browserExecutablePath) {
            console.log(`Using browser executable: ${browserExecutablePath}`);
          }

          client = new Client({
            authStrategy: new LocalAuth({
              clientId: 'kassmpit-client',
              dataPath: AUTH_DIR,
            }),
            puppeteer: {
              headless: true,
              executablePath: browserExecutablePath,
              args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
              ],
            },
          });

          client.on('qr', (qr: string) => {
            connectionState = 'needs_scan';
            console.warn('\n📱 SCAN QR CODE DENGAN WHATSAPP (Linked Devices):\n');
            qrcodeTerminal.generate(qr, { small: true });
          });

          client.on('ready', () => {
            isReady = true;
            connectionState = 'ready';
            lastInitError = null;
            console.log('✅ WhatsApp Web client adalah ready!');
          });

          client.on('authenticated', () => {
            console.log('✅ WhatsApp authenticated! Session saved.');
          });

          client.on('auth_failure', (msg) => {
            console.error('❌ WhatsApp authentication failed:', msg);
            isReady = false;
            connectionState = 'needs_scan';
            lastInitError = String(msg);
          });

          client.on('disconnected', (reason) => {
            console.warn('⚠️ WhatsApp disconnected:', reason);
            isReady = false;
            connectionState = 'disconnected';
            lastInitError = String(reason);
            client = null;
            initializingPromise = null;
          });

          client.on('message_create', (msg: WWebMessage) => {
            if (msg.from !== 'status@broadcast') {
              console.log(`📨 Message from ${msg.from}: ${msg.body}`);
            }
          });

          await client.initialize();
          return client;
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          lastInitError = message;

          if (attempt === 1 && isBrowserAlreadyRunningError(error)) {
            connectionState = 'session_locked';
            console.warn('Detected locked browser session. Attempting automatic cleanup and retry...');
            await destroyCurrentClient();
            await killLockedBrowserProcesses();
            continue;
          }

          throw error;
        }
      }

      throw new Error('Failed to initialize WhatsApp client after retry.');
    } catch (error) {
      client = null;
      isReady = false;
      connectionState = isBrowserAlreadyRunningError(error) ? 'session_locked' : 'error';
      lastInitError = error instanceof Error ? error.message : String(error);

      const baseMessage =
        error instanceof Error ? error.message : 'Unknown WhatsApp client error';
      const guidance =
        isBrowserAlreadyRunningError(error)
          ? 'Browser lama untuk sesi WhatsApp masih terkunci. Gunakan Reset WA Connection di settings, atau tutup proses Chrome/Edge yang memakai session ini lalu coba lagi.'
          : 'Browser tidak ditemukan. Install Google Chrome/Microsoft Edge, atau set WHATSAPP_CHROME_PATH ke lokasi executable browser.';

      console.error('Failed to initialize WhatsApp client:', error);
      throw new Error(`${baseMessage}\n${guidance}`);
    } finally {
      initializingPromise = null;
    }
  })();

  return initializingPromise;
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
  state: 'idle' | 'initializing' | 'needs_scan' | 'session_locked' | 'ready' | 'disconnected' | 'error';
  lastError?: string | null;
  info?: {
    wid: string;
    pushname: string;
  };
} {
  if (!client) {
    return {
      connected: false,
      ready: false,
      state: connectionState,
      lastError: lastInitError,
    };
  }

  return {
    connected: client.pupBrowser?.connected ?? false,
    ready: isReady,
    state: isReady ? 'ready' : connectionState,
    lastError: lastInitError,
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

/**
 * Reset WhatsApp client and clear local auth data
 */
export async function resetWhatsAppClient() {
  try {
    if (initializingPromise) {
      console.log('Waiting for active WhatsApp initialization before reset...');
      await initializingPromise.catch(() => null);
    }

    await destroyCurrentClient();
    await removeAuthDirectory();
    initializingPromise = null;
    isReady = false;
    connectionState = 'idle';
    lastInitError = null;

    return {
      success: true,
      message: 'WhatsApp session berhasil direset. Silakan scan QR code saat status WhatsApp dibuka lagi.',
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('Error resetting WhatsApp client:', error);
    return {
      success: false,
      message: errorMsg,
    };
  }
}

export { client, isReady };

void initializeWhatsAppClient().catch(() => null);
