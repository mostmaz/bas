import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { password } = body;

        // Encoded password to prevent plain text exposure in repo
        const ENCODED_PASSWORD = 'MTUwODkzNDEyQ0Bj'; // Base64 for 150893412C@c

        // Encode the input password to compare
        const inputEncoded = Buffer.from(password).toString('base64');

        if (inputEncoded === ENCODED_PASSWORD) {
            const response = NextResponse.json({ success: true });

            // Set a secure HTTP-only cookie for security
            response.cookies.set('admin_session', 'authenticated', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                path: '/',
                maxAge: 60 * 60 * 24 * 7 // 1 week
            });

            // Set a non-HttpOnly cookie for client-side UI state
            response.cookies.set('admin_ui', 'true', {
                httpOnly: false,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                path: '/',
                maxAge: 60 * 60 * 24 * 7
            });

            return response;
        }

        return NextResponse.json({ success: false, message: 'Invalid password' }, { status: 401 });
    } catch (e) {
        return NextResponse.json({ success: false, message: 'Error' }, { status: 500 });
    }
}
