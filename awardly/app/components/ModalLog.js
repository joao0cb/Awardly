"use client";

import { useState, useEffect, useRef } from "react";
import Parse from "@/lib/parseClient";
import { getFilme, getImageURL } from "@/lib/tmdb";
import styles from "@/styles/modalLog.module.css";

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

function Estatuetas({ valor, onChange }) {
  const [hover, setHover] = useState(null);
  const slots = [1, 2, 3, 4, 5];

  function calcularValor(indice, metade) {
    return metade ? indice - 0.5 : indice;
  }

  function handleMouseMove(e, indice) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const metade = x < rect.width / 2;
    setHover(calcularValor(indice, metade));
  }

  function handleClick(e, indice) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const metade = x < rect.width / 2;
    const novo = calcularValor(indice, metade);
    onChange(valor === novo ? 0 : novo);
  }

  const exibir = hover !== null ? hover : valor;

  return (
    <div className={styles.estatuetasWrap} onMouseLeave={() => setHover(null)}>
      {slots.map((i) => {
        const cheia = exibir >= i;
        const meia = !cheia && exibir >= i - 0.5;
        return (
          <div
            key={i}
            className={styles.estatuetaSlot}
            onMouseMove={(e) => handleMouseMove(e, i)}
            onClick={(e) => handleClick(e, i)}
          >
            {cheia ? (
              <img src="/oscar2.png" alt={`${i} estatuetas`} className={styles.estatuetaImg} />
            ) : meia ? (
              <div className={styles.estatuetaMeia}>
                <img src="/oscar2.png" alt="meia estatueta" className={styles.estatuetaImg} style={{ clipPath: "inset(0 50% 0 0)" }} />
                <img src="/oscarvazio.png" alt="" className={`${styles.estatuetaImg} ${styles.estatuetaFundo}`} style={{ clipPath: "inset(0 0 0 50%)" }} />
              </div>
            ) : (
              <img src="/oscarvazio.png" alt="vazia" className={styles.estatuetaImg} />
            )}
          </div>
        );
      })}
      {valor > 0 && (
        <span className={styles.estatuetasValor}>{valor}</span>
      )}
    </div>
  );
}

function BotaoLike({ ativo, onChange }) {
  return (
    <button
      type="button"
      className={`${styles.btnLike} ${ativo ? styles.btnLikeAtivo : ""}`}
      onClick={() => onChange(!ativo)}
      title={ativo ? "Remover like" : "Gostei"}
    >
      <img
        src={ativo ? "/envelopecoracao.png" : "/envelope.png"}
        alt={ativo ? "Gostei" : "Não gostei"}
        className={styles.envelopeImg}
      />
      <span>{ativo ? "gostei" : "gostei?"}</span>
    </button>
  );
}

