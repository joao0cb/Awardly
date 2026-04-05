"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "@/styles/perfil.module.css";

const TMDB_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;
const TMDB_IMAGE = process.env.NEXT_PUBLIC_TMDB_IMAGE_BASE;

const CATEGORIAS_PESSOA = [
  "Melhor Ator", "Melhor Atriz",
  "Melhor Ator Coadjuvante", "Melhor Atriz Coadjuvante",
  "Melhor Diretor",
];

function ehCategoriaPessoa(categoria) {
  return CATEGORIAS_PESSOA.some((c) => categoria?.includes(c));
}

// Busca foto + tmdbId da pessoa
async function buscarDadosPessoa(nome) {
  if (!nome) return { foto: null, tmdbId: null };
  try {
    const res = await fetch(
      `https://api.themoviedb.org/3/search/person?api_key=${TMDB_KEY}&query=${encodeURIComponent(nome)}&language=pt-BR`
    );
    const data = await res.json();
    const person = data.results?.[0];
    return {
      foto: person?.profile_path ? `${TMDB_IMAGE}/w185${person.profile_path}` : null,
      tmdbId: person?.id || null,
    };
  } catch { return { foto: null, tmdbId: null }; }
}

// Busca poster de filme
async function buscarPosterFilme(titulo) {
  if (!titulo) return { foto: null, tmdbId: null };
  try {
    const res = await fetch(
      `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_KEY}&query=${encodeURIComponent(titulo)}&language=pt-BR`
    );
    const data = await res.json();
    const filme = data.results?.[0];
    return {
      foto: filme?.poster_path ? `${TMDB_IMAGE}/w185${filme.poster_path}` : null,
      tmdbId: filme?.id || null,
    };
  } catch { return { foto: null, tmdbId: null }; }
}

function MiniCard({ nome, label, ehPessoa, highlighted }) {
  const router = useRouter();
  const [foto, setFoto] = useState(null);
  const [tmdbId, setTmdbId] = useState(null);

  useEffect(() => {
    if (!nome) return;
    if (ehPessoa) {
      buscarDadosPessoa(nome).then(({ foto, tmdbId }) => {
        setFoto(foto);
        setTmdbId(tmdbId);
      });
    } else {
      buscarPosterFilme(nome).then(({ foto, tmdbId }) => {
        setFoto(foto);
        setTmdbId(tmdbId);
      });
    }
  }, [nome, ehPessoa]);

  function handleClick() {
    if (!tmdbId) return;
    if (ehPessoa) {
      router.push(`/atores/${tmdbId}`);
    } else {
      router.push(`/filmes/${tmdbId}`);
    }
  }

  return (
    <div
      className={`${styles.miniCard} ${highlighted ? styles.miniCardHighlight : ""} ${tmdbId ? styles.miniCardClicavel : ""}`}
      onClick={handleClick}
      style={{ cursor: tmdbId ? "pointer" : "default" }}
    >
      <div className={styles.miniCardImg} style={{ aspectRatio: ehPessoa ? "1/1" : "2/3" }}>
        {foto ? (
          <img
            src={foto}
            alt={nome}
            style={{
              width: "100%", height: "100%",
              objectFit: "cover",
              objectPosition: ehPessoa ? "center 15%" : "center",
            }}
          />
        ) : (
          <div className={styles.miniCardPlaceholder}>
            {(nome || "?")[0].toUpperCase()}
          </div>
        )}
      </div>
      <div className={styles.miniCardInfo}>
        <span className={styles.miniCardLabel}>{label}</span>
        <span className={styles.miniCardNome}>{nome}</span>
      </div>
    </div>
  );
}

export default function CardLogCategoria({ log }) {
  const isPessoa = ehCategoriaPessoa(log.categoria);
  const temFotos = log.vencedorReal || log.deveriaTerGanhado || log.queriaQueGanhasse;

  return (
    <div className={styles.cardLogCategoria}>
      <div className={styles.cardLogCatHeader}>
        <span className={styles.cardLogCatCategoria}>{log.categoria}</span>
        <span className={styles.cardLogCatAno}>{log.ano}</span>
      </div>

      {temFotos && (
        <div className={styles.cardLogCatFotos}>
          {log.vencedorReal && (
            <MiniCard nome={log.vencedorReal} label="venceu" ehPessoa={isPessoa} />
          )}
          {log.deveriaTerGanhado && (
            <MiniCard nome={log.deveriaTerGanhado} label="deveria ter ganhado" ehPessoa={isPessoa} highlighted />
          )}
          {log.queriaQueGanhasse && (
            <MiniCard nome={log.queriaQueGanhasse} label="queria que ganhasse" ehPessoa={isPessoa} highlighted />
          )}
        </div>
      )}

      {log.review && (
        <p className={styles.cardLogCatReview}>{log.review}</p>
      )}

      <span className={styles.cardLogCatData}>{log.data}</span>
    </div>
  );
}