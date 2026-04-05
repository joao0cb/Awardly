"use client";
import { useEffect, useState } from "react";
import Parse from "@/lib/parseClient";
import { getFilme, getImageURL } from "@/lib/tmdb";
import { useRouter } from "next/navigation";
import styles from "@/styles/homeLogin.module.css";

// ─── Helpers ────────────────────────────────────────────────

async function buscarIndicados(anoOscar) {
  const Filme = Parse.Object.extend("Filme");
  const query = new Parse.Query(Filme);
  query.equalTo("ano", anoOscar);
  query.equalTo("categorias", "Melhor Filme");
  query.limit(20);
  const resultados = await query.find();
  return resultados.map((f) => ({
    objectId: f.id,
    tmdbId: f.get("tmdbId"),
    titulo: f.get("titulo"),
    vencedor: (f.get("vencedores") || []).includes("Melhor Filme"),
  }));
}

async function buscarAmigosIds(user) {
  const meuPtr = userPointer(user.id);

  const qSeguindo = new Parse.Query("Follow");
  qSeguindo.equalTo("seguidor", meuPtr);
  qSeguindo.limit(100);

  const qSeguidores = new Parse.Query("Follow");
  qSeguidores.equalTo("seguindo", meuPtr);
  qSeguidores.limit(100);

  const [seguindo, seguidores] = await Promise.all([
    qSeguindo.find(),
    qSeguidores.find(),
  ]);

  const ids = new Set();
  seguindo.forEach((f) => {
    const id = f.get("seguindo")?.id || f.toJSON()?.seguindo?.objectId;
    if (id) ids.add(id);
  });
  seguidores.forEach((f) => {
    const id = f.get("seguidor")?.id || f.toJSON()?.seguidor?.objectId;
    if (id) ids.add(id);
  });
  return [...ids];
}

