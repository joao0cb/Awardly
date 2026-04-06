"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "@/styles/navbar.module.css";
import ModalLog from "./ModalLog";

export default function NavbarLogin({ usuario }) {
  const router = useRouter();
  const [pesquisaAberta, setPesquisaAberta] = useState(false);
  const [termoPesquisa, setTermoPesquisa] = useState("");
  const [modalLogAberto, setModalLogAberto] = useState(false);
  const [menuMobileAberto, setMenuMobileAberto] = useState(false);
  const inputRef = useRef(null);
  const searchContainerRef = useRef(null); // Ref para identificar a área da pesquisa

  // Hook para detectar cliques fora da área de pesquisa
  useEffect(() => {
    function handleClickOutside(event) {
      // Se a pesquisa estiver aberta e o clique for fora do container dela, ela fecha
      if (pesquisaAberta && searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        fecharPesquisa();
      }
    }

    // Adiciona o evento de clique na tela inteira
    document.addEventListener("mousedown", handleClickOutside);
    
    // Limpa o evento quando o componente for desmontado ou atualizado
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [pesquisaAberta]);

  function abrirPesquisa() {
    setPesquisaAberta(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  function fecharPesquisa() {
    setPesquisaAberta(false);
    setTermoPesquisa("");
  }

  function handlePesquisa(e) {
    e.preventDefault();
    if (termoPesquisa.trim()) {
      router.push(`/pesquisa?q=${encodeURIComponent(termoPesquisa.trim())}`);
      fecharPesquisa();
    }
  }

  function handleNavegacao(caminho) {
    router.push(caminho);
    setMenuMobileAberto(false);
  }

  return (
    <>
      <nav className={styles.navbar}>
        <div className={styles.navbarInterna}>
          <div className={styles.logo} onClick={() => router.push("/homeLogin")}>
            <img src="/oscar.png" alt="Oscar" className={styles.logoImg} />
            <span className={styles.logoNome}>Awardly</span>
          </div>

          <div className={styles.direita}>
            {/* Botão Hambúrguer com lógica para sumir quando a pesquisa estiver aberta */}
            <button 
              className={styles.btnHamburger} 
              onClick={() => setMenuMobileAberto(!menuMobileAberto)}
              aria-label="Abrir menu"
              style={{ display: pesquisaAberta ? "none" : "" }}
            >
              {menuMobileAberto ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              )}
            </button>

            {/* Links de Navegação */}
            <div className={`${styles.menuNav} ${menuMobileAberto ? styles.menuAberto : ""}`}>
              <button className={styles.linkNav} onClick={() => handleNavegacao("/filmes")}>
                filmes
              </button>
              <button className={styles.linkNav} onClick={() => handleNavegacao("/categorias")}>
                categorias
              </button>
              <button className={styles.btnLog} onClick={() => { setModalLogAberto(true); setMenuMobileAberto(false); }}>
                + log
              </button>
            </div>

            {/* Container da pesquisa com a Ref acoplada */}
            <div className={styles.pesquisaWrapper} ref={searchContainerRef}>
              <form
                onSubmit={handlePesquisa}
                className={`${styles.pesquisaForm} ${pesquisaAberta ? styles.pesquisaAberta : ""}`}
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={termoPesquisa}
                  onChange={(e) => setTermoPesquisa(e.target.value)}
                  className={styles.inputPesquisa}
                  tabIndex={pesquisaAberta ? 0 : -1}
                  placeholder="Buscar..."
                />
                <button
                  type="button"
                  className={styles.botaoLupa}
                  onClick={pesquisaAberta ? fecharPesquisa : abrirPesquisa}
                  aria-label="Pesquisar"
                >
                  {pesquisaAberta ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="7" />
                      <line x1="16.5" y1="16.5" x2="22" y2="22" />
                    </svg>
                  )}
                </button>
              </form>
            </div>

            <button className={styles.perfil} onClick={() => handleNavegacao("/perfil")}>
              <div className={styles.fotoPerfil}>
                {usuario?.foto ? (
                  <img src={usuario.foto} alt={usuario.nome} />
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="12" cy="8" r="4" />
                    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                  </svg>
                )}
              </div>
              {usuario?.nome && (
                <span className={styles.nomeUsuario}>{usuario.nome}</span>
              )}
            </button>
          </div>
        </div>
      </nav>

      {modalLogAberto && (
        <ModalLog
          onFechar={() => setModalLogAberto(false)}
          onSalvo={() => console.log("Log salvo!")}
        />
      )}
    </>
  );
}