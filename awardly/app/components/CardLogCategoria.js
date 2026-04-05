"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import styles from "@/styles/perfil.module.css";
import LogCategoriaModal from "@/app/components/LogCategoriaModal";
import Parse from "@/lib/parseClient";

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
      buscarDadosPessoa(nome).then(({ foto, tmdbId }) => { setFoto(foto); setTmdbId(tmdbId); });
    } else {
      buscarPosterFilme(nome).then(({ foto, tmdbId }) => { setFoto(foto); setTmdbId(tmdbId); });
    }
  }, [nome, ehPessoa]);

  function handleClick() {
    if (!tmdbId) return;
    router.push(ehPessoa ? `/atores/${tmdbId}` : `/filmes/${tmdbId}`);
  }

  return (
    <div
      className={`${styles.miniCard} ${highlighted ? styles.miniCardHighlight : ""} ${tmdbId ? styles.miniCardClicavel : ""}`}
      onClick={handleClick}
      style={{ cursor: tmdbId ? "pointer" : "default" }}
    >
      <div className={styles.miniCardImg} style={{ aspectRatio: ehPessoa ? "1/1" : "2/3" }}>
        {foto ? (
          <img src={foto} alt={nome} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: ehPessoa ? "center 15%" : "center" }} />
        ) : (
          <div className={styles.miniCardPlaceholder}>{(nome || "?")[0].toUpperCase()}</div>
        )}
      </div>
      <div className={styles.miniCardInfo}>
        <span className={styles.miniCardLabel}>{label}</span>
        <span className={styles.miniCardNome}>{nome}</span>
      </div>
    </div>
  );
}

export default function CardLogCategoria({ log, onAtualizado }) {
  const isPessoa = ehCategoriaPessoa(log.categoria);
  const temFotos = log.vencedorReal || log.deveriaTerGanhado || log.queriaQueGanhasse;
  const [modalAberto, setModalAberto] = useState(false);
  const [filmesCategoria, setFilmesCategoria] = useState([]);
  const [carregandoFilmes, setCarregandoFilmes] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Garante que o portal só renderiza no client
  useEffect(() => { setMounted(true); }, []);

  // Trava scroll do body quando modal está aberto
  useEffect(() => {
    if (modalAberto) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [modalAberto]);

  async function handleAbrirEditar(e) {
    e.stopPropagation();
    if (modalAberto) return; // bloqueia abrir duplicado
    setCarregandoFilmes(true);
    try {
      const query = new Parse.Query("Filme");
      query.containedIn("categorias", [log.categoria]);
      query.equalTo("ano", log.ano);
      query.limit(50);
      const resultados = await query.find();
      setFilmesCategoria(resultados.map((f) => ({
        tmdbId: f.get("tmdbId"),
        titulo: f.get("titulo"),
        ano: f.get("ano"),
        poster: null,
        categorias: f.get("categorias") || [],
        vencedores: f.get("vencedores") || [],
        atoresIndicados: f.get("atoresIndicados") || {},
        diretor: f.get("diretor"),
        roteiristas: f.get("roteiristas"),
        cancao: f.get("cancao") || {},
        _venceuItem: (f.get("vencedores") || []).some(v => v === log.categoria || v.startsWith(log.categoria + '::')),
        _itemForcado: null,
      })));
    } catch (e) {
      console.error(e);
    } finally {
      setCarregandoFilmes(false);
      setModalAberto(true);
    }
  }

  function handleFechar(resultado) {
    setModalAberto(false);
    if (resultado === '__salvo__' || resultado === '__deletado__') onAtualizado?.();
  }

  return (
    <>
      <div className={styles.cardLogCategoria}>
        <div className={styles.cardLogCatHeader}>
          <span className={styles.cardLogCatCategoria}>{log.categoria}</span>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span className={styles.cardLogCatAno}>{log.ano}</span>
            <button
              className={styles.btnLapisCategoria}
              onClick={handleAbrirEditar}
              title="Editar avaliação"
              disabled={carregandoFilmes}
            >
              {carregandoFilmes ? (
                <span style={{ fontSize: 12, color: "rgba(201,168,76,0.6)" }}>...</span>
              ) : (
                <img src="/lapis.png" alt="editar" style={{ width: 14, height: 14, objectFit: "contain", opacity: 0.7 }} />
              )}
            </button>
          </div>
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

        {log.review && <p className={styles.cardLogCatReview}>{log.review}</p>}
        <span className={styles.cardLogCatData}>{log.data}</span>
      </div>

      {/* Portal — renderiza o modal direto no body, fora de qualquer contexto de posicionamento */}
      {mounted && modalAberto && filmesCategoria.length > 0 && createPortal(
        <LogCategoriaModal
          categoria={log.categoria}
          ano={log.ano}
          filmes={filmesCategoria}
          onClose={handleFechar}
        />,
        document.body
      )}
    </>
  );
}