"use client";

import { useState, useEffect, useRef } from "react";
import Parse from "@/lib/parseClient";
import styles from "@/styles/filmesFavoritos.module.css";
import { getFilme, getImageURL } from "@/lib/tmdb";

async function buscarFilmesPorTitulo(termo) {
  if (!termo.trim()) return [];
  const Filme = Parse.Object.extend("Filme");
  const query = new Parse.Query(Filme);
  query.matches("titulo", termo, "i"); // case-insensitive
  query.limit(8);
  const resultados = await query.find();
  return resultados.map((f) => ({
    objectId: f.id,
    tmdbId: f.get("tmdbId"),
    titulo: f.get("titulo"),
    ano: f.get("ano"),
  }));
}

async function buscarFilmesPorTituloOriginal(termo) {
  if (!termo.trim()) return [];
  try {
    const url = `https://api.themoviedb.org/3/search/movie?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}&query=${encodeURIComponent(termo)}&language=pt-BR`;
    const res = await fetch(url);
    const data = await res.json();
    const tmdbIds = (data.results || []).slice(0, 10).map((m) => m.id);
    if (tmdbIds.length === 0) return [];

    const Filme = Parse.Object.extend("Filme");
    const query = new Parse.Query(Filme);
    query.containedIn("tmdbId", tmdbIds);
    query.limit(8);
    const resultados = await query.find();
    return resultados.map((f) => ({
      objectId: f.id,
      tmdbId: f.get("tmdbId"),
      titulo: f.get("titulo"),
      ano: f.get("ano"),
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
  return merged.slice(0, 8); // mantém o limite de 8
}

function Quadradinho({ filme, indice, onClick }) {
  return (
    <div
      className={`${styles.quadrado} ${filme ? styles.quadradoPreenchido : styles.quadradoVazio}`}
      onClick={() => !filme && onClick()}
    >
      {filme ? (
        <>
          {filme.poster_path ? (
            <img
              src={getImageURL(filme.poster_path, "w342")}
              alt={filme.titulo}
              className={styles.quadradoImg}
            />
          ) : (
            <div className={styles.quadradoSemPoster}>
              <span>{filme.titulo}</span>
            </div>
          )}
          <div className={styles.quadradoOverlay}>
            <span className={styles.quadradoTitulo}>{filme.titulo}</span>
            <button
              type="button"
              className={styles.btnRemover}
              onClick={(e) => { e.stopPropagation(); onClick(true); }}
            >
              ✕
            </button>
          </div>
        </>
      ) : (
        <div className={styles.quadradoPlaceholder}>
          <span className={styles.quadradoMais}>+</span>
          <span className={styles.quadradoLabel}>favorito {indice + 1}</span>
        </div>
      )}
    </div>
  );
}

function ModalBusca({ onSelecionar, onFechar, valor }) {
  const [termo, setTermo] = useState("");
  const [resultados, setResultados] = useState([]);
  const [buscando, setBuscando] = useState(false);
  const inputRef = useRef(null);
  const timeoutRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    clearTimeout(timeoutRef.current);
    if (!termo.trim()) { setResultados([]); return; }
    timeoutRef.current = setTimeout(async () => {
      setBuscando(true);
      try {
        const filmes = await buscarFilmes(termo);
        setResultados(filmes);
      } catch (e) {
        console.error(e);
      } finally {
        setBuscando(false);
      }
    }, 350);
    return () => clearTimeout(timeoutRef.current);
  }, [termo]);

  return (
    <div className={styles.modalOverlay} onClick={(e) => e.target === e.currentTarget && onFechar()}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <span className={styles.modalTitulo}>buscar filme</span>
          <button className={styles.btnFechar} onClick={onFechar}>✕</button>
        </div>
        <div className={styles.modalBusca}>
          <input
            ref={inputRef}
            value={termo}
            onChange={(e) => setTermo(e.target.value)}
            placeholder="Digite o nome do filme..."
            className={styles.inputBusca}
          />
        </div>
        <div className={styles.resultados}>
          {buscando && <p className={styles.buscando}>buscando...</p>}
          {!buscando && termo && resultados.length === 0 && (
            <p className={styles.semResultado}>Nenhum filme encontrado.</p>
          )}
          {resultados.map((filme) => {
            const duplicado = valor.some((v) => v.tmdbId === filme.tmdbId);
            return (
              <div
                key={filme.objectId}
                className={`${styles.resultadoItem} ${duplicado ? styles.resultadoDesabilitado : ""}`}
                onClick={() => !duplicado && onSelecionar(filme)}
              >
                <div className={styles.resultadoInfo}>
                  <span className={styles.resultadoNome}>{filme.titulo}</span>
                  <span className={styles.resultadoAno}>{filme.ano}</span>
                </div>
                <span className={styles.resultadoAdd}>{duplicado ? "✓" : "+"}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function FilmesFavoritos({ valor = [], onChange }) {
  const [modalAberto, setModalAberto] = useState(false);
  const [indiceEditando, setIndiceEditando] = useState(null);

  const slots = Array.from({ length: 4 }, (_, i) => valor[i] || null);

  function abrirModal(indice) {
    setIndiceEditando(indice);
    setModalAberto(true);
  }

  async function handleSelecionar(filme) {
    const jaExiste = slots.some(
      (s, i) => s?.tmdbId === filme.tmdbId && i !== indiceEditando
    );
    if (jaExiste) return;

    let poster_path = null;
    try {
      const detalhes = await getFilme(filme.tmdbId);
      poster_path = detalhes?.poster_path || null;
    } catch (e) {
      console.error("Erro ao buscar poster:", e);
    }

    const filmeCompleto = { ...filme, poster_path };
    const novos = [...slots];
    novos[indiceEditando] = filmeCompleto;
    onChange(novos.filter(Boolean));
    setModalAberto(false);
    setIndiceEditando(null);
  }

  function handleRemover(indice) {
    const novos = [...slots];
    novos[indice] = null;
    onChange(novos.filter(Boolean));
  }

  return (
    <div className={styles.container}>
      <div className={styles.grade}>
        {slots.map((filme, i) => (
          <Quadradinho
            key={i}
            filme={filme}
            indice={i}
            onClick={(remover) => remover ? handleRemover(i) : abrirModal(i)}
          />
        ))}
      </div>
      {modalAberto && (
        <ModalBusca
          onSelecionar={handleSelecionar}
          onFechar={() => { setModalAberto(false); setIndiceEditando(null); }}
          valor={valor}
        />
      )}
    </div>
  );
}