const baseUrl = process.env.QA_BASE_URL || 'http://localhost:3000';
const username = process.env.QA_USERNAME || 'superadmin';
const originalPassword = process.env.QA_OLD_PASSWORD || 'admin123';
const generatedPassword = `Admin#${Date.now().toString().slice(-8)}aA`;

import fs from 'node:fs';
import path from 'node:path';
import jwt from 'jsonwebtoken';

function readEnvFile() {
  const envPath = path.resolve(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) {
    return {};
  }

  const content = fs.readFileSync(envPath, 'utf-8');
  const lines = content.split(/\r?\n/);
  const result = {};

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) {
      continue;
    }

    const separatorIndex = trimmed.indexOf('=');
    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim().replace(/^"|"$/g, '');
    result[key] = value;
  }

  return result;
}

function getPasswordResetSecret() {
  const envFile = readEnvFile();
  return (
    process.env.PASSWORD_RESET_SECRET ||
    envFile.PASSWORD_RESET_SECRET ||
    process.env.JWT_SECRET ||
    envFile.JWT_SECRET ||
    'password-reset-secret'
  );
}

function createExpiredToken(validToken) {
  const decoded = jwt.decode(validToken);

  if (!decoded || typeof decoded !== 'object') {
    throw new Error('Cannot decode valid reset token payload');
  }

  const payload = {
    type: decoded.type,
    userId: decoded.userId,
    fingerprint: decoded.fingerprint,
  };

  return jwt.sign(payload, getPasswordResetSecret(), { expiresIn: -10 });
}

async function postJson(path, body) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const data = await response.json().catch(() => ({}));
  return { response, data };
}

function ensure(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function parseToken(resetUrl) {
  const url = new URL(resetUrl);
  return url.searchParams.get('token');
}

async function run() {
  const checkpoints = [];

  const mark = (name, status, details) => {
    checkpoints.push({ name, status, details });
    console.log(`[${status}] ${name} - ${details}`);
  };

  try {
    const forgot1 = await postJson('/api/auth/forgot-password', { identifier: username });
    ensure(forgot1.response.ok, `Forgot-password request failed (${forgot1.response.status})`);
    ensure(Boolean(forgot1.data?.debugResetUrl), 'debugResetUrl is required for QA in non-production mode');
    mark('Forgot Password Request #1', 'PASS', 'Reset URL generated');

    const token1 = parseToken(forgot1.data.debugResetUrl);
    ensure(Boolean(token1), 'Reset token is missing from debugResetUrl');
    mark('Extract Token #1', 'PASS', 'Token parsed successfully');

    const expiredToken = createExpiredToken(token1);
    const expiredReset = await postJson('/api/auth/reset-password', {
      token: expiredToken,
      newPassword: `${generatedPassword}x`,
      confirmPassword: `${generatedPassword}x`,
    });
    ensure(!expiredReset.response.ok, 'Expired token unexpectedly accepted');
    mark('Expired Token Rejected', 'PASS', `Status ${expiredReset.response.status}`);

    const reset1 = await postJson('/api/auth/reset-password', {
      token: token1,
      newPassword: generatedPassword,
      confirmPassword: generatedPassword,
    });
    ensure(reset1.response.ok, `Reset-password request failed (${reset1.response.status})`);
    ensure(reset1.data?.success === true, 'Reset-password did not return success=true');
    mark('Reset Password To Temporary', 'PASS', 'Password updated to temporary value');

    const reuseAttempt = await postJson('/api/auth/reset-password', {
      token: token1,
      newPassword: `${generatedPassword}z`,
      confirmPassword: `${generatedPassword}z`,
    });
    ensure(!reuseAttempt.response.ok, 'Token reuse unexpectedly accepted');
    mark('Token Reuse Rejected', 'PASS', `Status ${reuseAttempt.response.status}`);

    const loginTemp = await postJson('/api/auth/login', {
      username,
      password: generatedPassword,
    });
    ensure(loginTemp.response.ok, `Login with temporary password failed (${loginTemp.response.status})`);
    ensure(loginTemp.data?.success === true, 'Temporary password login did not return success=true');
    mark('Login With Temporary Password', 'PASS', 'Authentication succeeded');

    const forgot2 = await postJson('/api/auth/forgot-password', { identifier: username });
    ensure(forgot2.response.ok, `Second forgot-password request failed (${forgot2.response.status})`);
    ensure(Boolean(forgot2.data?.debugResetUrl), 'Second debugResetUrl is missing');
    mark('Forgot Password Request #2', 'PASS', 'Second reset URL generated');

    const token2 = parseToken(forgot2.data.debugResetUrl);
    ensure(Boolean(token2), 'Second reset token is missing');
    mark('Extract Token #2', 'PASS', 'Second token parsed successfully');

    const reset2 = await postJson('/api/auth/reset-password', {
      token: token2,
      newPassword: originalPassword,
      confirmPassword: originalPassword,
    });
    ensure(reset2.response.ok, `Reset-back request failed (${reset2.response.status})`);
    ensure(reset2.data?.success === true, 'Reset-back did not return success=true');
    mark('Restore Original Password', 'PASS', 'Password restored to initial value');

    const loginFinal = await postJson('/api/auth/login', {
      username,
      password: originalPassword,
    });
    ensure(loginFinal.response.ok, `Final login failed (${loginFinal.response.status})`);
    ensure(loginFinal.data?.success === true, 'Final login did not return success=true');
    mark('Final Login Verification', 'PASS', 'Original credentials work again');

    console.log('\nQA_RESET_E2E_RESULT=PASS');
    return { status: 'PASS', checkpoints };
  } catch (error) {
    mark('Execution', 'FAIL', String(error));
    console.log('\nQA_RESET_E2E_RESULT=FAIL');
    return { status: 'FAIL', checkpoints };
  }
}

const result = await run();
process.exit(result.status === 'PASS' ? 0 : 1);
