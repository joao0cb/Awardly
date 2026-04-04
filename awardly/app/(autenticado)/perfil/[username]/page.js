"use client";

import { useEffect, useState } from "react";
import Parse from "@/lib/parseClient";
import NavbarLogin from "@/app/components/NavbarLogin";
import styles from "@/styles/perfil.module.css";
import pub from "@/styles/perfilPublico.module.css";
import { getFilme, getImageURL } from "@/lib/tmdb";
import { useRouter, useParams } from "next/navigation";

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

function FilmeFavorito({ filme }) {
  const router = useRouter();
  return (
    <div className={styles.filmeFav} onClick={() => router.push(`/filmes/${filme.id}`)}>
      {filme.poster_path ? (
        <img src={getImageURL(filme.poster_path, "w342")} alt={filme.title} className={styles.filmeFavImg} />
      ) : (
        <div className={styles.filmeFavSemPoster}><span>{filme.title}</span></div>
      )}
      <div className={styles.filmeFavOverlay}>
        <span className={styles.filmeFavTitulo}>{filme.title}</span>
      </div>
    </div>
  );
}

function ReviewCard({ review }) {
  return (
    <div className={styles.reviewCard}>
      <img src={getImageURL(review.poster_path, "w185")} alt={review.titulo} className={styles.reviewPoster} />
      <div className={styles.reviewBody}>
        <div className={styles.reviewHeader}>
          <span className={styles.reviewFilme}>{review.titulo}</span>
          {review.like && <img src="/envelopecoracao.png" className={styles.reviewEnvelope} alt="gostei" />}
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

function userPointer(userId) {
  const u = new Parse.User();
  u.id = userId;
  return u;
}

export default function PerfilPublico() {
  const { username } = useParams();
  const router = useRouter();

  const [dadosAlvo, setDadosAlvo] = useState(null);
  const [alvoId, setAlvoId] = useState(null); // objectId guardado no state
  const [usuarioLogado, setUsuarioLogado] = useState(null);
  const [seguindo, setSeguindo] = useState(false);
  const [salvandoFollow, setSalvandoFollow] = useState(false);
  const [seguidores, setSeguidores] = useState(0);
  const [seguindoCount, setSeguindoCount] = useState(0);
  const [totalFilmes, setTotalFilmes] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [totalWatchlist, setTotalWatchlist] = useState(0);
  const [filmesFavoritos, setFilmesFavoritos] = useState([]);
  const [reviewsRecentes, setReviewsRecentes] = useState([]);
  const [atividade, setAtividade] = useState([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    async function carregar() {
      try {
        const logado = Parse.User.current();
        if (logado) {
          await logado.fetch();
          setUsuarioLogado(logado);
          if (logado.get("username") === username) {
            router.replace("/perfil");
            return;
          }
        }

        const dados = await Parse.Cloud.run("buscarUsuarioPorUsername", { username });
        if (!dados) throw new Error("Usuário não encontrado");

        const id = dados.objectId; // id local, usado só neste useEffect
        setDadosAlvo(dados);
        setAlvoId(id); // salva no state pra usar no handleToggleFollow

        const alvoPtr = userPointer(id);

        if (logado) {
          const qFollow = new Parse.Query("Follow");
          qFollow.equalTo("seguidor", logado);
          qFollow.equalTo("seguindo", alvoPtr);
          const followExistente = await qFollow.first();
          setSeguindo(!!followExistente);
        }

        const qSeg = new Parse.Query("Follow");
        qSeg.equalTo("seguindo", alvoPtr);
        const qSeguindo = new Parse.Query("Follow");
        qSeguindo.equalTo("seguidor", alvoPtr);
        const qWatch = new Parse.Query("Watchlist");
        qWatch.equalTo("usuarioId", alvoPtr);

        const [nSeg, nSeguindo, nWatch] = await Promise.all([
          qSeg.count(),
          qSeguindo.count(),
          qWatch.count(),
        ]);
        setSeguidores(nSeg);
        setSeguindoCount(nSeguindo);
        setTotalWatchlist(nWatch);

        const tmdbIds = dados.favoritos || [];
        if (tmdbIds.length > 0) {
          const res = await Promise.allSettled(tmdbIds.map((tid) => getFilme(tid)));
          setFilmesFavoritos(
            res.filter((r) => r.status === "fulfilled" && r.value).map((r) => r.value)
          );
        }

        const qLogs = new Parse.Query("Log");
        qLogs.equalTo("usuarioId", alvoPtr);
        qLogs.descending("createdAt");
        qLogs.limit(20);
        const logs = await qLogs.find();
        setTotalFilmes(logs.length);

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

        const atividadeItems = [];
        const logsAtividade = await Promise.allSettled(
          logs.slice(0, 5).map(async (l) => {
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
        logsAtividade.filter((r) => r.status === "fulfilled").forEach((r) => atividadeItems.push(r.value));

        const qFollows = new Parse.Query("Follow");
        qFollows.equalTo("seguidor", alvoPtr);
        qFollows.descending("createdAt");
        qFollows.limit(3);
        qFollows.include("seguindo");
        const follows = await qFollows.find();
        follows.forEach((f) => {
          const seg = f.get("seguindo");
          atividadeItems.push({
            tipo: "seguindo",
            texto: `começou a seguir ${seg?.get("nome") || seg?.get("username") || "alguém"}`,
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
  }, [username]);

  async function handleToggleFollow() {
    if (!usuarioLogado || !alvoId || salvandoFollow) return;
    setSalvandoFollow(true);
    const alvoPtr = userPointer(alvoId); // usa alvoId do state
    try {
      if (seguindo) {
        const qFollow = new Parse.Query("Follow");
        qFollow.equalTo("seguidor", usuarioLogado);
        qFollow.equalTo("seguindo", alvoPtr);
        const followExistente = await qFollow.first();
        if (followExistente) await followExistente.destroy();
        setSeguindo(false);
        setSeguidores((n) => n - 1);
      } else {
        const Follow = Parse.Object.extend("Follow");
        const novoFollow = new Follow();
        novoFollow.set("seguidor", usuarioLogado);
        novoFollow.set("seguindo", alvoPtr);
        const acl = new Parse.ACL();
        acl.setPublicReadAccess(true);
        acl.setWriteAccess(usuarioLogado.id, true);
        novoFollow.setACL(acl);
        await novoFollow.save();
        setSeguindo(true);
        setSeguidores((n) => n + 1);
      }
    } catch (e) {
      console.error("Erro ao seguir/deixar de seguir:", e);
    } finally {
      setSalvandoFollow(false);
    }
  }

  if (carregando) {
    return (
      <main className={styles.principal}>
        <NavbarLogin usuario={{ nome: "", foto: null }} />
        <div className={styles.esqueletoPage} />
      </main>
    );
  }

  if (!dadosAlvo) {
    return (
      <main className={styles.principal}>
        <NavbarLogin usuario={{ nome: "", foto: null }} />
        <div className={styles.conteudoFull}>
          <p className={styles.vazio}>Usuário não encontrado.</p>
        </div>
      </main>
    );
  }

  const nome = dadosAlvo.nome || dadosAlvo.username || "Usuário";
  const bio = dadosAlvo.bio || "";
  const foto = dadosAlvo.foto || null;
  const bannerUrl = dadosAlvo.banner || null;

  const nomeLogado = usuarioLogado?.get("nome") || usuarioLogado?.get("username") || "";
  const fotoLogadoObj = usuarioLogado?.get("foto");
  const fotoLogado = (typeof fotoLogadoObj?.url === "function" ? fotoLogadoObj.url() : fotoLogadoObj?._url) || null;

  return (
    <main className={styles.principal}>
      <NavbarLogin usuario={{ nome: nomeLogado, foto: fotoLogado }} />

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
            {bio && <p className={styles.bioUsuario}>{bio}</p>}
          </div>
          {usuarioLogado && (
            <button
              className={seguindo ? pub.btnSeguindo : pub.btnSeguir}
              onClick={handleToggleFollow}
              disabled={salvandoFollow}
            >
              {salvandoFollow ? "..." : seguindo ? "seguindo" : "seguir"}
            </button>
          )}
        </div>
      </div>

      <div className={styles.estatRow}>
        <div className={styles.estatCard}>
          <span className={styles.estatValor}>{totalFilmes}</span>
          <span className={styles.estatLabel}>filmes registrados</span>
        </div>
        <div className={styles.estatCard}>
          <span className={styles.estatValor}>{totalReviews}</span>
          <span className={styles.estatLabel}>reviews</span>
        </div>
        <div className={styles.estatCard}>
          <span className={styles.estatValor}>{totalWatchlist}</span>
          <span className={styles.estatLabel}>watchlist</span>
        </div>
        <div
          className={`${styles.estatCard} ${pub.estatClicavel}`}
          onClick={() => router.push(`/seguidores/${username}?aba=seguidores`)}
        >
          <span className={styles.estatValor}>{seguidores}</span>
          <span className={styles.estatLabel}>seguidores</span>
        </div>
        <div
          className={`${styles.estatCard} ${pub.estatClicavel}`}
          onClick={() => router.push(`/seguidores/${username}?aba=seguindo`)}
        >
          <span className={styles.estatValor}>{seguindoCount}</span>
          <span className={styles.estatLabel}>seguindo</span>
        </div>
      </div>

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