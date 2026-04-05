import { NextRequest, NextResponse } from 'next/server';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { requireAdmin } from '@/lib/auth-helpers';
import { resetWhatsAppClient } from '@/lib/whatsapp-client';

const execFileAsync = promisify(execFile);

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

export async function POST(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const browserCleanup = await killLockedBrowserProcesses();
    const resetResult = await resetWhatsAppClient();

    if (!resetResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: resetResult.message,
          browserCleanup,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: resetResult.message,
      browserCleanup,
    });
  } catch (error) {
    console.error('Error resetting WhatsApp session:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to reset WhatsApp session',
      },
      { status: 500 }
    );
  }
}