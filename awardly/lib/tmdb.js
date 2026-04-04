const BASE_URL = process.env.NEXT_PUBLIC_TMDB_BASE_URL;
const API_KEY  = process.env.NEXT_PUBLIC_TMDB_API_KEY;

async function fetchTMDB(endpoint, params = {}) {
    const url = new URL(`${BASE_URL}${endpoint}`);
    url.searchParams.set('api_key', API_KEY);
    url.searchParams.set('language', 'pt-BR');

    Object.entries(params).forEach(([key, val]) => {
        url.searchParams.set(key, val);
    });

    const res = await fetch(url);
    if (!res.ok) throw new Error(`Erro TMDB: ${res.status}`);
    return res.json();
}

export const getFilme         = (id) => fetchTMDB(`/movie/${id}`);
export const getFilmeCreditos = (id) => fetchTMDB(`/movie/${id}/credits`);
export const getFilmeImagens  = (id) => fetchTMDB(`/movie/${id}/images`, {
    include_image_language: 'en,null',
});

export const getPessoa        = (id) => fetchTMDB(`/person/${id}`);

// tamanhos úteis: w185, w342, w500, w780, original
export const getImageURL = (path, tamanho = 'w500') => {
    if (!path) return '/placeholder.jpg';
    return `${process.env.NEXT_PUBLIC_TMDB_IMAGE_BASE}/${tamanho}${path}`;
};