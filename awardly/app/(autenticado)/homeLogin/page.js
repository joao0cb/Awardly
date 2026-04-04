"use client";
import { useEffect, useState } from "react";
import { getFilme, getImageURL } from "@/lib/tmdb";
import NavbarLogin from "../../components/NavbarLogin";
import styles from "@/styles/homeLogin.module.css";

const INDICADOS_2026 = [
  { id: 1054867, vencedor: true },
  { id: 1220564,  vencedor: false },    
  { id: 701387, vencedor: false },
  { id: 911430, vencedor: false },
  { id: 1062722,  vencedor: false },
  { id: 1241983,  vencedor: false },
  { id: 1233413,  vencedor: false },
  { id: 858024,  vencedor: false },
  { id: 1317288, vencedor: false },
  { id: 1124566 , vencedor: false },
];

const INDICADOS_2025 = [
  { id: 1064213,  vencedor: true },
  { id: 549509, vencedor: false },
  { id: 661539,  vencedor: false },
  { id: 974576, vencedor: false },
  { id: 693134,  vencedor: false },
  { id: 1000837,  vencedor: false },
  { id: 1028196,  vencedor: false },
  { id: 933260,  vencedor: false },
  { id: 402431, vencedor: false },
  { id: 974950, vencedor: false },
];

function CardFilme({ filme, vencedor, indice }) {
  return (
    <div
      className={`${styles.cardFilme} ${vencedor ? styles.cardFilmeVencedor : ""}`}
      style={{ animationDelay: `${indice * 0.06}s` }}
    >
      {filme.poster_path ? (
        <img
          src={getImageURL(filme.poster_path, "w500")}
          alt={filme.title}
          className={styles.posterFilme}   
          loading={indice < 5 ? "eager" : "lazy"}
        />
      ) : (
        <div className={styles.esqueleto} />
      )}
 
      {vencedor && (
        <div className={styles.wrapperOscar}>
          <span className={styles.textoVencedor}>VENCEDOR</span>
          <img
            src="/oscar2.png"
            alt="Vencedor"
            className={styles.iconeOscar}
          />
        </div>
      )}
 
      <div className={styles.sobreposicaoFilme}>
        <p className={styles.tituloFilme}>{filme.title}</p>
        <span className={styles.anoFilme}>
          {filme.release_date?.slice(0, 4)}
        </span>
      </div>
    </div>
  );
}

function CardEsqueleto({ indice }) {
  return (
    <div
      className={styles.cardFilme}
      style={{ animationDelay: `${indice * 0.06}s` }}
    >
      <div className={styles.esqueleto} />
    </div>
  );
}

function SecaoFilmes({ ano, indicados }) {
  const [filmes, setFilmes] = useState([]);
  const [carregando, setCarregando] = useState(true);
 
  useEffect(() => {
    async function buscarTodos() {
      try {
        const resultados = await Promise.allSettled(
          indicados.map((n) => getFilme(n.id))
        );
        const dados = resultados.map((r, i) => ({
          filme: r.status === "fulfilled" ? r.value : null,
          vencedor: indicados[i].vencedor,
        }));
        setFilmes(dados);
      } catch (erro) {
        console.error("Erro ao buscar filmes:", erro);
      } finally {
        setCarregando(false);
      }
    }
 
    buscarTodos();
  }, [indicados]);
 
  return (
    <section className={styles.secao}>
      <div className={styles.cabecalhoSecao}>
        <p className={styles.anoSecao}>oscar {ano}</p>
        <h2 className={styles.tituloSecao}>indicados a melhor filme</h2>
      </div>
 
      <div className={styles.gradeFilmes}>
        {carregando
          ? indicados.map((_, i) => <CardEsqueleto key={i} indice={i} />)
          : filmes.map(({ filme, vencedor }, i) =>
              filme ? (
                <CardFilme
                  key={filme.id}
                  filme={filme}
                  vencedor={vencedor}
                  indice={i}
                />
              ) : (
                <CardEsqueleto key={i} indice={i} />
              )
            )}
      </div>
    </section>
  );
}

export default function HomeLogin() {
  return (
    <main className={styles.principal}>
      <NavbarLogin usuario={{ nome: "João", foto: null }} />
      <div className={styles.conteudo}>   
        <SecaoFilmes ano={2026} indicados={INDICADOS_2026} />
        <div className={styles.divisor} />
        <SecaoFilmes ano={2025} indicados={INDICADOS_2025} />
      </div>
    </main>
  );
}