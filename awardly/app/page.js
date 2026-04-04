'use client';

import { useEffect } from 'react';
import Parse from '@/lib/parseClient';

export default function Home() {
  useEffect(() => {
    // Se não marcou lembrar, limpa a sessão
    const lembrar = document.cookie.includes('awardly_lembrar=true');
    if (!lembrar) Parse.User.logOut();
  }, []);

  return (
    <>
      <a href="/login">Login</a>
      <a href="/cadastro">Cadastro</a>
    </>
  );
}