"use client";

import { useEffect, useState, useMemo } from "react";
import Parse from "@/lib/parseClient";
import TabsPerfil from "@/app/components/TabsPerfil";
import CardLogCategoria from "@/app/components/CardLogCategoria";
import styles from "@/styles/perfil.module.css";
import cat from "@/styles/categoriasPerfil.module.css";
import RevealSection from '@/app/components/RevealSection';

function tempoRelativo(date) {
  if (!date) return "";
  const diff = Date.now() - new Date(date).getTime();
  const min = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  const sem = Math.floor(d / 7);
  if (min < 60) return `${min} min atrás`;
  if (h < 24) return `${h}h atrás`;
  if (d < 7) return `${d} dia${d > 1 ? "s" : ""} atrás`;
  return `${sem} semana${sem > 1 ? "s" : ""} atrás`;
}

export default function PerfilCategorias() {
  const [logs, setLogs] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [anoSelecionado, setAnoSelecionado] = useState(null);
  const [usuario, setUsuario] = useState(null);

  const fotoObj = usuario?.get("foto");
  const foto = (typeof fotoObj?.url === "function" ? fotoObj.url() : fotoObj?._url) || null;
  const bannerObj = usuario?.get("banner");
  const bannerUrl = (typeof bannerObj?.url === "function" ? bannerObj.url() : bannerObj?._url) || null;
  const nome = usuario?.get("nome") || usuario?.get("username") || "";

  useEffect(() => {
    async function carregar() {
      const user = Parse.User.current();
      await user.fetch();
      setUsuario(user);
      if (!user) { setCarregando(false); return; }

      try {
        const query = new Parse.Query("LogCategoria");
        query.equalTo("usuarioId", user);
        query.descending("createdAt");
        query.limit(200);
        const resultados = await query.find();
        setLogs(resultados.map((l) => ({
          id: l.id,
          categoria: l.get("categoria"),
          ano: l.get("ano"),
          vencedorReal: l.get("vencedorReal"),
          deveriaTerGanhado: l.get("deveriaTerGanhado"),
          queriaQueGanhasse: l.get("queriaQueGanhasse"),
          review: l.get("review"),
          data: tempoRelativo(l.createdAt),
        })));
      } catch (e) {
        console.error(e);
      } finally {
        setCarregando(false);
      }
    }
    carregar();
  }, []);

  // Anos disponíveis baseados nos logs reais
  const anosDisponiveis = useMemo(() => {
    const anos = [...new Set(logs.map((l) => l.ano).filter(Boolean))].sort((a, b) => b - a);
    return anos;
  }, [logs]);

  const logsFiltrados = useMemo(() => {
    if (!anoSelecionado) return logs;
    return logs.filter((l) => l.ano === anoSelecionado);
  }, [logs, anoSelecionado]);

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
          <h2 className={styles.tituloSecao}>categorias avaliadas</h2>
          {!carregando && (
            <span className={styles.conteudoCount}>
              {logsFiltrados.length} {logsFiltrados.length === 1 ? "avaliação" : "avaliações"}
            </span>
          )}
        </div>

        {/* Filtro por ano */}
        {!carregando && anosDisponiveis.length > 1 && (
          <div className={cat.filtros}>
            <button
              className={`${cat.filtroBtnCat} ${anoSelecionado === null ? cat.filtroBtnAtivo : ""}`}
              onClick={() => setAnoSelecionado(null)}
            >
              Todos
            </button>
            {anosDisponiveis.map((ano) => (
              <button
                key={ano}
                className={`${cat.filtroBtnCat} ${anoSelecionado === ano ? cat.filtroBtnAtivo : ""}`}
                onClick={() => setAnoSelecionado(ano)}
              >
                {ano}
              </button>
            ))}
          </div>
        )}

        {carregando ? (
          <div className={cat.listaEsq}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className={cat.cardEsq} />
            ))}
          </div>
        ) : logsFiltrados.length === 0 ? (
          <div className={styles.vazioWrap}>
            <p className={styles.vazio}>
              {anoSelecionado
                ? `Nenhuma categoria avaliada em ${anoSelecionado}.`
                : "Você ainda não avaliou nenhuma categoria."}
            </p>
            {!anoSelecionado && (
              <p className={styles.vazioDica}>Acesse a página de categorias para começar.</p>
            )}
          </div>
        ) : (
          <div className={cat.lista}>
            {logsFiltrados.map((l, index) => (
              <RevealSection key={l.id} delay={Math.min(index * 60, 300)}>
                <div className={cat.cardAnimar}>
                  <CardLogCategoria log={l} />
                </div>
              </RevealSection>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}