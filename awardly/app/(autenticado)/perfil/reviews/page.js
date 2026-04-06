"use client";

import { useEffect, useState, useMemo } from "react";
import Parse from "@/lib/parseClient";
import TabsPerfil from "../../../components/TabsPerfil";
import CardLogCategoria from "../../../components/CardLogCategoria";
import styles from "@/styles/perfil.module.css";
import rev from "@/styles/reviewsPerfil.module.css";
import { getFilme, getImageURL } from "@/lib/tmdb";
import { useRouter } from "next/navigation";
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

function Estatuetas({ valor }) {
  return (
    <div className={styles.estatuetasRow}>
      {[1, 2, 3, 4, 5].map((i) => {
        const cheia = valor >= i;
        const meia = !cheia && valor >= i - 0.5;
        return (
          <div key={i} className={styles.estatuetaMiniSlot}>
            {cheia ? (
              <img src="/oscar2.png" className={styles.estatuetaMini} />
            ) : meia ? (
              <div style={{ marginRight: 0.1, position: "relative", width: 28, height: 28 }}>
                <img src="/oscar2.png" className={styles.estatuetaMini} style={{ clipPath: "inset(0 50% 0 0)", position: "absolute" }} />
                <img src="/oscarvazio.png" className={styles.estatuetaMini} style={{ clipPath: "inset(0 0 0 50%)", position: "absolute", opacity: 0.3 }} />
              </div>
            ) : (
              <img src="/oscarvazio.png" className={styles.estatuetaMini} style={{ opacity: 0.3 }} />
            )}
          </div>
        );
      })}
      {valor > 0 && <span className={styles.estatuetaMiniValor}>{valor}</span>}
    </div>
  );
}

function ReviewFilmeCard({ item, index }) {
  const router = useRouter();
  const { filme, estatuetas, like, review, data, id } = item;
  return (
    <div
      className={`${styles.reviewCard} ${rev.cardAnimar}`}
      style={{ animationDelay: `${Math.min(index * 50, 400)}ms`, cursor: "pointer" }}
      onClick={() => router.push(`/filmes/${filme.id}`)}
    >
      <img
        src={getImageURL(filme.poster_path, "w185")}
        alt={filme.title}
        className={styles.reviewPoster}
      />
      <div className={styles.reviewBody}>
        <div className={styles.reviewHeader}>
          <span className={styles.reviewFilme}>{filme.title}</span>
          {like && <img src="/envelopecoracao.png" className={styles.reviewEnvelope} alt="gostei" />}
        </div>
        {estatuetas > 0 && <Estatuetas valor={estatuetas} />}
        <p className={styles.reviewTexto}>{review}</p>
        <span className={styles.reviewData}>{data}</span>
      </div>
    </div>
  );
}

