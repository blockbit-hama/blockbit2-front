import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const protectedRoutes = ['/wallet', '/admin'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  const isProtectedRoute = protectedRoutes.some(route =>
    pathname.startsWith(route)
  );
  
  if (isProtectedRoute) {
    const token = request.cookies.get('auth_token');
    
    if (!token) {
      const url = new URL('/login', request.url);
      url.searchParams.set('from', pathname);
      return NextResponse.redirect(url);
    }
  }
  
  return NextResponse.next();
}

export const config = {
  // 미들웨어가 실행될 경로를 여기에 명시
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/public|login|signup).*)',
  ],
};
