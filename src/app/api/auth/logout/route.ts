import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const response = NextResponse.json({
      success: true,
      message: 'Logout berhasil',
    });

    // Clear current and legacy auth cookie names.
    response.cookies.delete('token');
    response.cookies.delete('auth-token');
    response.cookies.delete('user-session');

    return response;

  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}