function userPointer(id) {
  const u = new Parse.User();
  u.id = id;
  return u;
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

// ─── Indicados ──────────────────────────────────────────────

function CardFilme({ tmdbId, titulo, vencedor, indice }) {
  const router = useRouter();
  const [detalhes, setDetalhes] = useState(null);

  useEffect(() => {
    getFilme(tmdbId).then(setDetalhes).catch(console.error);
  }, [tmdbId]);

  if (!detalhes) {
    return (
      <div className={styles.cardFilme} style={{ animationDelay: `${indice * 0.06}s` }}>
        <div className={styles.esqueleto} />
      </div>
    );
  }

  return (
    <div
      className={`${styles.cardFilme} ${vencedor ? styles.cardFilmeVencedor : ""}`}
      style={{ animationDelay: `${indice * 0.06}s` }}
      onClick={() => router.push(`/filmes/${tmdbId}`)}
    >
      {detalhes.poster_path ? (
        <img
          src={getImageURL(detalhes.poster_path, "w500")}
          alt={detalhes.title || titulo}
          className={styles.posterFilme}
          loading={indice < 5 ? "eager" : "lazy"}
        />
      ) : (
        <div className={styles.esqueleto} />
      )}
      {vencedor && (
        <div className={styles.wrapperOscar}>
          <span className={styles.textoVencedor}>VENCEDOR</span>
          <img src="/oscar2.png" alt="Vencedor" className={styles.iconeOscar} />
        </div>
      )}
      <div className={styles.sobreposicaoFilme}>
        <p className={styles.tituloFilme}>{detalhes.title || titulo}</p>
        <span className={styles.anoFilme}>{detalhes.release_date?.slice(0, 4)}</span>
      </div>
    </div>
  );
}

function CardEsqueleto({ indice }) {
  return (
    <div className={styles.cardFilme} style={{ animationDelay: `${indice * 0.06}s` }}>
      <div className={styles.esqueleto} />
    </div>
  );
}

function SecaoFilmes({ ano }) {
  const [indicados, setIndicados] = useState([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    buscarIndicados(ano)
      .then(setIndicados)
      .catch(console.error)
      .finally(() => setCarregando(false));
  }, [ano]);

  return (
    <section className={styles.secao}>
      <div className={styles.cabecalhoSecao}>
        <p className={styles.anoSecao}>oscar {ano}</p>
        <h2 className={styles.tituloSecao}>indicados a melhor filme</h2>
      </div>
      <div className={styles.gradeFilmes}>
        {carregando
          ? Array.from({ length: 10 }).map((_, i) => <CardEsqueleto key={i} indice={i} />)
          : indicados.map((f, i) => (
              <CardFilme key={f.objectId} tmdbId={f.tmdbId} titulo={f.titulo} vencedor={f.vencedor} indice={i} />
            ))}
      </div>
    </section>
  );
}

// ─── Últimos logs de amigos ──────────────────────────────────

function CardLogAmigo({ log }) {
  const router = useRouter();
  const [detalhes, setDetalhes] = useState(null);

  useEffect(() => {
    getFilme(log.filmeId).then(setDetalhes).catch(console.error);
  }, [log.filmeId]);

  return (
    <div className={styles.cardLogAmigo} onClick={() => router.push(`/filmes/${log.filmeId}`)}>
      <div className={styles.cardLogPoster}>
        {detalhes?.poster_path ? (
          <img src={getImageURL(detalhes.poster_path, "w185")} alt={detalhes.title} className={styles.cardLogImg} />
        ) : (
          <div className={styles.cardLogSemPoster} />
        )}
        {log.like && <img src="/envelopecoracao.png" className={styles.cardLogLike} alt="" />}
        {log.estatuetas > 0 && (
          <div className={styles.cardLogNota}>
            <img src="/oscar2.png" className={styles.cardLogOscarMini} alt="" />
            <span>{log.estatuetas}</span>
          </div>
        )}
        <div className={styles.cardLogOverlay}>
          <span className={styles.cardLogFilme}>{detalhes?.title || "..."}</span>
          <span className={styles.cardLogAmigo2}>
            <img
              src={log.fotoAmigo || "/placeholder-user.png"}
              className={styles.cardLogAvatarMini}
              alt=""
              onError={(e) => { e.target.style.display = "none"; }}
            />
            {log.nomeAmigo}
          </span>
          <span className={styles.cardLogData}>{log.data}</span>
        </div>
      </div>
    </div>
  );
}

function SecaoLogsAmigos({ amigosIds }) {
  const [logs, setLogs] = useState([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    if (amigosIds.length === 0) { setCarregando(false); return; }
    async function carregar() {
      try {
        const batches = [];
        for (let i = 0; i < amigosIds.length; i += 10) batches.push(amigosIds.slice(i, i + 10));

        const todosLogs = [];
        await Promise.allSettled(batches.map(async (batch) => {
          const ptrs = batch.map(userPointer);
          const q = new Parse.Query("Log");
          q.containedIn("usuarioId", ptrs);
          q.descending("createdAt");
          q.limit(20);
          q.include("usuarioId");
          const res = await q.find();
          todosLogs.push(...res);
        }));

        todosLogs.sort((a, b) => b.createdAt - a.createdAt);

        const mapped = todosLogs.slice(0, 8).map((l) => {
          const u = l.get("usuarioId");
          const fotoObj = u?.get("foto");
          return {
            id: l.id,
            filmeId: l.get("filmeId"),
            estatuetas: l.get("estatuetas") || 0,
            like: l.get("like") || false,
            nomeAmigo: u?.get("nome") || u?.get("username") || "Amigo",
            fotoAmigo: (typeof fotoObj?.url === "function" ? fotoObj.url() : fotoObj?._url) || null,
            data: tempoRelativo(l.createdAt),
          };
        });

        setLogs(mapped);
      } catch (e) {
        console.error(e);
      } finally {
        setCarregando(false);
      }
    }
    carregar();
  }, [amigosIds.join(",")]);

  if (!carregando && logs.length === 0) return null;

  return (
    <section className={styles.secao}>
      <div className={styles.cabecalhoSecao}>
        <p className={styles.anoSecao}>&nbsp;</p>
        <h2 className={styles.tituloSecao}>últimos filmes registrados</h2>
      </div>
      <div className={styles.gradeLogsAmigos}>
        {carregando
          ? Array.from({ length: 8 }).map((_, i) => <div key={i} className={styles.cardLogEsq} />)
          : logs.map((log) => <CardLogAmigo key={log.id} log={log} />)}
      </div>
    </section>
  );
}

// ─── Últimas reviews de amigos ───────────────────────────────

function CardReviewAmigo({ review }) {
  const router = useRouter();
  const [detalhes, setDetalhes] = useState(null);

  useEffect(() => {
    getFilme(review.filmeId).then(setDetalhes).catch(console.error);
  }, [review.filmeId]);

  return (
    <div className={styles.cardReviewAmigo} onClick={() => router.push(`/filmes/${review.filmeId}`)}>
      {detalhes?.poster_path && (
        <img src={getImageURL(detalhes.poster_path, "w185")} alt={detalhes.title} className={styles.cardReviewPoster} />
      )}
      <div className={styles.cardReviewBody}>
        <div className={styles.cardReviewTopo}>
          <span className={styles.cardReviewFilme}>{detalhes?.title || "..."}</span>
          {review.like && <img src="/envelopecoracao.png" className={styles.cardReviewEnvelope} alt="" />}
        </div>
        {review.estatuetas > 0 && (
          <div className={styles.cardReviewNota}>
            {[1,2,3,4,5].map((i) => (
              <img key={i} src={review.estatuetas >= i ? "/oscar2.png" : "/oscarvazio.png"} className={styles.cardReviewOscarMini} style={{ opacity: review.estatuetas >= i ? 1 : 0.3 }} alt="" />
            ))}
          </div>
        )}
        <p className={styles.cardReviewTexto}>{review.review}</p>
        <div className={styles.cardReviewRodape}>
          <span className={styles.cardReviewAmigo2}>
            <img
              src={review.fotoAmigo || "/placeholder-user.png"}
              className={styles.cardLogAvatarMini}
              alt=""
              onError={(e) => { e.target.style.display = "none"; }}
            />
            {review.nomeAmigo}
          </span>
          <span className={styles.cardReviewData}>{review.data}</span>
        </div>
      </div>
    </div>
  );
}

function SecaoReviewsAmigos({ amigosIds }) {
  const [reviews, setReviews] = useState([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    if (amigosIds.length === 0) { setCarregando(false); return; }
    async function carregar() {
      try {
        const batches = [];
        for (let i = 0; i < amigosIds.length; i += 10) batches.push(amigosIds.slice(i, i + 10));

        const todosLogs = [];
        await Promise.allSettled(batches.map(async (batch) => {
          const ptrs = batch.map(userPointer);
          const q = new Parse.Query("Log");
          q.containedIn("usuarioId", ptrs);
          q.exists("review");
          q.descending("createdAt");
          q.limit(10);
          q.include("usuarioId");
          const res = await q.find();
          todosLogs.push(...res);
        }));

        todosLogs.sort((a, b) => b.createdAt - a.createdAt);

        const mapped = todosLogs.slice(0, 4).map((l) => {
          const u = l.get("usuarioId");
          const fotoObj = u?.get("foto");
          return {
            id: l.id,
            filmeId: l.get("filmeId"),
            estatuetas: l.get("estatuetas") || 0,
            like: l.get("like") || false,
            review: l.get("review"),
            nomeAmigo: u?.get("nome") || u?.get("username") || "Amigo",
            fotoAmigo: (typeof fotoObj?.url === "function" ? fotoObj.url() : fotoObj?._url) || null,
            data: tempoRelativo(l.createdAt),
          };
        });

        setReviews(mapped);
      } catch (e) {
        console.error(e);
      } finally {
        setCarregando(false);
      }
    }
    carregar();
  }, [amigosIds.join(",")]);

  if (!carregando && reviews.length === 0) return null;

  return (
    <section className={styles.secao}>
      <div className={styles.cabecalhoSecao}>
        <p className={styles.anoSecao}>&nbsp;</p>
        <h2 className={styles.tituloSecao}>últimas reviews</h2>
      </div>
      <div className={styles.listaReviewsAmigos}>
        {carregando
          ? Array.from({ length: 3 }).map((_, i) => <div key={i} className={styles.cardReviewEsq} />)
          : reviews.map((r) => <CardReviewAmigo key={r.id} review={r} />)}
      </div>
    </section>
  );
}

// ─── Ranking geral do site ───────────────────────────────────

function SecaoRanking() {
  const [ranking, setRanking] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function carregar() {
      try {
        // Busca os 200 logs mais recentes do site inteiro
        const q = new Parse.Query("Log");
        q.descending("createdAt");
        q.limit(200);
        const logs = await q.find();

        // Conta por filmeId
        const contagem = {};
        logs.forEach((l) => {
          const id = l.get("filmeId");
          contagem[id] = (contagem[id] || 0) + 1;
        });

        const top5 = Object.entries(contagem)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([filmeId, total]) => ({ filmeId: Number(filmeId), total }));

        const comDetalhes = await Promise.allSettled(
          top5.map(async ({ filmeId, total }) => {
            const d = await getFilme(filmeId);
            return { filmeId, total, detalhes: d };
          })
        );

        setRanking(
          comDetalhes.filter((r) => r.status === "fulfilled").map((r) => r.value)
        );
      } catch (e) {
        console.error(e);
      } finally {
        setCarregando(false);
      }
    }
    carregar();
  }, []);

  if (!carregando && ranking.length === 0) return null;

  return (
    <section className={styles.secao}>
      <div className={styles.cabecalhoSecao}>
        <p className={styles.anoSecao}>&nbsp;</p>
        <h2 className={styles.tituloSecao}>filmes mais assistidos</h2>
      </div>
      <div className={styles.gradeRanking}>
        {carregando
          ? Array.from({ length: 5 }).map((_, i) => <div key={i} className={styles.cardRankingEsq} />)
          : ranking.map(({ filmeId, total, detalhes }, i) => (
              <div
                key={filmeId}
                className={styles.cardRanking}
                onClick={() => router.push(`/filmes/${filmeId}`)}
              >
                <div className={styles.cardRankingPosterWrap}>
                  {detalhes?.poster_path ? (
                    <img src={getImageURL(detalhes.poster_path, "w342")} alt={detalhes.title} className={styles.cardRankingImg} />
                  ) : (
                    <div className={styles.cardRankingSemPoster} />
                  )}
                  <span className={styles.cardRankingTotal}>{total} logs</span>
                  <div className={styles.cardRankingOverlay}>
                    <span className={styles.cardRankingTitulo}>{detalhes?.title || "..."}</span>
                  </div>
                </div>
              </div>
            ))}
      </div>
    </section>
  );
}

// ─── Página principal ────────────────────────────────────────

export default function HomeLogin() {
  const [usuario, setUsuario] = useState(null);
  const [amigosIds, setAmigosIds] = useState([]);

  useEffect(() => {
    async function init() {
      const user = Parse.User.current();
      if (!user) return;
      await user.fetch();
      setUsuario(user);
      const ids = await buscarAmigosIds(user);
      setAmigosIds(ids);
    }
    init();
  }, []);

  return (
    <main className={styles.principal}>
      <div className={styles.conteudo}>

        {amigosIds.length > 0 && (
          <>
            <SecaoLogsAmigos amigosIds={amigosIds} />
            <div className={styles.divisor} />
          </>
        )}

        <SecaoFilmes ano={2026} />
        <div className={styles.divisor} />

        {amigosIds.length > 0 && (
          <>
            <SecaoReviewsAmigos amigosIds={amigosIds} />
            <div className={styles.divisor} />
          </>
        )}

        <SecaoFilmes ano={2025} />
        <div className={styles.divisor} />

        <SecaoRanking />

      </div>
    </main>
  );
}