"use client";
import { useEffect, useState } from "react";
import Parse from "@/lib/parseClient";
import { getFilme, getImageURL } from "@/lib/tmdb";
import { useRouter } from "next/navigation";
import styles from "@/styles/homeLogin.module.css";
import RevealSection from "@/app/components/RevealSection";

const TMDB_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;
const TMDB_IMAGE = process.env.NEXT_PUBLIC_TMDB_IMAGE_BASE;

// ─── Helpers ────────────────────────────────────────────────

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
  const [seguindo, seguidores] = await Promise.all([qSeguindo.find(), qSeguidores.find()]);
  const ids = new Set();
  seguindo.forEach((f) => { const id = f.get("seguindo")?.id; if (id) ids.add(id); });
  seguidores.forEach((f) => { const id = f.get("seguidor")?.id; if (id) ids.add(id); });
  return [...ids];
}

async function buscarFotoPessoa(nome) {
  if (!nome) return null;
  try {
    const res = await fetch(`https://api.themoviedb.org/3/search/person?api_key=${TMDB_KEY}&query=${encodeURIComponent(nome)}&language=pt-BR`);
    const data = await res.json();
    const p = data.results?.[0];
    return p?.profile_path ? `${TMDB_IMAGE}/w185${p.profile_path}` : null;
  } catch { return null; }
}

