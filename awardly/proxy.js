import { NextResponse } from 'next/server';

const ROTAS_PUBLICAS = ['/login', '/cadastro', '/'];

export default function proxy(request) {
  const { pathname } = request.nextUrl;

  const token = request.cookies.get('awardly_session');
  const lembrar = request.cookies.get('awardly_lembrar');

  const ePublica = ROTAS_PUBLICAS.some((rota) => pathname === rota);

  if (ePublica && token && lembrar) {
    return NextResponse.redirect(new URL('/homeLogin', request.url));
  }

  if (!ePublica && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.svg).*)',
  ],
};