"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Parse from "@/lib/parseClient";
import styles from "@/styles/pesquisa.module.css";
import pub from "@/styles/perfilPublico.module.css";
import { getFilme, getImageURL } from "@/lib/tmdb";

// ── Busca de filmes ──────────────────────────────────────

async function buscarFilmesPorTitulo(termo) {
  if (!termo.trim()) return [];
  const Filme = Parse.Object.extend("Filme");
  const query = new Parse.Query(Filme);
  query.matches("titulo", termo, "i");
  query.limit(20);
  const resultados = await query.find();
  return resultados.map((f) => ({
    objectId: f.id,
    tmdbId: f.get("tmdbId"),
    titulo: f.get("titulo"),
    ano: f.get("ano"),
    categorias: f.get("categorias") || [],
  }));
}

async function buscarFilmesPorTituloOriginal(termo) {
  if (!termo.trim()) return [];
  try {
    const url = `https://api.themoviedb.org/3/search/movie?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}&query=${encodeURIComponent(termo)}&language=pt-BR`;
    const res = await fetch(url);
    const data = await res.json();
    const tmdbIds = (data.results || []).slice(0, 20).map((m) => m.id);
    if (tmdbIds.length === 0) return [];
    const Filme = Parse.Object.extend("Filme");
    const query = new Parse.Query(Filme);
    query.containedIn("tmdbId", tmdbIds);
    query.limit(20);
    const resultados = await query.find();
    return resultados.map((f) => ({
      objectId: f.id,
      tmdbId: f.get("tmdbId"),
      titulo: f.get("titulo"),
      ano: f.get("ano"),
      categorias: f.get("categorias") || [],
    }));
  } catch { return []; }
}

async function buscarFilmes(termo) {
  const [porTitulo, porOriginal] = await Promise.allSettled([
    buscarFilmesPorTitulo(termo),
    buscarFilmesPorTituloOriginal(termo),
  ]);
  const lista1 = porTitulo.status === "fulfilled" ? porTitulo.value : [];
  const lista2 = porOriginal.status === "fulfilled" ? porOriginal.value : [];
  const vistos = new Set();
  const merged = [];
  for (const f of [...lista1, ...lista2]) {
    if (!vistos.has(f.objectId)) { vistos.add(f.objectId); merged.push(f); }
  }
  return merged;
}

// ── Busca de usuários ────────────────────────────────────

async function buscarUsuarios(termo) {
  if (!termo.trim()) return [];
  try {
    return await Parse.Cloud.run("buscarUsuariosPorTermo", { termo });
  } catch { return []; }
}

// ── Componentes ──────────────────────────────────────────

