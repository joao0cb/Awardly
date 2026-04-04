'use client';

import { useState, useEffect } from 'react';
import { useFilmes } from '../../../hooks/useFilmes';
import FilmeCard from '@/app/components/FilmeCard';
import '@/styles/categorias.css';
import NavbarLogin from '../../components/NavbarLogin';
import Parse from '@/lib/parseClient';

const ANOS = [2023, 2024, 2025, 2026];

const ORDEM_CATEGORIAS = [
  'Melhor Filme',
  'Melhor Diretor',
  'Melhor Ator',
  'Melhor Atriz',
  'Melhor Ator Coadjuvante',
  'Melhor Atriz Coadjuvante',
  'Melhor Roteiro Original',
  'Melhor Roteiro Adaptado',
  'Melhor Filme Internacional',
  'Melhor Animação',
  'Melhor Documentário (Longa)',
  'Melhor Documentário (Curta)',
  'Melhor Curta de Animação',
  'Melhor Curta-Metragem (Live Action)',
  'Melhor Fotografia',
  'Melhor Edição',
  'Melhor Montagem',
  'Melhor Trilha Sonora',
  'Melhor Canção Original',
  'Melhor Design de Produção',
  'Melhor Figurino',
  'Melhor Maquiagem e Penteados',
  'Melhor Som',
  'Melhores Efeitos Visuais',
  'Melhor Direção de Elenco',
];

const CATEGORIAS_ATUACAO = [
  'Melhor Ator',
  'Melhor Atriz',
  'Melhor Ator Coadjuvante',
  'Melhor Atriz Coadjuvante',
];

const CATEGORIAS_ROTEIRO = [
  'Melhor Roteiro Original',
  'Melhor Roteiro Adaptado',
];

export default function Categorias() {
  const [anoSelecionado, setAnoSelecionado] = useState(null);
  const { filmes, loading, erro } = useFilmes(anoSelecionado);

  const [usuario, setUsuario] = useState(null);

  useEffect(() => {
    const user = Parse.User.current();
    setUsuario(user);
  }, []);

  const nome = usuario?.get('nome') || usuario?.get('username') || '';
  const foto = usuario?.get('foto')?._url || null;

  const categoriasAgrupadas = filmes.reduce((acc, filme) => {
    filme.categorias.forEach((cat) => {
      if (!acc[cat]) acc[cat] = [];

      if (CATEGORIAS_ATUACAO.includes(cat)) {
        const atores = filme.atoresIndicados?.[cat];
        if (Array.isArray(atores) && atores.length > 1) {
          // Múltiplos atores: duplica card, vencedor exige formato "::"
          atores.forEach((ator) => {
            const venceu = filme.vencedores?.some(
              (v) => v === `${cat}::${ator}`
            );
            acc[cat].push({ ...filme, _itemForcado: ator, _venceuItem: venceu });
          });
        } else {
          // Um ator só: passa normalmente
          const ator = Array.isArray(atores) ? atores[0] : atores;
          acc[cat].push({
            ...filme,
            _itemForcado: ator || null,
            _venceuItem: filme.vencedores?.includes(cat),
          });
        }

      } else if (cat === 'Melhor Diretor') {
        acc[cat].push({
          ...filme,
          _itemForcado: filme.diretor || null,
          _venceuItem: filme.vencedores?.includes(cat),
        });

      } else if (cat === 'Melhor Canção Original') {
        const cancoes = filme.cancao?.[cat];
        if (Array.isArray(cancoes) && cancoes.length > 1) {
          // Múltiplas canções: duplica card, vencedor exige formato "::"
          cancoes.forEach((cancao) => {
            const venceu = filme.vencedores?.some(
              (v) => v === `${cat}::${cancao}`
            );
            acc[cat].push({ ...filme, _itemForcado: cancao, _venceuItem: venceu });
          });
        } else {
          // Uma canção só: aceita tanto "Melhor Canção Original" quanto "Melhor Canção Original::Nome"
          const cancao = Array.isArray(cancoes) ? cancoes[0] : cancoes;
          const venceu = filme.vencedores?.some(
            (v) => v === cat || v === `${cat}::${cancao}`
          );
          acc[cat].push({
            ...filme,
            _itemForcado: cancao || null,
            _venceuItem: venceu,
          });
        }

      } else if (CATEGORIAS_ROTEIRO.includes(cat)) {
        acc[cat].push({
          ...filme,
          _itemForcado: filme.roteiristas || null,
          _venceuItem: filme.vencedores?.includes(cat),
        });

      } else {
        acc[cat].push({ ...filme, _venceuItem: filme.vencedores?.includes(cat) });
      }
    });
    return acc;
  }, {});

  const categoriasOrdenadas = ORDEM_CATEGORIAS
    .filter((cat) => categoriasAgrupadas[cat])
    .map((cat) => [cat, categoriasAgrupadas[cat]]);

  const categoriasExtras = Object.entries(categoriasAgrupadas)
    .filter(([cat]) => !ORDEM_CATEGORIAS.includes(cat));

  const todasCategorias = [...categoriasOrdenadas, ...categoriasExtras];

  return (
    <div className="categorias-container">
      <NavbarLogin usuario={{ nome, foto }} />

      <h1 className="categorias-titulo">Categorias do Oscar</h1>

      <div className="filtros">
        {ANOS.map((ano) => (
          <button
            key={ano}
            className={`filtro-btn ${anoSelecionado === ano ? 'ativo' : ''}`}
            onClick={() => setAnoSelecionado(ano === anoSelecionado ? null : ano)}
          >
            {ano}
          </button>
        ))}
      </div>

      {!anoSelecionado && (
        <div className="selecione">
          <p>Selecione o ano</p>
        </div>
      )}

      {loading && anoSelecionado && <p className="mensagem">Carregando...</p>}
      {erro && <p className="mensagem erro">Erro: {erro}</p>}

      {!loading && !erro && anoSelecionado && (
        <div className="categorias-lista">
          {todasCategorias.map(([nome, filmesCategoria]) => (
            <div key={nome} className="categoria-bloco">
              <h2>{nome}</h2>
              <div className="categoria-filmes">
                {filmesCategoria.map((filme, i) => (
                  <FilmeCard
                    key={`${filme.id}-${filme._itemForcado ?? ''}-${i}`}
                    filme={filme}
                    categoriaAtual={nome}
                    itemForcado={filme._itemForcado ?? null}
                    venceu={filme._venceuItem ?? false}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}