"use client";

import { useEffect, useState } from "react";
import Parse from "@/lib/parseClient";
import NavbarLogin from "../components/NavbarLogin";
import TabsPerfil from "../components/TabsPerfil";
import styles from "@/styles/perfil.module.css";
import { getFilme, getImageURL } from "@/lib/tmdb";
import { useRouter } from "next/navigation";

function EstatCard({ valor, label }) {
  return (
    <div className={styles.estatCard}>
      <span className={styles.estatValor}>{valor}</span>
      <span className={styles.estatLabel}>{label}</span>
    </div>
  );
}

function FilmeFavorito({ filme }) {
  return (
    <div className={styles.filmeFav}>
      {filme.poster_path ? (
        <img
          src={getImageURL(filme.poster_path, "w342")}
          alt={filme.title || filme.nome}
          className={styles.filmeFavImg}
        />
      ) : (
        <div className={styles.filmeFavSemPoster}>
          <span>{filme.title || filme.nome}</span>
        </div>
      )}
      <div className={styles.filmeFavOverlay}>
        <span className={styles.filmeFavTitulo}>{filme.title || filme.nome}</span>
      </div>
    </div>
  );
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
              <div style={{ position: "relative", width: 16, height: 16 }}>
                <img src="/oscar2.png" className={styles.estatuetaMini} style={{ clipPath: "inset(0 50% 0 0)", position: "absolute" }} />
                <img src="/oscarvazio.png" className={styles.estatuetaMini} style={{ clipPath: "inset(0 0 0 50%)", position: "absolute", opacity: 0.3 }} />
              </div>
            ) : (
              <img src="/oscarvazio.png" className={styles.estatuetaMini} style={{ opacity: 0.3 }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function ReviewCard({ review }) {
  return (
    <div className={styles.reviewCard}>
      <img
        src={getImageURL(review.poster_path, "w185")}
        alt={review.titulo}
        className={styles.reviewPoster}
      />
      <div className={styles.reviewBody}>
        <div className={styles.reviewHeader}>
          <span className={styles.reviewFilme}>{review.titulo}</span>
          {review.like && (
            <img src="/envelopecoracao.png" className={styles.reviewEnvelope} alt="gostei" />
          )}
        </div>
        {review.estatuetas > 0 && <Estatuetas valor={review.estatuetas} />}
        <p className={styles.reviewTexto}>{review.review}</p>
        <span className={styles.reviewData}>{review.data}</span>
      </div>
    </div>
  );
}

function AtividadeItem({ item }) {
  const icones = { log: "🎬", review: "✍️", seguindo: "👤" };
  return (
    <div className={styles.atividadeItem}>
      <span className={styles.atividadeIcone}>{icones[item.tipo]}</span>
      <div className={styles.atividadeInfo}>
        <p className={styles.atividadeTexto}>{item.texto}</p>
        <span className={styles.atividadeData}>{item.data}</span>
      </div>
    </div>
  );
}

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

export default function Perfil() {
  const [usuario, setUsuario] = useState(null);
  const [seguidores, setSeguidores] = useState(0);
  const [seguindo, setSeguindo] = useState(0);
  const [totalFilmes, setTotalFilmes] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [filmesFavoritos, setFilmesFavoritos] = useState([]);
  const [reviewsRecentes, setReviewsRecentes] = useState([]);
  const [atividade, setAtividade] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function carregar() {
      try {
        const user = Parse.User.current();
        if (!user) { setCarregando(false); return; }
        setUsuario(user);

        const qSeg = new Parse.Query("Follow");
        qSeg.equalTo("seguindo", user);
        const qSeguindo = new Parse.Query("Follow");
        qSeguindo.equalTo("seguidor", user);
        const [nSeg, nSeguindo] = await Promise.all([qSeg.count(), qSeguindo.count()]);
        setSeguidores(nSeg);
        setSeguindo(nSeguindo);

        const tmdbIds = user.get("favoritos") || [];
        if (tmdbIds.length > 0) {
          const res = await Promise.allSettled(tmdbIds.map((id) => getFilme(id)));
          setFilmesFavoritos(res.filter((r) => r.status === "fulfilled" && r.value).map((r) => r.value));
        }

        const qLogs = new Parse.Query("Log");
        qLogs.equalTo("usuarioId", user);
        qLogs.descending("createdAt");
        qLogs.limit(20);
        const logs = await qLogs.find();

        setTotalFilmes(logs.length);

        const logsComReview = logs.filter((l) => l.get("review"));
        setTotalReviews(logsComReview.length);

        const top3Reviews = logsComReview.slice(0, 3);
        const reviewsDetalhes = await Promise.allSettled(
          top3Reviews.map(async (r) => {
            const filme = await getFilme(r.get("filmeId"));
            return {
              titulo: filme?.title || "Filme",
              poster_path: filme?.poster_path || null,
              estatuetas: r.get("estatuetas") || 0,
              like: r.get("like") || false,
              review: r.get("review"),
              data: tempoRelativo(r.createdAt),
            };
          })
        );
        setReviewsRecentes(
          reviewsDetalhes.filter((r) => r.status === "fulfilled").map((r) => r.value)
        );

        const atividadeItems = [];

        const top5Logs = logs.slice(0, 5);
        const logsAtividade = await Promise.allSettled(
          top5Logs.map(async (l) => {
            const filme = await getFilme(l.get("filmeId"));
            const temReview = !!l.get("review");
            return {
              tipo: temReview ? "review" : "log",
              texto: temReview
                ? `escreveu uma review de "${filme?.title || "filme"}"`
                : `registrou "${filme?.title || "filme"}"`,
              data: tempoRelativo(l.createdAt),
              createdAt: l.createdAt,
            };
          })
        );
        logsAtividade
          .filter((r) => r.status === "fulfilled")
          .forEach((r) => atividadeItems.push(r.value));

        const qFollows = new Parse.Query("Follow");
        qFollows.equalTo("seguidor", user);
        qFollows.descending("createdAt");
        qFollows.limit(3);
        qFollows.include("seguindo");
        const follows = await qFollows.find();
        follows.forEach((f) => {
          const seguindoUser = f.get("seguindo");
          const nomeAlvo = seguindoUser?.get("nome") || seguindoUser?.get("username") || "alguém";
          atividadeItems.push({
            tipo: "seguindo",
            texto: `começou a seguir ${nomeAlvo}`,
            data: tempoRelativo(f.createdAt),
            createdAt: f.createdAt,
          });
        });

        atividadeItems.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setAtividade(atividadeItems.slice(0, 5));

      } catch (e) {
        console.error(e);
      } finally {
        setCarregando(false);
      }
    }
    carregar();
  }, []);

  if (carregando) {
    return (
      <main className={styles.principal}>
        <NavbarLogin usuario={{ nome: "", foto: null }} />
        <div className={styles.esqueletoPage} />
      </main>
    );
  }

  const nome = usuario?.get("nome") || usuario?.get("username") || "Usuário";
  const bio = usuario?.get("bio") || "Cinéfilo apaixonado por Oscar.";
  const foto = usuario?.get("foto")?._url || null;
  const bannerUrl = usuario?.get("banner")?._url || null;

  return (
    <main className={styles.principal}>
      <NavbarLogin usuario={{ nome, foto }} />

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
            <p className={styles.bioUsuario}>{bio}</p>
          </div>
          <button className={styles.btnEditar} onClick={() => router.push("/editarPerfil")}>
            Editar perfil
          </button>
        </div>
      </div>

      <div className={styles.estatRow}>
        <EstatCard valor={totalFilmes} label="filmes registrados" />
        <EstatCard valor={totalReviews} label="reviews" />
        <EstatCard valor={seguidores} label="seguidores" />
        <EstatCard valor={seguindo} label="seguindo" />
      </div>

      <TabsPerfil ativa="perfil" />

      <div className={styles.conteudo}>
        <div className={styles.colunaEsq}>
          <section className={styles.secao}>
            <h2 className={styles.tituloSecao}>filmes favoritos</h2>
            {filmesFavoritos.length > 0 ? (
              <div className={styles.gradeFilmesFav}>
                {filmesFavoritos.map((f) => (
                  <FilmeFavorito key={f.id} filme={f} />
                ))}
              </div>
            ) : (
              <p className={styles.vazio}>Nenhum filme favorito ainda.</p>
            )}
          </section>

          <section className={styles.secao}>
            <h2 className={styles.tituloSecao}>reviews recentes</h2>
            {reviewsRecentes.length > 0 ? (
              <div className={styles.listaReviews}>
                {reviewsRecentes.map((r, i) => (
                  <ReviewCard key={i} review={r} />
                ))}
              </div>
            ) : (
              <p className={styles.vazio}>Nenhuma review ainda.</p>
            )}
          </section>
        </div>

        <aside className={styles.sidebar}>
          <section className={styles.secao}>
            <h2 className={styles.tituloSecao}>atividade recente</h2>
            {atividade.length > 0 ? (
              <div className={styles.listaAtividade}>
                {atividade.map((a, i) => (
                  <AtividadeItem key={i} item={a} />
                ))}
              </div>
            ) : (
              <p className={styles.vazio}>Nenhuma atividade ainda.</p>
            )}
          </section>
        </aside>
      </div>
    </main>
  );
}