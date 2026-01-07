import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
};

export default async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    });

    // --- 1. Supabase Session Management ---
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return request.cookies.get(name)?.value;
                },
                set(name: string, value: string, options: CookieOptions) {
                    request.cookies.set({ name, value, ...options });
                    response = NextResponse.next({
                        request: { headers: request.headers },
                    });
                    response.cookies.set({ name, value, ...options });
                },
                remove(name: string, options: CookieOptions) {
                    request.cookies.set({ name, value: '', ...options });
                    response = NextResponse.next({
                        request: { headers: request.headers },
                    });
                    response.cookies.set({ name, value: '', ...options });
                },
            },
        }
    );

    const { data: { user } } = await supabase.auth.getUser();

    // --- 2. Route Protection ---
    const protectedPaths = ['/select-org', '/expert/studio', '/private/circle', '/tech-interviewer', '/candidate', '/super-admin'];
    const isProtected = protectedPaths.some(path => request.nextUrl.pathname.startsWith(path));

    if (isProtected && !user) {
        const url = request.nextUrl.clone();
        url.pathname = '/login';
        url.searchParams.set('redirect', request.nextUrl.pathname);
        return NextResponse.redirect(url);
    }

    // --- 3. Subdomain Logic & Internal Rewriting ---
    const hostname = request.headers.get('host') || '';
    const allowedDomains = ['swarmhire.ai', 'localhost:3000', 'lvh.me:3000', 'vercel.app', 'onrender.com'];
    const isBaseDomain = allowedDomains.some(domain => hostname === domain || hostname.endsWith(`.${domain}`));

    if (!isBaseDomain) return response;

    let subdomain = '';
    if (hostname.includes('.')) {
        const parts = hostname.split('.');

        // Only extract subdomain for actual custom domains, not Vercel deployment URLs
        if (hostname.endsWith('.swarmhire.ai')) {
            subdomain = parts[0];
        } else if (hostname.endsWith('.lvh.me:3000')) {
            subdomain = parts[0];
        } else if (hostname.endsWith('.vercel.app')) {
            // Skip Vercel's auto-generated deployment URLs (e.g., project-hash-user-org.vercel.app)
            // Only treat it as a tenant if it's a custom subdomain like tenant.swarmhire.vercel.app
            // Vercel deployment URLs typically have hyphens and long names, so skip them
            const firstPart = parts[0];
            const isVercelDeployment = firstPart.includes('-') || parts.length === 2;
            if (!isVercelDeployment && parts.length > 2) {
                subdomain = firstPart;
            }
        }
    }

    const reservedSubdomains = ['www', 'app', 'api', 'admin', 'swarmhireai'];
    if (!subdomain || reservedSubdomains.includes(subdomain.toLowerCase())) return response;

    const path = request.nextUrl.pathname;
    const targetPath = `/${subdomain}${path}`;

    // Update response for rewrite
    const rewriteResponse = NextResponse.rewrite(new URL(targetPath, request.url));

    // Copy cookies from original response (to maintain session)
    response.cookies.getAll().forEach(cookie => {
        rewriteResponse.cookies.set(cookie.name, cookie.value);
    });

    // Headers
    rewriteResponse.headers.set('X-Tenant-Slug', subdomain);
    rewriteResponse.headers.set('X-Debug-Subdomain', subdomain);

    return rewriteResponse;
}
