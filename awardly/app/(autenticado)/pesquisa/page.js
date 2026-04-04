"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Parse from "@/lib/parseClient";
import NavbarLogin from "../../components/NavbarLogin";
import styles from "@/styles/pesquisa.module.css";
import { getFilme, getImageURL } from "@/lib/tmdb";

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
  } catch {
    return [];
  }
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
    if (!vistos.has(f.objectId)) {
      vistos.add(f.objectId);
      merged.push(f);
    }
  }
  return merged;
}

function CardFilme({ filme, detalhes }) {
  const router = useRouter();
  return (
    <div
      className={styles.card}
      onClick={() => router.push(`/filmes/${filme.tmdbId}`)}
    >
      <div className={styles.cardPoster}>
        {detalhes?.poster_path ? (
          <img
            src={getImageURL(detalhes.poster_path, "w342")}
            alt={filme.titulo}
            className={styles.cardImg}
          />
        ) : (
          <div className={styles.cardSemPoster} />
        )}
      </div>
      <div className={styles.cardInfo}>
        <p className={styles.cardTitulo}>{filme.titulo}</p>
        <span className={styles.cardAno}>{filme.ano}</span>
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

function ResultadosBusca({ termo, usuario }) {
  const [filmes, setFilmes] = useState([]);
  const [detalhes, setDetalhes] = useState({});
  const [buscando, setBuscando] = useState(false);

  useEffect(() => {
    if (!termo) return;
    setBuscando(true);
    setFilmes([]);
    setDetalhes({});

    buscarFilmes(termo)
      .then(async (resultados) => {
        setFilmes(resultados);
        const detalhesMap = {};
        await Promise.allSettled(
          resultados.map(async (f) => {
            try {
              const d = await getFilme(f.tmdbId);
              detalhesMap[f.tmdbId] = d;
            } catch {}
          })
        );
        setDetalhes(detalhesMap);
      })
      .catch(console.error)
      .finally(() => setBuscando(false));
  }, [termo]);

  if (!termo) return null;

  return (
    <div className={styles.resultados}>
      <div className={styles.resultadosHeader}>
        <h2 className={styles.resultadosTitulo}>
          {buscando ? "buscando..." : `${filmes.length} resultado${filmes.length !== 1 ? "s" : ""} para`}
        </h2>
        {!buscando && <span className={styles.resultadosTermo}>"{termo}"</span>}
      </div>

      {!buscando && filmes.length === 0 && (
        <div className={styles.vazio}>
          <p>Nenhum filme encontrado.</p>
          <span>Tente buscar por outro título.</span>
        </div>
      )}

      <div className={styles.grade}>
        {filmes.map((f) => (
          <CardFilme key={f.objectId} filme={f} detalhes={detalhes[f.tmdbId]} />
        ))}
      </div>
    </div>
  );
}

function PaginaPesquisaInterna() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const termo = searchParams.get("q") || "";
  const [usuario, setUsuario] = useState(null);

  useEffect(() => {
    const user = Parse.User.current();
    if (user) {
      user.fetch().then(setUsuario).catch(console.error);
    }
  }, []);

  const nome = usuario?.get("nome") || usuario?.get("username") || "";
  const foto = usuario?.get("foto")?.url() || null;

  return (
    <main className={styles.principal}>
      <NavbarLogin usuario={{ nome, foto }} />
      <div className={styles.conteudo}>
        <ResultadosBusca termo={termo} usuario={usuario} />
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