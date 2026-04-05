import '@/styles/footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-conteudo">
        <p className="footer-copy">© 2026 Awardly — Todos os direitos reservados</p>
        <p className="footer-tmdb">
          This product uses the{' '}
          <a href="https://www.themoviedb.org" target="_blank" rel="noopener noreferrer">
            TMDB API
          </a>{' '}
          but is not endorsed or certified by TMDB.
        </p>
      </div>
    </footer>
  );
}