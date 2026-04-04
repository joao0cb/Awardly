"use client";

import { useState, useEffect, useRef } from "react";
import Parse from "@/lib/parseClient";
import styles from "@/styles/filmesFavoritos.module.css";
import { getFilme, getImageURL } from "@/lib/tmdb";

async function buscarFilmes(termo) {
  if (!termo.trim()) return [];
  const Filme = Parse.Object.extend("Filme");
  const query = new Parse.Query(Filme);
  query.contains("nome", termo);
  query.limit(8);
  const resultados = await query.find();
  return resultados.map((f) => ({
    objectId: f.id,
    tmdbId: f.get("tmdbId"),
    nome: f.get("nome"),
    ano: f.get("ano"),
  }));
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
              alt={filme.nome}
              className={styles.quadradoImg}
            />
          ) : (
            <div className={styles.quadradoSemPoster}>
              <span>{filme.nome}</span>
            </div>
          )}
          <div className={styles.quadradoOverlay}>
            <span className={styles.quadradoTitulo}>{filme.nome}</span>
            <button
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

function ModalBusca({ onSelecionar, onFechar }) {
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
          {resultados.map((filme) => (
            <div
              key={filme.objectId}
              className={styles.resultadoItem}
              onClick={() => onSelecionar(filme)}
            >
              <div className={styles.resultadoInfo}>
                <span className={styles.resultadoNome}>{filme.nome}</span>
                <span className={styles.resultadoAno}>{filme.ano}</span>
              </div>
              <span className={styles.resultadoAdd}>+</span>
            </div>
          ))}
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
        />
      )}
    </div>
  );
}