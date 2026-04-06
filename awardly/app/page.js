'use client';

import { useEffect } from 'react';
import { useRouter } from "next/navigation";
import Parse from '@/lib/parseClient.js';
import styles from "@/styles/login.module.css";
import DarkVeil from "@/app/components/DarkVeil.js";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const limparSessao = async () => {
      const lembrar = document.cookie.includes('awardly_lembrar=true');
      if (!lembrar) {
        try {
          await Parse.User.logOut();
        } catch (error) {
          console.error(error);
        }
      }
    };
    limparSessao();
  }, []);

  const categorias = [
    { nome: "FILMES", rota: "/filmes", desc: "Acervo Completo" },
    { nome: "CATEGORIAS", rota: "/categorias", desc: "Indicados & Vencedores" },
    { nome: "COMUNIDADE", rota: "/cadastro", desc: "Rede de Cinéfilos" }
  ];

  return (
    <div className={styles.page} style={{ overflowY: 'auto', display: 'block', backgroundColor: '#050505' }}>
      <DarkVeil hueShift={-160} noiseIntensity={0.02} speed={0.4} warpAmount={1} />

      <div style={{ position: 'relative', zIndex: 10, maxWidth: '1100px', margin: '0 auto', padding: '40px 20px' }}>
        
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '100px' }}>
          <div style={{ cursor: 'pointer' }} onClick={() => router.push('/')}>
            <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: '900', letterSpacing: '8px', color: '#fff' }}>AWARDLY</h1>
            <span style={{ color: '#c9a24d', fontSize: '10px', letterSpacing: '4px', fontWeight: 'bold', textTransform: 'uppercase', display: 'block', marginTop: '5px' }}>OSCARS</span>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <button 
              onClick={() => router.push("/login")} 
              style={{ background: '#c9a24d', border: 'none', color: '#000', padding: '10px 25px', borderRadius: '4px', fontSize: '11px', fontWeight: '900', letterSpacing: '1px', cursor: 'pointer' }}
            >
              ENTRAR
            </button>
            <button 
              onClick={() => router.push("/cadastro")} 
              style={{ background: 'none', border: '1px solid rgba(201, 162, 77, 0.5)', color: '#c9a24d', padding: '10px 25px', borderRadius: '4px', fontSize: '11px', fontWeight: '900', letterSpacing: '1px', cursor: 'pointer' }}
            >
              CADASTRAR
            </button>
          </div>
        </header>

        <main>
          <section style={{ maxWidth: '850px', marginBottom: '80px' }}>
            <h2 style={{ color: '#fff', fontSize: '3.5rem', fontWeight: '900', lineHeight: '1.1', marginBottom: '30px', letterSpacing: '-2px' }}>
              Sua jornada pela <span style={{ color: '#c9a24d' }}>temporada de prêmios</span> começa aqui.
            </h2>
            <p style={{ color: '#888', fontSize: '1.1rem', lineHeight: '1.6', fontWeight: '300', maxWidth: '600px' }}>
              Explore o acervo de indicados, registre suas sessões com notas e reviews, e monte sua Watchlist personalizada. No Awardly, você decide quem realmente merecia a estatueta e compartilha sua visão com uma comunidade apaixonada por cinema.
            </p>
          </section>

          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '100px' }}>
            <div style={{ padding: '20px', borderLeft: '1px solid #c9a24d' }}>
              <h4 style={{ color: '#fff', fontSize: '12px', fontWeight: '900', marginBottom: '10px' }}>LOG & REVIEW</h4>
              <p style={{ color: '#555', fontSize: '11px', lineHeight: '1.5' }}>Dê notas de 0 a 5, marque seus favoritos e organize o que você já assistiu.</p>
            </div>
            <div style={{ padding: '20px', borderLeft: '1px solid #c9a24d' }}>
              <h4 style={{ color: '#fff', fontSize: '12px', fontWeight: '900', marginBottom: '10px' }}>VEREDITO FINAL</h4>
              <p style={{ color: '#555', fontSize: '11px', lineHeight: '1.5' }}>Comente em cada categoria quem ganhou e quem você gostaria que tivesse vencido.</p>
            </div>
            <div style={{ padding: '20px', borderLeft: '1px solid #c9a24d' }}>
              <h4 style={{ color: '#fff', fontSize: '12px', fontWeight: '900', marginBottom: '10px' }}>PERFIL SOCIAL</h4>
              <p style={{ color: '#555', fontSize: '11px', lineHeight: '1.5' }}>Personalize seu banner, bio e destaque seus 4 filmes favoritos para o mundo.</p>
            </div>
          </section>

          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '40px', marginBottom: '100px' }}>
            {categorias.map((item) => (
              <div 
                key={item.nome}
                onClick={() => router.push(item.rota)}
                style={{ 
                  background: 'rgba(255, 255, 255, 0.02)', 
                  backdropFilter: 'blur(10px)',
                  padding: '50px 40px', 
                  borderRadius: '15px', 
                  border: '1px solid rgba(255, 255, 255, 0.05)', 
                  cursor: 'pointer', 
                  transition: '0.5s cubic-bezier(0.2, 1, 0.3, 1)',
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(201, 162, 77, 0.05)';
                  e.currentTarget.style.borderColor = 'rgba(201, 162, 77, 0.3)';
                  e.currentTarget.style.transform = 'scale(1.02)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                <span style={{ color: '#c9a24d', fontSize: '10px', fontWeight: '900', letterSpacing: '4px' }}>{item.nome}</span>
                <h3 style={{ color: '#fff', fontSize: '22px', margin: '10px 0 0 0', fontWeight: '300' }}>{item.desc}</h3>
                <div style={{ marginTop: '40px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                </div>
              </div>
            ))}
          </section>
        </main>

        <footer style={{ marginTop: '150px', textAlign: 'center', paddingBottom: '60px' }}>
          <p style={{ color: '#1a1a1a', fontSize: '10px', fontWeight: 'bold', letterSpacing: '15px' }}>AWARDLY 2026</p>
        </footer>
      </div>
    </div>
  );
}