import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { password } = body;

        // Hardcoded password as requested
        // In a real app, use environment variables: process.env.ADMIN_PASSWORD
        const ADMIN_PASSWORD = '150893412C@c';

        if (password === ADMIN_PASSWORD) {
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