export default function PerfilReviews() {
  const [reviewsFilmes, setReviewsFilmes] = useState([]);
  const [reviewsCategorias, setReviewsCategorias] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [usuario, setUsuario] = useState(null);
  const [tipo, setTipo] = useState("todos"); // "todos" | "filmes" | "categorias"
  const [busca, setBusca] = useState("");
  const router = useRouter();

  useEffect(() => {
    async function carregar() {
      const user = Parse.User.current();
      if (!user) { setCarregando(false); return; }
      await user.fetch();
      setUsuario(user);

      try {
        // Reviews de filmes
        const qLogs = new Parse.Query("Log");
        qLogs.equalTo("usuarioId", user);
        qLogs.exists("review");
        qLogs.descending("createdAt");
        const logsRes = await qLogs.find();

        const comDetalhes = await Promise.allSettled(
          logsRes.map(async (r) => {
            const filme = await getFilme(r.get("filmeId"));
            return {
              filme,
              estatuetas: r.get("estatuetas") || 0,
              like: r.get("like") || false,
              review: r.get("review"),
              data: tempoRelativo(r.createdAt),
              id: r.id,
            };
          })
        );
        setReviewsFilmes(
          comDetalhes.filter((r) => r.status === "fulfilled" && r.value.filme).map((r) => r.value)
        );

        // Reviews de categorias
        const qCat = new Parse.Query("LogCategoria");
        qCat.equalTo("usuarioId", user);
        qCat.exists("review");
        qCat.descending("createdAt");
        const catRes = await qCat.find();
        setReviewsCategorias(catRes.map((l) => ({
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

  const reviewsFilmesFiltradas = useMemo(() => {
    if (!busca.trim()) return reviewsFilmes;
    const termo = busca.toLowerCase();
    return reviewsFilmes.filter((r) => r.filme?.title?.toLowerCase().includes(termo));
  }, [reviewsFilmes, busca]);

  const reviewsCategoriasFiltradas = useMemo(() => {
    if (!busca.trim()) return reviewsCategorias;
    const termo = busca.toLowerCase();
    return reviewsCategorias.filter((r) =>
      r.categoria?.toLowerCase().includes(termo) ||
      r.vencedorReal?.toLowerCase().includes(termo)
    );
  }, [reviewsCategorias, busca]);

  const totalVisivel =
    tipo === "filmes" ? reviewsFilmesFiltradas.length
    : tipo === "categorias" ? reviewsCategoriasFiltradas.length
    : reviewsFilmesFiltradas.length + reviewsCategoriasFiltradas.length;

  const nome = usuario?.get("nome") || usuario?.get("username") || "";
  const fotoObj = usuario?.get("foto");
  const foto = (typeof fotoObj?.url === "function" ? fotoObj.url() : fotoObj?._url) || null;
  const bannerObj = usuario?.get("banner");
  const bannerUrl = (typeof bannerObj?.url === "function" ? bannerObj.url() : bannerObj?._url) || null;

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
          <h2 className={styles.tituloSecao}>reviews</h2>
          {!carregando && (
            <span className={styles.conteudoCount}>
              {totalVisivel} {totalVisivel === 1 ? "review" : "reviews"}
            </span>
          )}
        </div>

        {/* Filtros + busca */}
        <div className={rev.filtrosBar}>
          <div className={rev.filtrosTipo}>
            {["todos", "filmes", "categorias"].map((t) => (
              <button
                key={t}
                className={`${rev.filtroBtnTipo} ${tipo === t ? rev.filtroBtnAtivo : ""}`}
                onClick={() => { setTipo(t); setBusca(""); }}
              >
                {t}
              </button>
            ))}
          </div>

          <div className={rev.buscaWrap}>
            <svg className={rev.buscaIcone} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="11" cy="11" r="7" />
              <line x1="16.5" y1="16.5" x2="22" y2="22" />
            </svg>
            <input
              className={rev.buscaInput}
              placeholder={tipo === "categorias" ? "buscar categoria..." : "buscar filme..."}
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
            {busca && (
              <button className={rev.buscaLimpar} onClick={() => setBusca("")}>✕</button>
            )}
          </div>
        </div>

        {carregando ? (
          <div className={styles.listaReviews}>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className={styles.reviewCardEsq} />
            ))}
          </div>
        ) : totalVisivel === 0 ? (
          <div className={styles.vazioWrap}>
            <p className={styles.vazio}>
              {busca ? "Nenhuma review encontrada." : "Nenhuma review ainda."}
            </p>
          </div>
        ) : (
          <div className={rev.lista}>
            {/* Reviews de filmes */}
            {(tipo === "todos" || tipo === "filmes") && reviewsFilmesFiltradas.map((item, i) => (
              <RevealSection key={item.id} delay={Math.min(i * 50, 300)}>
                <ReviewFilmeCard item={item} index={0} />
              </RevealSection>
            ))}

            {/* Reviews de categorias */}
            {(tipo === "todos" || tipo === "categorias") && reviewsCategoriasFiltradas.map((l, i) => (
              <RevealSection key={l.id} delay={Math.min(i * 50, 300)}>
                <CardLogCategoria log={l} />
              </RevealSection>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}