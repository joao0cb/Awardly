"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import styles from "@/styles/navbar.module.css";
import ModalLog from "./ModalLog";

export default function NavbarLogin({ usuario }) {
  const router = useRouter();
  const [pesquisaAberta, setPesquisaAberta] = useState(false);
  const [termoPesquisa, setTermoPesquisa] = useState("");
  const [modalLogAberto, setModalLogAberto] = useState(false);
  const inputRef = useRef(null);

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

  return (
    <>
      <nav className={styles.navbar}>
        <div className={styles.navbarInterna}>
          <div className={styles.logo} onClick={() => router.push("/homeLogin")}>
            <img src="/oscar.png" alt="Oscar" className={styles.logoImg} />
            <span className={styles.logoNome}>Awardly</span>
          </div>

          <div className={styles.direita}>
            <button className={styles.linkNav} onClick={() => router.push("/filmes")}>
              filmes
            </button>
            <button className={styles.linkNav} onClick={() => router.push("/categorias")}>
              categorias
            </button>

            <button className={styles.btnLog} onClick={() => setModalLogAberto(true)}>
              + log
            </button>

            <div className={styles.pesquisaWrapper}>
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

            <button className={styles.perfil} onClick={() => router.push("/perfil")}>
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