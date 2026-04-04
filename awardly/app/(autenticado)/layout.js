'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Parse from '@/lib/parseClient';
import NavbarLogin from '@/app/components/NavbarLogin';

export default function LayoutAutenticado({ children }) {
  const router = useRouter();
  const [usuario, setUsuario] = useState(null);
  const [verificando, setVerificando] = useState(true);

  useEffect(() => {
    async function verificarSessao() {
      try {
        const user = await Parse.User.currentAsync();
        if (!user) {
          router.push('/login');
          return;
        }
        await user.fetch();
        setUsuario(user);
        setVerificando(false);
      } catch {
        await Parse.User.logOut();
        router.push('/login');
      }
    }

    verificarSessao();
  }, []);

  const nome = usuario?.get('nome') || usuario?.get('username') || '';
  const foto = usuario?.get('foto')?._url || null;

  if (verificando) return (
    <div style={{ background: '#0a0a0a', minHeight: '100vh' }} />
  );

  return (
    <>
      <NavbarLogin usuario={{ nome, foto }} />
      {children}
    </>
  );
}