'use client';

import { useRouter } from 'next/navigation';

export default function FilmeCard({ filme }) {
  const router = useRouter();

  return (
    <div
      className="filme-card"
      onClick={() => router.push(`/filmes/${filme.tmdbId}`)}
    >
      <div className="filme-card-poster">
        <img src={filme.poster} alt={filme.titulo} loading="lazy" />
        {filme.vencedor && (
          <span className="badge-vencedor">🏆 Vencedor</span>
        )}
      </div>
      <div className="filme-card-info">
        <h3>{filme.titulo}</h3>
        <span className="filme-ano">{filme.anoLancamento}</span>
        <span className="filme-nota">⭐ {filme.nota}</span>
        <div className="filme-categorias">
          {filme.categorias.slice(0, 2).map((cat) => (
            <span key={cat} className="tag-categoria">{cat}</span>
          ))}
        </div>
      </div>
    </div>
  );
}