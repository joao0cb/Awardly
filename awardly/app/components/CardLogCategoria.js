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

async function buscarFotoPessoa(nome) {
  if (!nome) return null;
  try {
    const res = await fetch(
      `https://api.themoviedb.org/3/search/person?api_key=${TMDB_KEY}&query=${encodeURIComponent(nome)}&language=pt-BR`
    );
    const data = await res.json();
    const person = data.results?.[0];
    if (person?.profile_path) return `${TMDB_IMAGE}/w185${person.profile_path}`;
    return null;
  } catch { return null; }
}

async function buscarPosterFilme(titulo) {
  if (!titulo) return null;
  try {
    const res = await fetch(
      `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_KEY}&query=${encodeURIComponent(titulo)}&language=pt-BR`
    );
    const data = await res.json();
    const filme = data.results?.[0];
    if (filme?.poster_path) return `${TMDB_IMAGE}/w185${filme.poster_path}`;
    return null;
  } catch { return null; }
}

async function buscarFoto(nome, ehPessoa) {
  return ehPessoa ? buscarFotoPessoa(nome) : buscarPosterFilme(nome);
}

function MiniCard({ nome, label, ehPessoa, highlighted }) {
  const [foto, setFoto] = useState(null);

  useEffect(() => {
    if (!nome) return;
    buscarFoto(nome, ehPessoa).then(setFoto).catch(console.error);
  }, [nome, ehPessoa]);

  return (
    <div className={`${styles.miniCard} ${highlighted ? styles.miniCardHighlight : ""}`}>
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
  const router = useRouter();
  const isPessoa = ehCategoriaPessoa(log.categoria);

  // Só mostra miniCards se tiver pelo menos um campo
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
            <MiniCard
              nome={log.vencedorReal}
              label="venceu"
              ehPessoa={isPessoa}
            />
          )}
          {log.deveriaTerGanhado && log.deveriaTerGanhado !== log.vencedorReal && (
            <MiniCard
              nome={log.deveriaTerGanhado}
              label="deveria ter ganhado"
              ehPessoa={isPessoa}
              highlighted
            />
          )}
          {log.queriaQueGanhasse &&
            log.queriaQueGanhasse !== log.deveriaTerGanhado &&
            log.queriaQueGanhasse !== log.vencedorReal && (
            <MiniCard
              nome={log.queriaQueGanhasse}
              label="queria que ganhasse"
              ehPessoa={isPessoa}
              highlighted
            />
          )}
        </div>
      )}

      {/* Se deveria = queria, mostra só uma vez mas com label diferente */}
      {log.deveriaTerGanhado && log.deveriaTerGanhado === log.queriaQueGanhasse && (
        <p className={styles.cardLogCatConcorda}>
          ✓ Concordou com sua escolha
        </p>
      )}

      {log.review && (
        <p className={styles.cardLogCatReview}>{log.review}</p>
      )}

      <span className={styles.cardLogCatData}>{log.data}</span>
    </div>
  );
}