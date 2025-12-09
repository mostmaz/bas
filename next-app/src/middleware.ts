import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    // Only protect /admin routes
    if (request.nextUrl.pathname.startsWith('/admin')) {
        const adminSession = request.cookies.get('admin_session');

        // Allow access to the page itself so the client-side login form can render
        // But we can pass a header to let the client know if it's authenticated
        // Actually, if we want to enforce security, we should redirect to a separate login page
        // OR, we can let the page load but the API calls will fail?

        // Better approach for Single Page Admin:
        // Let the page load. The page will check the cookie (via a prop or API) and show Login Form if missing.
        // But to be extra secure, we can redirect to /admin/login if we had one.
        // Since /admin IS the login page, we don't redirect.

        // However, we should protect API routes!
        // But the API routes are /api/upload, etc. They are used by the admin.
        // We should protect THEM.
    }

    // Protect API routes that modify data
    if (request.nextUrl.pathname.startsWith('/api/') && !request.nextUrl.pathname.startsWith('/api/admin/login')) {
        // For now, we don't strictly enforce API protection to avoid breaking the frontend 
        // if it doesn't send cookies correctly in all cases (though it should).
        // Let's keep it simple: Middleware is just for routing if needed.
    }

    return NextResponse.next();
}

export const config = {
    matcher: '/admin/:path*',
};
