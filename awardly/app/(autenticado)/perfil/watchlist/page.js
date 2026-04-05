"use client";

import { useEffect, useState } from "react";
import Parse from "@/lib/parseClient";
import TabsPerfil from "../../../components/TabsPerfil";
import styles from "@/styles/perfil.module.css";
import { getFilme, getImageURL } from "@/lib/tmdb";
import { useRouter } from "next/navigation";
import RevealSection from '@/app/components/RevealSection';

export default function PerfilWatchlist() {
  const [itens, setItens] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [usuario, setUsuario] = useState(null);
  const router = useRouter();

  useEffect(() => {
    async function carregar() {
      const user = Parse.User.current();
      setUsuario(user);
      if (!user) { setCarregando(false); return; }

      try {
        const query = new Parse.Query("Watchlist");
        query.equalTo("usuarioId", user);
        query.descending("createdAt");
        const resultados = await query.find();

        const comDetalhes = await Promise.allSettled(
          resultados.map(async (r) => {
            const filme = await getFilme(r.get("filmeId"));
            return {
              filme,
              parseId: r.id,
            };
          })
        );

        setItens(
          comDetalhes
            .filter((r) => r.status === "fulfilled" && r.value.filme)
            .map((r) => r.value)
        );
      } catch (e) {
        console.error(e);
      } finally {
        setCarregando(false);
      }
    }
    carregar();
  }, []);

  async function remover(parseId) {
    try {
      const query = new Parse.Query("Watchlist");
      const obj = await query.get(parseId);
      await obj.destroy();
      setItens((prev) => prev.filter((i) => i.parseId !== parseId));
    } catch (e) {
      console.error(e);
    }
  }

  const nome = usuario?.get("nome") || usuario?.get("username") || "Usuário";
  const foto = usuario?.get("foto")?._url || null;
  const bannerUrl = usuario?.get("banner")?._url || null;

  return (
    <main className={styles.principal}>
      <div className={styles.bannerWrap}>
        {bannerUrl ? (
          <img src={bannerUrl} alt="Banner" className={styles.bannerImg} />
        ) : (
          <div className={styles.banner} />
        )}
        <div className={styles.headerPerfil}>
          <div className={styles.avatarWrap}>
            {foto ? (
              <img src={foto} alt={nome} className={styles.avatar} />
            ) : (
              <div className={styles.avatarPlaceholder}>{nome[0]?.toUpperCase()}</div>
            )}
          </div>
          <div className={styles.headerInfo}>
            <h1 className={styles.nomeUsuario}>{nome}</h1>
          </div>
        </div>
      </div>

      <TabsPerfil />

      <div className={styles.conteudoFull}>
        <div className={styles.conteudoFullHeader}>
          <h2 className={styles.tituloSecao}>watchlist</h2>
          {!carregando && <span className={styles.conteudoCount}>{itens.length} filmes</span>}
        </div>

        {carregando ? (
          <div className={styles.gradeFilmesAval}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className={styles.cardFilmeAvalEsq} />
            ))}
          </div>
        ) : itens.length === 0 ? (
          <div className={styles.vazioWrap}>
            <p className={styles.vazio}>Sua watchlist está vazia.</p>
            <p className={styles.vazioDica}>Adicione filmes pela página de cada filme.</p>
          </div>
        ) : (
          <div className={styles.gradeFilmesAval}>
            {itens.map(({ filme, parseId }, i) => (
              <RevealSection key={parseId} delay={Math.min(i * 50, 300)}>
                <div className={styles.cardFilmeAval}>
                  <div className={styles.cardFilmeAvalImg} onClick={() => router.push(`/filmes/${filme.id}`)} style={{ cursor: "pointer" }}>
                    <img src={getImageURL(filme.poster_path, "w342")} alt={filme.title} />
                    <button className={styles.btnRemoverWatch} onClick={(e) => { e.stopPropagation(); remover(parseId); }}>✕</button>
                  </div>
                  <div className={styles.cardFilmeAvalInfo}>
                    <p className={styles.cardFilmeAvalTitulo}>{filme.title}</p>
                    <span className={styles.cardFilmeAvalAno}>{filme.release_date?.slice(0, 4)}</span>
                  </div>
                </div>
              </RevealSection>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}