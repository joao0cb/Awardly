'use client';

import { useState, useEffect } from 'react';
import Parse from '@/lib/parseClient';
import styles from '@/styles/logCategoria.module.css';

const TMDB_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;
const TMDB_IMAGE = process.env.NEXT_PUBLIC_TMDB_IMAGE_BASE;

const CATEGORIAS_ATOR = ['Melhor Ator', 'Melhor Atriz', 'Melhor Ator Coadjuvante', 'Melhor Atriz Coadjuvante'];
const CATEGORIAS_DIRETOR = ['Melhor Diretor'];
const CATEGORIAS_ROTEIRO = ['Melhor Roteiro Original', 'Melhor Roteiro Adaptado'];
const CATEGORIA_CANCAO = 'Melhor Canção Original';

function tipoCategoria(categoria) {
  if (CATEGORIAS_ATOR.includes(categoria)) return 'ator';
  if (CATEGORIAS_DIRETOR.includes(categoria)) return 'diretor';
  if (CATEGORIAS_ROTEIRO.includes(categoria)) return 'roteiro';
  if (categoria === CATEGORIA_CANCAO) return 'cancao';
  return 'filme';
}

async function buscarFotoPessoa(nome) {
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

async function buscarPosterFilme(tmdbId) {
  if (!tmdbId) return null;
  try {
    const res = await fetch(
      `https://api.themoviedb.org/3/movie/${tmdbId}?api_key=${TMDB_KEY}&language=pt-BR`
    );
    const data = await res.json();
    if (data?.poster_path) return `${TMDB_IMAGE}/w342${data.poster_path}`;
    return null;
  } catch { return null; }
}

function CardIndicado({ nomeItem, filme, tipo, foto, selecionado, onClick }) {
  const ehPessoa = tipo === 'ator' || tipo === 'diretor';
  const ehCancao = tipo === 'cancao';

  return (
    <div
      className={`${styles.cardIndicado} ${selecionado ? styles.selecionado : ''}`}
      onClick={onClick}
    >
      <div className={styles.cardImgWrap}>
        {foto ? (
          <img
            src={foto}
            alt={nomeItem || filme}
            className={`${styles.cardImg} ${ehPessoa ? styles.cardImgPessoa : ''}`}
          />
        ) : (
          <div className={styles.cardImgPlaceholder}>
            <span>{(nomeItem || filme || '?')[0]}</span>
          </div>
        )}
        {selecionado && <div className={styles.cardCheck}>✓</div>}
      </div>
      <div className={styles.cardInfo}>
        <p className={styles.cardNome}>{nomeItem || filme}</p>
        {(ehCancao || ehPessoa || tipo === 'diretor') && (
          <p className={styles.cardSub}>{filme}</p>
        )}
      </div>
    </div>
  );
}

export default function LogCategoriaModal({ categoria, ano, filmes, onClose }) {
  const tipo = tipoCategoria(categoria);
  const [indicados, setIndicados] = useState([]);
  const [deveria, setDeveria] = useState(null);
  const [queria, setQueria] = useState(null);
  const [review, setReview] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState('');
  const [jaLogado, setJaLogado] = useState(null);
  const [deletando, setDeletando] = useState(false);
  const [confirmarDelete, setConfirmarDelete] = useState(false);

  useEffect(() => {
    async function montar() {
      const lista = [];

      for (const filme of filmes) {
        // Busca poster via TMDB pelo tmdbId (resolve o bug dos posters)
        const posterUrl = filme.poster || await buscarPosterFilme(filme.tmdbId);

        if (tipo === 'ator') {
          const atores = filme.atoresIndicados?.[categoria];
          const nomes = Array.isArray(atores) ? atores : atores ? [atores] : [];
          for (const nome of nomes) {
            const foto = await buscarFotoPessoa(nome);
            // Fix: venceu quando vencedores inclui "Categoria::NomeAtor" OU filme._venceuItem com _itemForcado igual
            const venceu = (filme.vencedores || []).some(
              v => v === `${categoria}::${nome}` || v === categoria
            ) && (filme._itemForcado === nome || !filme._itemForcado);
            lista.push({ nomeItem: nome, filme: filme.titulo, foto, venceu });
          }
        } else if (tipo === 'diretor') {
          const nome = filme.diretor;
          if (nome) {
            const foto = await buscarFotoPessoa(nome);
            const venceu = (filme.vencedores || []).includes(categoria);
            lista.push({ nomeItem: nome, filme: filme.titulo, foto, venceu });
          }
        } else if (tipo === 'roteiro') {
          const nomes = Array.isArray(filme.roteiristas) ? filme.roteiristas.join(', ') : filme.roteiristas;
          const venceu = (filme.vencedores || []).includes(categoria);
          lista.push({ nomeItem: nomes, filme: filme.titulo, foto: posterUrl, venceu });
        } else if (tipo === 'cancao') {
          const cancoes = filme.cancao?.[categoria];
          const nomes = Array.isArray(cancoes) ? cancoes : cancoes ? [cancoes] : [];
          for (const cancao of nomes) {
            const venceu = (filme.vencedores || []).some(
              v => v === `${categoria}::${cancao}` || v === categoria
            );
            lista.push({ nomeItem: cancao, filme: filme.titulo, foto: posterUrl, venceu });
          }
        } else {
          const venceu = (filme.vencedores || []).includes(categoria);
          lista.push({ nomeItem: null, filme: filme.titulo, foto: posterUrl, venceu });
        }
      }

      const unicos = lista.filter((item, idx, arr) =>
        arr.findIndex(i => i.nomeItem === item.nomeItem && i.filme === item.filme) === idx
      );

      setIndicados(unicos);

      // Só pré-seleciona o vencedor se não houver log salvo ainda
      const user = Parse.User.current();
      if (!user) return;

      const query = new Parse.Query('LogCategoria');
      query.equalTo('usuarioId', user);
      query.equalTo('categoria', categoria);
      query.equalTo('ano', ano);
      const existing = await query.first();
      if (existing) {
        setJaLogado(existing);
        setDeveria(existing.get('deveriaTerGanhado'));
        setQueria(existing.get('queriaQueGanhasse'));
        setReview(existing.get('review') || '');
      } else {
      }
    }

    montar();
  }, [categoria, ano, filmes, tipo]);

  const vencedorReal = indicados.find(i => i.venceu);
  const vencedorLabel = vencedorReal ? (vencedorReal.nomeItem ?? vencedorReal.filme) : '';

  async function handleSalvar() {
    if (!deveria || !queria) {
      setMensagem('Selecione as duas opções antes de salvar.');
      return;
    }
    setSalvando(true);
    setMensagem('');
    try {
      const user = Parse.User.current();
      if (!user) throw new Error('Você precisa estar logado.');

      const LogCategoria = Parse.Object.extend('LogCategoria');
      const obj = jaLogado || new LogCategoria();

      obj.set('usuarioId', user);
      obj.set('categoria', categoria);
      obj.set('ano', ano);
      obj.set('vencedorReal', vencedorLabel);
      obj.set('deveriaTerGanhado', deveria);
      obj.set('queriaQueGanhasse', queria);
      obj.set('review', review);

      await obj.save();
      setJaLogado(obj);
      setMensagem('Log salvo!');
      setTimeout(() => onClose('__salvo__'), 800);
    } catch (e) {
      setMensagem(e.message || 'Erro ao salvar.');
    } finally {
      setSalvando(false);
    }
  }

  async function handleDeletar() {
    if (!confirmarDelete) { setConfirmarDelete(true); return; }
    setDeletando(true);
    try {
      await jaLogado.destroy();
      onClose('__deletado__');
    } catch (e) {
      setMensagem(e.message || 'Erro ao deletar.');
      setDeletando(false);
    }
  }

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose(null)}>
      <div className={styles.modal}>

        <div className={styles.header}>
          <div>
            <h2 className={styles.headerTitulo}>log da categoria</h2>
            <p className={styles.headerSub}>{categoria} · {ano}</p>
          </div>
          <button className={styles.btnFechar} onClick={() => onClose(null)}>✕</button>
        </div>

        {vencedorReal && (
          <div className={styles.vencedorBox}>
            <div className={styles.vencedorImgWrap}>
              {vencedorReal.foto ? (
                <img src={vencedorReal.foto} className={styles.vencedorImg} alt={vencedorLabel} />
              ) : (
                <span>🏆</span>
              )}
            </div>
            <div className={styles.vencedorTexto}>
              <p className={styles.vencedorLabel}>vencedor real</p>
              <p className={styles.vencedorNome}>
                {vencedorLabel}{vencedorReal.nomeItem && vencedorReal.filme ? ` — ${vencedorReal.filme}` : ''}
              </p>
            </div>
          </div>
        )}

        <div className={styles.secao}>
          <p className={styles.secaoLabel}>quem deveria ter ganhado?</p>
          <div className={styles.grade}>
            {indicados.map((ind, i) => (
              <CardIndicado key={i} tipo={tipo} nomeItem={ind.nomeItem} filme={ind.filme}
                foto={ind.foto} selecionado={deveria === (ind.nomeItem ?? ind.filme)}
                onClick={() => setDeveria(ind.nomeItem ?? ind.filme)} />
            ))}
          </div>
        </div>

        <div className={styles.secao}>
          <p className={styles.secaoLabel}>quem você queria que ganhasse?</p>
          <div className={styles.grade}>
            {indicados.map((ind, i) => (
              <CardIndicado key={i} tipo={tipo} nomeItem={ind.nomeItem} filme={ind.filme}
                foto={ind.foto} selecionado={queria === (ind.nomeItem ?? ind.filme)}
                onClick={() => setQueria(ind.nomeItem ?? ind.filme)} />
            ))}
          </div>
        </div>

        <div className={styles.secao}>
          <p className={styles.secaoLabel}>review</p>
          <textarea className={styles.textarea} rows={3}
            placeholder="Escreva sua opinião sobre essa categoria..."
            value={review} onChange={(e) => setReview(e.target.value)} maxLength={500} />
        </div>

        {mensagem && (
          <p className={`${styles.mensagem} ${mensagem === 'Log salvo!' ? styles.sucesso : styles.erro}`}>
            {mensagem}
          </p>
        )}

        <div className={styles.acoes}>
          {jaLogado && (
            <button
              className={`${styles.btnDeletar} ${confirmarDelete ? styles.btnDeletarConfirmar : ''}`}
              onClick={handleDeletar} disabled={deletando}
            >
              {deletando ? 'excluindo...' : confirmarDelete ? 'confirmar exclusão' : 'excluir log'}
            </button>
          )}
          <div style={{ display: 'flex', gap: 10, marginLeft: 'auto' }}>
            <button className={styles.btnCancelar} onClick={() => onClose(null)}>cancelar</button>
            <button className={styles.btnSalvar} onClick={handleSalvar} disabled={salvando}>
              {salvando ? 'salvando...' : jaLogado ? 'atualizar log' : 'salvar log'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}