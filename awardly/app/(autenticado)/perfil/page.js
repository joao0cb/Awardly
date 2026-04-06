"use client";

import { useEffect, useState } from "react";
import Parse from "@/lib/parseClient";
import TabsPerfil from "../../components/TabsPerfil";
import styles from "@/styles/perfil.module.css";
import { getFilme, getImageURL } from "@/lib/tmdb";
import { useRouter } from "next/navigation";
import pub from "@/styles/perfilPublico.module.css";
import CardLogCategoria from "@/app/components/CardLogCategoria";
import AtividadeItem from "@/app/components/AtividadeItem";
import RevealSection from '@/app/components/RevealSection';

function EstatCard({ valor, label, onClick }) {
  return (
    <div
      className={`${styles.estatCard} ${onClick ? pub.estatClicavel : ""}`}
      onClick={onClick}
    >
      <span className={styles.estatValor}>{valor}</span>
      <span className={styles.estatLabel}>{label}</span>
    </div>
  );
}

function FilmeFavorito({ filme }) {
  const router = useRouter();
  return (
    <div className={styles.filmeFav} onClick={() => router.push(`/filmes/${filme.id}`)}>
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

function FilmeVisto({ filme }) {
  const router = useRouter();
  return (
    <div className={styles.filmeFav} onClick={() => router.push(`/filmes/${filme.id}`)}>
      {filme.poster_path ? (
        <img
          src={getImageURL(filme.poster_path, "w342")}
          alt={filme.title}
          className={styles.filmeFavImg}
        />
      ) : (
        <div className={styles.filmeFavSemPoster} />
      )}
      {filme.like && (
        <img src="/envelopecoracao.png" className={styles.cardFilmeLike} alt="" />
      )}
      <div className={styles.filmeFavOverlay}>
        <span className={styles.filmeFavTitulo}>{filme.title}</span>
        {filme.estatuetas > 0 && (
          <div className={styles.filmeVistoNota}>
            <img src="/oscar2.png" className={styles.filmeVistoOscar} alt="" />
            <span>{filme.estatuetas}</span>
          </div>
        )}
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
              <div style={{ position: "relative", width: 28, height: 28 }}>
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
  const [totalWatchlist, setTotalWatchlist] = useState(0);
  const [totalCategorias, setTotalCategorias] = useState(0);
  const [filmesFavoritos, setFilmesFavoritos] = useState([]);
  const [filmesVistos, setFilmesVistos] = useState([]);
  const [reviewsRecentes, setReviewsRecentes] = useState([]);
  const [logsCategoria, setLogsCategoria] = useState([]);
  const [atividade, setAtividade] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function carregar() {
      try {
        const user = Parse.User.current();
        if (!user) { setCarregando(false); return; }
        await user.fetch();
        setUsuario(user);

        const qSeg = new Parse.Query("Follow");
        qSeg.equalTo("seguindo", user);
        const qSeguindo = new Parse.Query("Follow");
        qSeguindo.equalTo("seguidor", user);
        const qWatch = new Parse.Query("Watchlist");
        qWatch.equalTo("usuarioId", user);
        const qCat = new Parse.Query("LogCategoria");
        qCat.equalTo("usuarioId", user);

        const [nSeg, nSeguindo, nWatch, nCat] = await Promise.all([
          qSeg.count(), qSeguindo.count(), qWatch.count(), qCat.count(),
        ]);
        setSeguidores(nSeg);
        setSeguindo(nSeguindo);
        setTotalWatchlist(nWatch);
        setTotalCategorias(nCat);

        // Favoritos
        const tmdbIds = user.get("favoritos") || [];
        if (tmdbIds.length > 0) {
          const res = await Promise.allSettled(tmdbIds.map((id) => getFilme(id)));
          setFilmesFavoritos(
            res.filter((r) => r.status === "fulfilled" && r.value).map((r) => r.value)
          );
        }

        // Logs de filmes
        const qLogs = new Parse.Query("Log");
        qLogs.equalTo("usuarioId", user);
        qLogs.descending("createdAt");
        qLogs.limit(20);
        const logs = await qLogs.find();
        setTotalFilmes(logs.length);

        // 4 filmes vistos mais recentes
        const top4Logs = logs.slice(0, 4);
        const filmesVistosDetalhes = await Promise.allSettled(
          top4Logs.map(async (l) => {
            const f = await getFilme(l.get("filmeId"));
            return f ? {
              ...f,
              estatuetas: l.get("estatuetas") || 0,
              like: l.get("like") || false,
            } : null;
          })
        );
        setFilmesVistos(
          filmesVistosDetalhes
            .filter((r) => r.status === "fulfilled" && r.value)
            .map((r) => r.value)
        );

        // Reviews recentes — max 3
        const logsComReview = logs.filter((l) => l.get("review"));
        setTotalReviews(logsComReview.length);
        const reviewsDetalhes = await Promise.allSettled(
          logsComReview.slice(0, 3).map(async (r) => {
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

        // Últimos 2 logs de categoria
        const qLogCat = new Parse.Query("LogCategoria");
        qLogCat.equalTo("usuarioId", user);
        qLogCat.descending("createdAt");
        qLogCat.limit(2);
        const logsCat = await qLogCat.find();
        setLogsCategoria(logsCat.map((l) => ({
          id: l.id,
          categoria: l.get("categoria"),
          ano: l.get("ano"),
          vencedorReal: l.get("vencedorReal"),
          deveriaTerGanhado: l.get("deveriaTerGanhado"),
          queriaQueGanhasse: l.get("queriaQueGanhasse"),
          review: l.get("review"),
          data: tempoRelativo(l.createdAt),
        })));

        // Atividade recente — "Você fez X"
        const atividadeItems = [];
 
        const logsAtividade = await Promise.allSettled(
          logs.slice(0, 5).map(async (l) => {
            const filme = await getFilme(l.get("filmeId"));
            const temReview = !!l.get("review");
            return {
              tipo: temReview ? "review" : "log",
              texto: temReview
                ? `Você escreveu uma review de "${filme?.title || "filme"}"`
                : `Você logou "${filme?.title || "filme"}"`,
              data: tempoRelativo(l.createdAt),
              createdAt: l.createdAt,
              link: filme ? `/filmes/${l.get("filmeId")}` : null,
            };
          })
        );
        logsAtividade
          .filter((r) => r.status === "fulfilled")
          .forEach((r) => atividadeItems.push(r.value));
 
        logsCat.forEach((l) => {
          atividadeItems.push({
            tipo: "categoria",
            texto: `Você avaliou "${l.get("categoria")}" (${l.get("ano")})`,
            data: tempoRelativo(l.createdAt),
            createdAt: l.createdAt,
            link: "/perfil/categorias",
          });
        });
 
        const qFollows = new Parse.Query("Follow");
        qFollows.equalTo("seguidor", user);
        qFollows.descending("createdAt");
        qFollows.limit(3);
        const follows = await qFollows.find();

        await Promise.allSettled(follows.map(async (f) => {
          const seguindoId = f.get("seguindo")?.id;
          if (!seguindoId) return;
          try {
            const dados = await Parse.Cloud.run("buscarUsuario", { id: seguindoId });
            const nomeAlvo = dados.nome || dados.username || "alguém";
            atividadeItems.push({
              tipo: "seguindo",
              texto: `Você começou a seguir "${nomeAlvo}"`,
              data: tempoRelativo(f.createdAt),
              createdAt: f.createdAt,   // ← data real do follow
              link: dados.username ? `/perfil/${dados.username}` : null,
            });
          } catch {}
        }));

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
        <div className={styles.esqueletoPage} />
      </main>
    );
  }

  const nome = usuario?.get("nome") || usuario?.get("username") || "Usuário";
  const bio = usuario?.get("bio") || "Cinéfilo apaixonado por Oscar.";
  const fotoObj = usuario?.get("foto");
  const foto = (typeof fotoObj?.url === "function" ? fotoObj.url() : fotoObj?._url) || null;
  const bannerObj = usuario?.get("banner");
  const bannerUrl = (typeof bannerObj?.url === "function" ? bannerObj.url() : bannerObj?._url) || null;
  const username = usuario?.get("username") || "";

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
            <p className={styles.bioUsuario}>{bio}</p>
          </div>
          <button className={styles.btnEditar} onClick={() => router.push("/editarPerfil")}>
            Editar perfil
          </button>
          <button className={styles.btnSair} onClick={async () => {
            await Parse.User.logOut();
            document.cookie = 'awardly_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/';
            document.cookie = 'awardly_lembrar=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/';
            window.location.href = '/';
          }}>
            Sair
          </button>
        </div>
      </div>

      <div className={styles.estatRow}>
        <EstatCard valor={totalFilmes} label="filmes registrados" />
        <EstatCard valor={totalCategorias} label="categorias avaliadas" />
        <EstatCard valor={totalReviews} label="reviews" />
        <EstatCard valor={totalWatchlist} label="watchlist" />
        <EstatCard
          valor={seguidores}
          label="seguidores"
          onClick={() => router.push(`/seguidores/${username}?aba=seguidores`)}
        />
        <EstatCard
          valor={seguindo}
          label="seguindo"
          onClick={() => router.push(`/seguidores/${username}?aba=seguindo`)}
        />
      </div>

      <TabsPerfil ativa="perfil" />

      <div className={styles.conteudo}>
        <div className={styles.colunaEsq}>

          {/* Filmes favoritos */}
          <section className={styles.secao}>
            <h2 className={styles.tituloSecao}>filmes favoritos</h2>
            {filmesFavoritos.length > 0 ? (
              <div className={styles.gradeFilmesFav}>
                {filmesFavoritos.map((f, i) => (
                  <div key={f.id} className={styles.fadeUp} style={{ animationDelay: `${i * 60}ms` }}>
                    <FilmeFavorito filme={f} />
                  </div>
                ))}
              </div>
            ) : (
              <p className={styles.vazio}>Nenhum filme favorito ainda.</p>
            )}
          </section>

          {/* Recentes — filmes vistos + logs de categoria juntos */}
          <RevealSection delay={100}>
            <section className={styles.secao}>
              <h2 className={styles.tituloSecao}>recentes</h2>

              {filmesVistos.length > 0 && (
                <div className={styles.gradeFilmesFav}>
                  {filmesVistos.map((f, i) => (
                    <div key={f.id} className={styles.fadeUp} style={{ animationDelay: `${i * 60}ms` }}>
                      <FilmeVisto filme={f} />
                    </div>
                  ))}
                </div>
              )}

              {logsCategoria.length > 0 && (
                <div className={styles.listaLogsCat}>
                  {logsCategoria.map((l, i) => (
                    <div key={l.id} className={styles.fadeUp} style={{ animationDelay: `${i * 80}ms` }}>
                      <CardLogCategoria log={l} />
                    </div>
                  ))}
                </div>
              )}

              {filmesVistos.length === 0 && logsCategoria.length === 0 && (
                <p className={styles.vazio}>Nenhuma atividade ainda.</p>
              )}
            </section>
          </RevealSection>

          {/* Reviews recentes */}
          <RevealSection delay={100}>
            <section className={styles.secao}>
              <h2 className={styles.tituloSecao}>reviews recentes</h2>
              {reviewsRecentes.length > 0 ? (
                <div className={styles.listaReviews}>
                  {reviewsRecentes.map((r, i) => (
                    <div key={i} className={styles.fadeUp} style={{ animationDelay: `${i * 80}ms` }}>
                      <ReviewCard review={r} />
                    </div>
                  ))}
                </div>
              ) : (
                <p className={styles.vazio}>Nenhuma review ainda.</p>
              )}
            </section>
          </RevealSection>
        </div>

        <aside className={styles.sidebar}>
          <section className={styles.secao}>
            <h2 className={styles.tituloSecao}>atividade recente</h2>
            {atividade.length > 0 ? (
              <div className={styles.listaAtividade}>
                {atividade.map((a, i) => (
                  <div key={i} className={styles.fadeUp} style={{ animationDelay: `${i * 60}ms` }}>
                    <AtividadeItem item={a} />
                  </div>
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