function EtapaBusca({ onSelecionar }) {
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
    <div className={styles.etapaBusca}>
      <div className={styles.buscaWrap}>
        <svg className={styles.buscaIcone} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="11" cy="11" r="7" />
          <line x1="16.5" y1="16.5" x2="22" y2="22" />
        </svg>
        <input
          ref={inputRef}
          value={termo}
          onChange={(e) => setTermo(e.target.value)}
          placeholder="Pesquisar filme do Oscar..."
          className={styles.inputBusca}
        />
      </div>

      <div className={styles.resultados}>
        {buscando && <p className={styles.msg}>buscando...</p>}
        {!buscando && termo && resultados.length === 0 && (
          <p className={styles.msg}>Nenhum filme encontrado.</p>
        )}
        {!termo && (
          <p className={styles.msgDica}>Digite o nome de um filme indicado ao Oscar.</p>
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
            <span className={styles.resultadoSeta}>→</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function EtapaLog({ filme, detalhes, onSalvar, salvando, erro }) {
  const hoje = new Date().toISOString().split("T")[0];
  const [data, setData] = useState(hoje);
  const [estatuetas, setEstatuetas] = useState(0);
  const [like, setLike] = useState(false);
  const [review, setReview] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    onSalvar({ data, estatuetas, like, review });
  }

  return (
    <form onSubmit={handleSubmit} className={styles.etapaLog}>
      <div className={styles.filmeInfo}>
        {detalhes?.poster_path ? (
          <img
            src={getImageURL(detalhes.poster_path, "w185")}
            alt={filme.nome}
            className={styles.filmePoster}
          />
        ) : (
          <div className={styles.filmeSemPoster} />
        )}
        <div className={styles.filmeTexto}>
          <h3 className={styles.filmeNome}>{filme.nome}</h3>
          <span className={styles.filmeAno}>{filme.ano}</span>
          {detalhes?.overview && (
            <p className={styles.filmeSinopse}>
              {detalhes.overview.slice(0, 120)}...
            </p>
          )}
        </div>
      </div>

      <div className={styles.campo}>
        <label className={styles.label}>quando você assistiu?</label>
        <input
          type="date"
          value={data}
          onChange={(e) => setData(e.target.value)}
          className={styles.inputData}
          max={hoje}
        />
      </div>

      <div className={styles.avaliacaoRow}>
        <div className={styles.campo}>
          <label className={styles.label}>sua nota</label>
          <Estatuetas valor={estatuetas} onChange={setEstatuetas} />
        </div>
        <div className={styles.campo}>
          <label className={styles.label}>curtiu?</label>
          <BotaoLike ativo={like} onChange={setLike} />
        </div>
      </div>

      <div className={styles.campo}>
        <label className={styles.label}>review <span className={styles.opcional}>(opcional)</span></label>
        <textarea
          value={review}
          onChange={(e) => setReview(e.target.value)}
          placeholder="O que você achou do filme?"
          className={styles.textarea}
          rows={3}
          maxLength={1000}
        />
        {review && <span className={styles.contador}>{review.length}/1000</span>}
      </div>

      {erro && <p className={styles.erro}>{erro}</p>}

      <button type="submit" className={styles.btnSalvar} disabled={salvando}>
        {salvando ? "registrando..." : "registrar"}
      </button>
    </form>
  );
}

export default function ModalLog({ onFechar, onSalvo }) {
  const [etapa, setEtapa] = useState("busca");
  const [filmeSelecionado, setFilmeSelecionado] = useState(null);
  const [detalhesFilme, setDetalhesFilme] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  async function handleSelecionar(filme) {
    setFilmeSelecionado(filme);
    setEtapa("log");
    try {
      const detalhes = await getFilme(filme.tmdbId);
      setDetalhesFilme(detalhes);
    } catch (e) {
      console.error("Erro ao buscar detalhes:", e);
    }
  }

  async function handleSalvar({ data, estatuetas, like, review }) {
    setErro("");
    const user = Parse.User.current();
    if (!user) { setErro("Você precisa estar logado."); return; }

    setSalvando(true);
    try {
      const Log = Parse.Object.extend("Log");
      const log = new Log();
      log.set("usuarioId", user);
      log.set("filmeId", filmeSelecionado.tmdbId);
      log.set("dataAssistido", new Date(data + "T12:00:00"));
      log.set("estatuetas", estatuetas);
      log.set("like", like);
      if (review.trim()) log.set("review", review.trim());

      const acl = new Parse.ACL();
      acl.setPublicReadAccess(true);
      acl.setWriteAccess(user, true);
      log.setACL(acl);

      await log.save();
      onSalvo?.();
      onFechar();
    } catch (e) {
      setErro(e.message || "Erro ao registrar.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onFechar()}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <div className={styles.headerEsq}>
            {etapa === "log" && (
              <button className={styles.btnVoltar} onClick={() => { setEtapa("busca"); setFilmeSelecionado(null); setDetalhesFilme(null); }}>
                ←
              </button>
            )}
            <span className={styles.headerLabel}>
              {etapa === "busca" ? "registrar filme" : "seu log"}
            </span>
          </div>
          <button className={styles.btnFechar} onClick={onFechar}>✕</button>
        </div>

        {etapa === "busca" ? (
          <EtapaBusca onSelecionar={handleSelecionar} />
        ) : (
          <EtapaLog
            filme={filmeSelecionado}
            detalhes={detalhesFilme}
            onSalvar={handleSalvar}
            salvando={salvando}
            erro={erro}
          />
        )}
      </div>
    </div>
  );
}