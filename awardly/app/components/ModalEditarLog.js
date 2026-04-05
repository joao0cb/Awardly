'use client';

import { useState, useEffect } from 'react';
import Parse from '@/lib/parseClient';
import { getFilme, getImageURL } from '@/lib/tmdb';
import styles from '@/styles/modalLog.module.css';
import editStyles from '@/styles/modalEditarLog.module.css';

function Estatuetas({ valor, onChange }) {
  const [hover, setHover] = useState(null);

  function calcularValor(indice, metade) {
    return metade ? indice - 0.5 : indice;
  }

  function handleMouseMove(e, indice) {
    const rect = e.currentTarget.getBoundingClientRect();
    const metade = (e.clientX - rect.left) < rect.width / 2;
    setHover(calcularValor(indice, metade));
  }

  function handleClick(e, indice) {
    const rect = e.currentTarget.getBoundingClientRect();
    const metade = (e.clientX - rect.left) < rect.width / 2;
    const novo = calcularValor(indice, metade);
    onChange(valor === novo ? 0 : novo);
  }

  const exibir = hover !== null ? hover : valor;

  return (
    <div className={styles.estatuetasWrap} onMouseLeave={() => setHover(null)}>
      {[1,2,3,4,5].map((i) => {
        const cheia = exibir >= i;
        const meia = !cheia && exibir >= i - 0.5;
        return (
          <div key={i} className={styles.estatuetaSlot}
            onMouseMove={(e) => handleMouseMove(e, i)}
            onClick={(e) => handleClick(e, i)}
          >
            {cheia ? (
              <img src="/oscar2.png" alt="" className={styles.estatuetaImg} />
            ) : meia ? (
              <div className={styles.estatuetaMeia}>
                <img src="/oscar2.png" className={styles.estatuetaImg} style={{ clipPath: 'inset(0 50% 0 0)' }} />
                <img src="/oscarvazio.png" className={`${styles.estatuetaImg} ${styles.estatuetaFundo}`} style={{ clipPath: 'inset(0 0 0 50%)' }} />
              </div>
            ) : (
              <img src="/oscarvazio.png" alt="" className={styles.estatuetaImg} />
            )}
          </div>
        );
      })}
      {valor > 0 && <span className={styles.estatuetasValor}>{valor}</span>}
    </div>
  );
}

function BotaoLike({ ativo, onChange }) {
  return (
    <button type="button"
      className={`${styles.btnLike} ${ativo ? styles.btnLikeAtivo : ''}`}
      onClick={() => onChange(!ativo)}
    >
      <img src={ativo ? '/envelopecoracao.png' : '/envelope.png'} alt="" className={styles.envelopeImg} />
    </button>
  );
}

export default function ModalEditarLog({ logId, filmeId, dadosIniciais, onFechar, onSalvo, onDeletado }) {
  const [detalhes, setDetalhes] = useState(null);
  const [data, setData] = useState(dadosIniciais?.data || new Date().toISOString().split('T')[0]);
  const [estatuetas, setEstatuetas] = useState(dadosIniciais?.estatuetas || 0);
  const [like, setLike] = useState(dadosIniciais?.like || false);
  const [review, setReview] = useState(dadosIniciais?.review || '');
  const [salvando, setSalvando] = useState(false);
  const [deletando, setDeletando] = useState(false);
  const [confirmarDelete, setConfirmarDelete] = useState(false);
  const [erro, setErro] = useState('');
  const hoje = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (filmeId) {
      getFilme(filmeId).then(setDetalhes).catch(console.error);
    }
  }, [filmeId]);

  async function handleSalvar(e) {
    e.preventDefault();
    setSalvando(true);
    setErro('');
    try {
      const query = new Parse.Query('Log');
      const obj = await query.get(logId);
      obj.set('dataAssistido', new Date(data + 'T12:00:00'));
      obj.set('estatuetas', estatuetas);
      obj.set('like', like);
      if (review.trim()) {
        obj.set('review', review.trim());
      } else {
        obj.unset('review');
      }
      await obj.save();
      onSalvo?.();
      onFechar();
    } catch (e) {
      setErro(e.message || 'Erro ao salvar.');
    } finally {
      setSalvando(false);
    }
  }

  async function handleDeletar() {
    if (!confirmarDelete) { setConfirmarDelete(true); return; }
    setDeletando(true);
    try {
      const query = new Parse.Query('Log');
      const obj = await query.get(logId);
      await obj.destroy();
      onDeletado?.();
      onFechar();
    } catch (e) {
      setErro(e.message || 'Erro ao deletar.');
    } finally {
      setDeletando(false);
    }
  }

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onFechar()}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <div className={styles.headerEsq}>
            <span className={styles.headerLabel}>editar log</span>
          </div>
          <button className={styles.btnFechar} onClick={onFechar}>✕</button>
        </div>

        <form onSubmit={handleSalvar} className={styles.etapaLog}>
          {detalhes && (
            <div className={styles.filmeInfo}>
              {detalhes.poster_path ? (
                <img src={getImageURL(detalhes.poster_path, 'w185')} alt={detalhes.title} className={styles.filmePoster} />
              ) : (
                <div className={styles.filmeSemPoster} />
              )}
              <div className={styles.filmeTexto}>
                <h3 className={styles.filmeNome}>{detalhes.title}</h3>
                <span className={styles.filmeAno}>{detalhes.release_date?.slice(0, 4)}</span>
                {detalhes.overview && (
                  <p className={styles.filmeSinopse}>{detalhes.overview.slice(0, 120)}...</p>
                )}
              </div>
            </div>
          )}

          <div className={styles.campo}>
            <label className={styles.label}>quando você assistiu?</label>
            <input type="date" value={data} onChange={(e) => setData(e.target.value)}
              className={styles.inputData} max={hoje} />
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
            <textarea value={review} onChange={(e) => setReview(e.target.value)}
              placeholder="O que você achou do filme?" className={styles.textarea}
              rows={3} maxLength={500} />
            {review && <span className={styles.contador}>{review.length}/500</span>}
          </div>

          {erro && <p className={styles.erro}>{erro}</p>}

          <div className={editStyles.acoes}>
            <button
              type="button"
              className={`${editStyles.btnDeletar} ${confirmarDelete ? editStyles.btnDeletarConfirmar : ''}`}
              onClick={handleDeletar}
              disabled={deletando}
            >
              {deletando ? 'excluindo...' : confirmarDelete ? 'confirmar exclusão' : 'excluir log'}
            </button>
            <button type="submit" className={styles.btnSalvar} disabled={salvando}>
              {salvando ? 'salvando...' : 'salvar alterações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}