async function buscarPosterFilmePorTitulo(titulo) {
  if (!titulo) return null;
  try {
    const res = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${TMDB_KEY}&query=${encodeURIComponent(titulo)}&language=pt-BR`);
    const data = await res.json();
    const f = data.results?.[0];
    return f?.poster_path ? `${TMDB_IMAGE}/w185${f.poster_path}` : null;
  } catch { return null; }
}

const CATEGORIAS_PESSOA = ["Melhor Ator", "Melhor Atriz", "Melhor Ator Coadjuvante", "Melhor Atriz Coadjuvante", "Melhor Diretor"];
function ehCategoriaPessoa(cat) { return CATEGORIAS_PESSOA.some((c) => cat?.includes(c)); }

// ─── Seção filmes indicados ──────────────────────────────────

function CardFilme({ tmdbId, titulo, vencedor, indice }) {
  const router = useRouter();
  const [detalhes, setDetalhes] = useState(null);
  useEffect(() => { getFilme(tmdbId).then(setDetalhes).catch(console.error); }, [tmdbId]);

  if (!detalhes) return (
    <div className={styles.cardFilme} style={{ animationDelay: `${indice * 0.06}s` }}>
      <div className={styles.esqueleto} />
    </div>
  );

  return (
    <div
      className={`${styles.cardFilme} ${vencedor ? styles.cardFilmeVencedor : ""}`}
      style={{ animationDelay: `${indice * 0.06}s` }}
      onClick={() => router.push(`/filmes/${tmdbId}`)}
    >
      {detalhes.poster_path ? (
        <img src={getImageURL(detalhes.poster_path, "w500")} alt={detalhes.title || titulo} className={styles.posterFilme} loading={indice < 5 ? "eager" : "lazy"} />
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

function SecaoFilmes({ ano }) {
  const [indicados, setIndicados] = useState([]);
  const [carregando, setCarregando] = useState(true);
  useEffect(() => {
    buscarIndicados(ano).then(setIndicados).catch(console.error).finally(() => setCarregando(false));
  }, [ano]);

  return (
    <section className={styles.secao}>
      <div className={styles.cabecalhoSecao}>
        <p className={styles.anoSecao}>oscar {ano}</p>
        <h2 className={styles.tituloSecao}>indicados a melhor filme</h2>
      </div>
      <div className={styles.gradeFilmes}>
        {carregando
          ? Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className={styles.cardFilme}><div className={styles.esqueleto} /></div>
            ))
          : indicados.map((f, i) => (
              <CardFilme key={f.objectId} tmdbId={f.tmdbId} titulo={f.titulo} vencedor={f.vencedor} indice={i} />
            ))}
      </div>
    </section>
  );
}

// ─── Logs de amigos ──────────────────────────────────────────

function CardLogAmigo({ log }) {
  const router = useRouter();
  const [detalhes, setDetalhes] = useState(null);
  useEffect(() => { getFilme(log.filmeId).then(setDetalhes).catch(console.error); }, [log.filmeId]);
 
  return (
    <div className={styles.cardLogAmigo} onClick={() => router.push(`/filmes/${log.filmeId}`)}>
      <div className={styles.cardLogPoster}>
        {detalhes?.poster_path ? (
          <img
            src={getImageURL(detalhes.poster_path, "w342")}  // ← era w185
            alt={detalhes.title}
            className={styles.cardLogImg}
          />
        ) : (
          <div className={styles.cardLogSemPoster} />
        )}
        {log.like && <img src="/envelopecoracao.png" className={styles.cardLogLike} alt="" />}
        <div className={styles.cardLogOverlay}>
          <span className={styles.cardLogFilme}>{detalhes?.title || "..."}</span>
          <span className={styles.cardLogData}>{log.data}</span>
        </div>
      </div>
      <div className={styles.cardLogRodape}>
        <div className={styles.cardLogAmigoInfo}>
          {log.fotoAmigo ? (
            <img
              src={log.fotoAmigo}
              className={styles.cardLogAvatarMini}
              alt=""
              onError={(e) => { e.target.style.display = "none"; }}
            />
          ) : (
            <div className={styles.cardLogAvatarPlaceholder}>
              {(log.nomeAmigo || "?")[0].toUpperCase()}
            </div>
          )}
          <span className={styles.cardLogAmigoNome}>{log.nomeAmigo}</span>
        </div>
        {log.estatuetas > 0 && (
          <div className={styles.cardLogNotaRodape}>
            <img src="/oscar2.png" className={styles.cardLogOscarMini} alt="" />
            <span>{log.estatuetas}</span>
          </div>
        )}
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
        const resultado = await Parse.Cloud.run("buscarLogsAmigos", {
          amigosIds,
          limite: 5,
        });
        resultado.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setLogs(resultado.map((l) => ({
          ...l,
          data: tempoRelativo(new Date(l.createdAt)),
        })));
      } catch (e) { console.error(e); }
      finally { setCarregando(false); }
    }
    carregar();
  }, [amigosIds.join(",")]);

  if (!carregando && logs.length === 0) return null;

  return (
    <section className={styles.secao}>
      <div className={styles.cabecalhoSecao}>
        <p className={styles.anoSecao}>&nbsp;</p>
        <h2 className={styles.tituloSecao}>logs de amigos</h2>
      </div>
      <div className={styles.gradeLogsAmigos}>
        {carregando
          ? Array.from({ length: 5 }).map((_, i) => <div key={i} className={styles.cardLogEsq} />)
          : logs.map((log) => <CardLogAmigo key={log.id} log={log} />)}
      </div>
    </section>
  );
}

// ─── Reviews de amigos ───────────────────────────────────────

function CardReviewAmigo({ review }) {
  const router = useRouter();
  const [detalhes, setDetalhes] = useState(null);
  useEffect(() => { getFilme(review.filmeId).then(setDetalhes).catch(console.error); }, [review.filmeId]);

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
          <div className={styles.cardReviewAmigoInfo}>
            {review.fotoAmigo ? (
              <img src={review.fotoAmigo} className={styles.cardLogAvatarMini} alt="" onError={(e) => { e.target.style.display = "none"; }} />
            ) : (
              <div className={styles.cardLogAvatarPlaceholder}>{(review.nomeAmigo || "?")[0].toUpperCase()}</div>
            )}
            <span className={styles.cardReviewAmigo2}>{review.nomeAmigo}</span>
          </div>
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
        const resultado = await Parse.Cloud.run("buscarReviewsAmigos", {
          amigosIds,
          limite: 4,
        });
        resultado.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setReviews(resultado.map((l) => ({
          ...l,
          data: tempoRelativo(new Date(l.createdAt)),
        })));
      } catch (e) { console.error(e); }
      finally { setCarregando(false); }
    }
    carregar();
  }, [amigosIds.join(",")]);

  if (!carregando && reviews.length === 0) return null;

  return (
    <section className={styles.secao}>
      <div className={styles.cabecalhoSecao}>
        <p className={styles.anoSecao}>&nbsp;</p>
        <h2 className={styles.tituloSecao}>últimas reviews de amigos</h2>
      </div>
      <div className={styles.listaReviewsAmigos}>
        {carregando
          ? Array.from({ length: 3 }).map((_, i) => <div key={i} className={styles.cardReviewEsq} />)
          : reviews.map((r) => <CardReviewAmigo key={r.id} review={r} />)}
      </div>
    </section>
  );
}

// ─── Logs de categoria de amigos ─────────────────────────────

function MiniCardCategoria({ nome, ehPessoa }) {
  const [foto, setFoto] = useState(null);
  useEffect(() => {
    if (!nome) return;
    if (ehPessoa) {
      buscarFotoPessoa(nome).then(setFoto).catch(console.error);
    } else {
      buscarPosterFilmePorTitulo(nome).then(setFoto).catch(console.error);
    }
  }, [nome, ehPessoa]);

  return foto ? (
    <img src={foto} alt={nome} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: ehPessoa ? "center 15%" : "center", display: "block" }} />
  ) : (
    <div className={styles.miniCatPlaceholder}>{(nome || "?")[0].toUpperCase()}</div>
  );
}

function CardLogCategoriaAmigo({ log }) {
  const router = useRouter();
  const isPessoa = ehCategoriaPessoa(log.categoria);
  const temFotos = log.vencedorReal || log.deveriaTerGanhado || log.queriaQueGanhasse;

  return (
    <div className={styles.cardLogCatAmigo}>
      <div className={styles.cardLogCatAmigoHeader}>
        <span className={styles.cardLogCatAmigoCategoria}>{log.categoria}</span>
        <span className={styles.cardLogCatAmigoAno}>{log.ano}</span>
      </div>

      {temFotos && (
        <div className={styles.cardLogCatAmigoFotos}>
          {log.vencedorReal && (
            <div className={styles.miniCatCard}>
              <div className={styles.miniCatImg} style={{ aspectRatio: isPessoa ? "1/1" : "2/3" }}>
                <MiniCardCategoria nome={log.vencedorReal} ehPessoa={isPessoa} />
              </div>
              <span style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.3)', marginTop: 2, fontFamily: 'Poppins, sans-serif' }}>venceu</span>
              <span className={styles.miniCatNome}>{log.vencedorReal}</span>
            </div>
          )}
          {log.deveriaTerGanhado && (
            <div className={styles.miniCatCard}>
              <div className={styles.miniCatImg} style={{ aspectRatio: isPessoa ? "1/1" : "2/3" }}>
                <MiniCardCategoria nome={log.deveriaTerGanhado} ehPessoa={isPessoa} />
              </div>
              <span style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.3)', marginTop: 2,  fontFamily: 'Poppins, sans-serif'}}>deveria ter ganhado</span>
              <span className={styles.miniCatNome}>{log.deveriaTerGanhado}</span>
            </div>
          )}
          {log.queriaQueGanhasse && (
            <div className={styles.miniCatCard}>
              <div className={styles.miniCatImg} style={{ aspectRatio: isPessoa ? "1/1" : "2/3" }}>
                <MiniCardCategoria nome={log.queriaQueGanhasse} ehPessoa={isPessoa} />
              </div>
              <span style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.3)', marginTop: 2, fontFamily: 'Poppins, sans-serif' }}>queria que ganhasse</span>
              <span className={styles.miniCatNome}>{log.queriaQueGanhasse}</span>
            </div>
          )}
        </div>
      )}

      {log.review && <p className={styles.cardLogCatAmigoReview}>{log.review}</p>}

      <div className={styles.cardLogCatAmigoRodape}>
        <div className={styles.cardLogCatAmigoAutor}>
          {log.fotoAmigo ? (
            <img src={log.fotoAmigo} className={styles.cardLogAvatarMini} alt="" onError={(e) => { e.target.style.display = "none"; }} />
          ) : (
            <div className={styles.cardLogAvatarPlaceholder}>{(log.nomeAmigo || "?")[0].toUpperCase()}</div>
          )}
          <span
            className={styles.cardLogCatAmigoNome}
            onClick={() => log.usernameAmigo && router.push(`/perfil/${log.usernameAmigo}`)}
            style={{ cursor: log.usernameAmigo ? "pointer" : "default" }}
          >
            {log.nomeAmigo}
          </span>
        </div>
      </div>
    </div>
  );
}

function SecaoLogsCategoriaAmigos({ amigosIds }) {
  const [logs, setLogs] = useState([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    if (amigosIds.length === 0) { setCarregando(false); return; }
    async function carregar() {
      try {
        const resultado = await Parse.Cloud.run("buscarLogsCategoriaAmigos", { amigosIds, limite: 2 });
        setLogs(resultado);
      } catch (e) { console.error(e); }
      finally { setCarregando(false); }
    }
    carregar();
  }, [amigosIds.join(",")]);

  if (!carregando && logs.length === 0) return null;

  return (
    <section className={styles.secao}>
      <div className={styles.cabecalhoSecao}>
        <p className={styles.anoSecao}>&nbsp;</p>
        <h2 className={styles.tituloSecao}>logs de categorias de amigos</h2>
      </div>
      <div className={styles.listaLogsCatAmigos}>
        {carregando
          ? Array.from({ length: 2 }).map((_, i) => <div key={i} className={styles.cardReviewEsq} />)
          : logs.map((l) => <CardLogCategoriaAmigo key={l.id} log={l} />)}
      </div>
    </section>
  );
}

// ─── Ranking ────────────────────────────────────────────────

function SecaoRanking() {
  const [ranking, setRanking] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function carregar() {
      try {
        const q = new Parse.Query("Log");
        q.descending("createdAt");
        q.limit(200);
        const logs = await q.find();
        const contagem = {};
        logs.forEach((l) => { const id = l.get("filmeId"); contagem[id] = (contagem[id] || 0) + 1; });
        const top5 = Object.entries(contagem).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([filmeId, total]) => ({ filmeId: Number(filmeId), total }));
        const comDetalhes = await Promise.allSettled(top5.map(async ({ filmeId, total }) => {
          const d = await getFilme(filmeId);
          return { filmeId, total, detalhes: d };
        }));
        setRanking(comDetalhes.filter((r) => r.status === "fulfilled").map((r) => r.value));
      } catch (e) { console.error(e); }
      finally { setCarregando(false); }
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
          : ranking.map(({ filmeId, total, detalhes }) => (
              <div key={filmeId} className={styles.cardRanking} onClick={() => router.push(`/filmes/${filmeId}`)}>
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
  const [amigosIds, setAmigosIds] = useState([]);

  useEffect(() => {
    async function init() {
      const user = Parse.User.current();
      if (!user) return;
      await user.fetch();
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
            <RevealSection delay={0}>
              <SecaoLogsAmigos amigosIds={amigosIds} />
            </RevealSection>
            <div className={styles.divisor} />
          </>
        )}

        <RevealSection delay={0}>
          <SecaoFilmes ano={2026} />
        </RevealSection>
        <div className={styles.divisor} />

        {amigosIds.length > 0 && (
          <>
            <RevealSection delay={0}>
              <SecaoReviewsAmigos amigosIds={amigosIds} />
            </RevealSection>
            <div className={styles.divisor} />

            <RevealSection delay={0}>
              <SecaoLogsCategoriaAmigos amigosIds={amigosIds} />
            </RevealSection>
            <div className={styles.divisor} />
          </>
        )}

        <RevealSection delay={0}>
          <SecaoFilmes ano={2025} />
        </RevealSection>
        <div className={styles.divisor} />

        <RevealSection delay={0}>
          <SecaoRanking />
        </RevealSection>

      </div>
    </main>
  );
}