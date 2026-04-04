'use client';

import { useState, useMemo } from 'react';
import { useFilmes } from '../../../hooks/useFilmes';
import FilmeCard from '@/app/components/FilmeCard';
import '@/styles/filmes.css';

const ANOS = [2023, 2024, 2025, 2026];

export default function Filmes() {
  const [anoSelecionado, setAnoSelecionado] = useState(null);
  const [busca, setBusca] = useState('');
  const { filmes, loading, erro } = useFilmes(anoSelecionado);

  const filmesFiltrados = useMemo(() => {
    if (!busca.trim()) return filmes;
    const termo = busca.toLowerCase().trim();
    return filmes.filter(
      (f) =>
        f.titulo?.toLowerCase().includes(termo) ||
        f.tituloOriginal?.toLowerCase().includes(termo)
    );
  }, [filmes, busca]);

  return (
    <div className="filmes-container">
      <h1 className="filmes-titulo">Filmes Indicados ao Oscar</h1>

      <div className="filmes-filtros">
        <button
          className={`filtro-btn ${anoSelecionado === null ? 'ativo' : ''}`}
          onClick={() => setAnoSelecionado(null)}
        >
          Todos
        </button>
        {ANOS.map((ano) => (
          <button
            key={ano}
            className={`filtro-btn ${anoSelecionado === ano ? 'ativo' : ''}`}
            onClick={() => setAnoSelecionado(ano)}
          >
            {ano}
          </button>
        ))}
      </div>

      <div className="filmes-busca-wrapper">
        <input
          type="text"
          className="filmes-busca"
          placeholder="Buscar filme..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
        {busca && (
          <button className="filmes-busca-limpar" onClick={() => setBusca('')}>
            ✕
          </button>
        )}
      </div>

      {loading && <p className="mensagem">Carregando filmes...</p>}
      {erro    && <p className="mensagem erro">Erro: {erro}</p>}

      {!loading && !erro && filmesFiltrados.length === 0 && (
        <div className="filmes-vazio">
          <p>Nenhum filme encontrado.</p>
          <span>Tente buscar por outro título.</span>
        </div>
      )}

      {!loading && !erro && filmesFiltrados.length > 0 && (
        <div className="filmes-grid">
          {filmesFiltrados.map((filme) => (
            <FilmeCard key={filme.id} filme={filme} />
          ))}
        </div>
      )}
    </div>
  );
}