function CardFilme({ filme, detalhes }) {
  const router = useRouter();
  return (
    <div className={styles.card} onClick={() => router.push(`/filmes/${filme.tmdbId}`)}>
      <div className={styles.cardPoster}>
        {detalhes?.poster_path ? (
          <img src={getImageURL(detalhes.poster_path, "w342")} alt={filme.titulo} className={styles.cardImg} />
        ) : (
          <div className={styles.cardSemPoster} />
        )}
      </div>
      <div className={styles.cardInfo}>
        <p className={styles.cardTitulo}>{filme.titulo}</p>
        <span className={styles.cardAno}>{detalhes?.release_date?.slice(0, 4) || filme.ano}</span>
        {filme.categorias?.length > 0 && (
          <div className={styles.cardCategorias}>
            {filme.categorias.slice(0, 2).map((c, i) => (
              <span key={i} className={styles.cardTag}>{c}</span>
            ))}
            {filme.categorias.length > 2 && (
              <span className={styles.cardTagMais}>+{filme.categorias.length - 2}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function CardUsuario({ usuario, usuarioLogado }) {
  const router = useRouter();
  const [seguindo, setSeguindo] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const ehEuMesmo = usuarioLogado?.id === usuario.objectId;

  useEffect(() => {
    if (!usuarioLogado || ehEuMesmo) return;
    async function verificar() {
      const u = new Parse.User(); u.id = usuario.objectId;
      const qFollow = new Parse.Query("Follow");
      qFollow.equalTo("seguidor", usuarioLogado);
      qFollow.equalTo("seguindo", u);
      const existe = await qFollow.first();
      setSeguindo(!!existe);
    }
    verificar();
  }, [usuario.objectId, usuarioLogado]);

  async function handleToggleFollow() {
    if (!usuarioLogado || salvando) return;
    setSalvando(true);
    const alvoPtr = new Parse.User(); alvoPtr.id = usuario.objectId;
    try {
      if (seguindo) {
        const qFollow = new Parse.Query("Follow");
        qFollow.equalTo("seguidor", usuarioLogado);
        qFollow.equalTo("seguindo", alvoPtr);
        const existe = await qFollow.first();
        if (existe) await existe.destroy();
        setSeguindo(false);
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
      }
    } catch (e) { console.error(e); }
    finally { setSalvando(false); }
  }

  return (
    <div className={pub.cardUsuario}>
      <div
        className={pub.cardUsuarioInfo}
        onClick={() => ehEuMesmo ? router.push("/perfil") : router.push(`/perfil/${usuario.username}`)}
      >
        <div className={pub.cardUsuarioAvatar}>
          {usuario.foto ? (
            <img src={usuario.foto} alt={usuario.nome} className={pub.cardUsuarioFoto} />
          ) : (
            <div className={pub.cardUsuarioAvatarPlaceholder}>
              {(usuario.nome || usuario.username || "?")[0].toUpperCase()}
            </div>
          )}
        </div>
        <div className={pub.cardUsuarioTexto}>
          <span className={pub.cardUsuarioNome}>{usuario.nome || usuario.username}</span>
          {usuario.username && usuario.nome && (
            <span className={pub.cardUsuarioUsername}>@{usuario.username}</span>
          )}
          {usuario.bio && <span className={pub.cardUsuarioBio}>{usuario.bio}</span>}
        </div>
      </div>
      {usuarioLogado && !ehEuMesmo && (
        <button
          className={seguindo ? pub.btnSeguindo : pub.btnSeguir}
          onClick={handleToggleFollow}
          disabled={salvando}
        >
          {salvando ? "..." : seguindo ? "seguindo" : "seguir"}
        </button>
      )}
    </div>
  );
}

function ResultadosBusca({ termo, usuarioLogado }) {
  const [filmes, setFilmes] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [detalhes, setDetalhes] = useState({});
  const [buscando, setBuscando] = useState(false);

  useEffect(() => {
    if (!termo) return;
    setBuscando(true);
    setFilmes([]);
    setUsuarios([]);
    setDetalhes({});

    Promise.allSettled([buscarFilmes(termo), buscarUsuarios(termo)])
      .then(async ([resFilmes, resUsuarios]) => {
        const filmesList = resFilmes.status === "fulfilled" ? resFilmes.value : [];
        const usuariosList = resUsuarios.status === "fulfilled" ? resUsuarios.value : [];
        setFilmes(filmesList);
        setUsuarios(usuariosList);

        const detalhesMap = {};
        await Promise.allSettled(
          filmesList.map(async (f) => {
            try {
              const d = await getFilme(f.tmdbId);
              detalhesMap[f.tmdbId] = d;
            } catch {}
          })
        );
        setDetalhes(detalhesMap);
      })
      .finally(() => setBuscando(false));
  }, [termo]);

  if (!termo) return null;

  const total = filmes.length + usuarios.length;

  return (
    <div className={styles.resultados}>
      <div className={styles.resultadosHeader}>
        <h2 className={styles.resultadosTitulo}>
          {buscando ? "buscando..." : `${total} resultado${total !== 1 ? "s" : ""} para`}
        </h2>
        {!buscando && <span className={styles.resultadosTermo}>"{termo}"</span>}
      </div>

      {!buscando && total === 0 && (
        <div className={styles.vazio}>
          <p>Nenhum resultado encontrado.</p>
          <span>Tente buscar por outro nome.</span>
        </div>
      )}

      {/* Seção de pessoas */}
      {!buscando && usuarios.length > 0 && (
        <div className={styles.secao}>
          <h3 className={styles.secaoTitulo}>pessoas</h3>
          <div className={styles.listaPessoas}>
            {usuarios.map((u) => (
              <CardUsuario key={u.objectId} usuario={u} usuarioLogado={usuarioLogado} />
            ))}
          </div>
        </div>
      )}

      {/* Seção de filmes */}
      {!buscando && filmes.length > 0 && (
        <div className={styles.secao}>
          <h3 className={styles.secaoTitulo}>filmes</h3>
          <div className={styles.grade}>
            {filmes.map((f) => (
              <CardFilme key={f.objectId} filme={f} detalhes={detalhes[f.tmdbId]} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PaginaPesquisaInterna() {
  const searchParams = useSearchParams();
  const termo = searchParams.get("q") || "";
  const [usuarioLogado, setUsuarioLogado] = useState(null);

  useEffect(() => {
    const user = Parse.User.current();
    if (user) user.fetch().then(setUsuarioLogado).catch(console.error);
  }, []);

  return (
    <main className={styles.principal}>
      <div className={styles.conteudo}>
        <ResultadosBusca termo={termo} usuarioLogado={usuarioLogado} />
      </div>
    </main>
  );
}

export default function PaginaPesquisa() {
  return (
    <Suspense>
      <PaginaPesquisaInterna />
    </Suspense>
  );
}