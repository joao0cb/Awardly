'use client';

import { useState, useEffect } from 'react';
import Parse from '@/lib/parseClient';
import { getFilme, getFilmeCreditos, getImageURL } from '@/lib/tmdb';

export function useFilmes(ano = null) {
  const [filmes,  setFilmes]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro,    setErro]    = useState(null);

  useEffect(() => {
    async function carregar() {
      try {
        setLoading(true);
        setErro(null);

        const Filme = Parse.Object.extend('Filme');
        const query = new Parse.Query(Filme);
        if (ano) query.equalTo('ano', ano);
        query.limit(1000);
        const filmesDB = await query.find();

        const resultados = await Promise.allSettled(
          filmesDB.map(async (filme) => {
            const tmdbId = filme.get('tmdbId');

            const [detalhes, creditos] = await Promise.all([
              getFilme(tmdbId),
              getFilmeCreditos(tmdbId),
            ]);

            const diretoresTMDB = creditos.crew
              ?.filter((p) => p.job === 'Director')
              .map((p) => p.name)
              .join(', ') || null;

            const JOBS_ROTEIRISTA = ['Screenplay', 'Story', 'Writer', 'Original Story'];

            const roteiristas = creditos.crew
              ?.filter((p) => JOBS_ROTEIRISTA.includes(p.job))
              .map((p) => p.name)
              // remove duplicatas (mesma pessoa com dois jobs)
              .filter((nome, i, arr) => arr.indexOf(nome) === i)
              .join(', ') || null;

            return {
              id:                 filme.id,
              tmdbId,
              tituloOriginal:     detalhes.original_title,
              sinopse:            detalhes.overview,
              poster:             getImageURL(detalhes.poster_path, 'w342'),
              backdrop:           getImageURL(detalhes.backdrop_path, 'w780'),
              anoLancamento:      detalhes.release_date?.split('-')[0],
              nota:               detalhes.vote_average?.toFixed(1),
              duracao:            detalhes.runtime,
              categorias:         filme.get('categorias')         || [],
              vencedores:         filme.get('vencedores')         || [],
              atoresIndicados:    filme.get('atoresIndicados')    || {},
              // { 'Melhor Canção Original': ['All Too Well', 'Carolina'] }
              cancao:   filme.get('cancao')   || {},
              diretor:            diretoresTMDB,
              roteiristas,
              titulo:             filme.get('titulo')             || detalhes.title,
            };
          })
        );

        const filmesCompletos = resultados
          .filter((r) => r.status === 'fulfilled')
          .map((r) => r.value);

        setFilmes(filmesCompletos);
      } catch (e) {
        setErro(e.message);
      } finally {
        setLoading(false);
      }
    }

    carregar();
  }, [ano]);

  return { filmes, loading, erro };
}