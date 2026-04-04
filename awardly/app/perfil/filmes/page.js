"use client";

import { useEffect, useState } from "react";
import Parse from "@/lib/parseClient";
import NavbarLogin from "../../components/NavbarLogin";
import TabsPerfil from "../../components/TabsPerfil";
import styles from "@/styles/perfil.module.css";
import { getFilme, getImageURL } from "@/lib/tmdb";
import { useRouter } from "next/navigation";

function Estatuetas({ valor }) {
  return (
    <div className={styles.estatuetasRow}>
      {[1, 2, 3, 4, 5].map((i) => {
        const cheia = valor >= i;
        const meia = !cheia && valor >= i - 0.5;
        return (
          <div key={i} className={styles.estatuetaMiniSlot}>
            {cheia ? (
              <img src="/oscar2.png" className={styles.estatuetaMini} />
            ) : meia ? (
              <div style={{ position: "relative", width: 16, height: 16 }}>
                <img src="/oscar2.png" className={styles.estatuetaMini} style={{ clipPath: "inset(0 50% 0 0)", position: "absolute" }} />
                <img src="/oscarvazio.png" className={styles.estatuetaMini} style={{ clipPath: "inset(0 0 0 50%)", position: "absolute", opacity: 0.3 }} />
              </div>
            ) : (
              <img src="/oscarvazio.png" className={styles.estatuetaMini} style={{ opacity: 0.3 }} />
            )}
          </div>
        );
      })}
      {valor > 0 && <span className={styles.estatuetaMiniValor}>{valor}</span>}
    </div>
  );
}

export default function PerfilFilmes() {
  const [logs, setLogs] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [usuario, setUsuario] = useState(null);
  const router = useRouter();

  useEffect(() => {
    async function carregar() {
      const user = Parse.User.current();
      setUsuario(user);
      if (!user) { setCarregando(false); return; }

      try {
        const query = new Parse.Query("Log");
        query.equalTo("usuarioId", user);
        query.descending("dataAssistido");
        const resultados = await query.find();

        const comDetalhes = await Promise.allSettled(
          resultados.map(async (r) => {
            const filme = await getFilme(r.get("filmeId"));
            return {
              filme,
              estatuetas: r.get("estatuetas") || 0,
              like: r.get("like") || false,
              dataAssistido: r.get("dataAssistido"),
              id: r.id,
            };
          })
        );

        setLogs(
          comDetalhes
            .filter((r) => r.status === "fulfilled" && r.value.filme)
            .map((r) => r.value)
        );
      } catch (e) {
        console.error(e);
      } finally {
        setCarregando(false);
      }
    }
    carregar();
  }, []);

  const nome = usuario?.get("nome") || usuario?.get("username") || "Usuário";
  const foto = usuario?.get("foto")?._url || null;

  return (
    <main className={styles.principal}>
      <NavbarLogin usuario={{ nome, foto }} />

      <div className={styles.bannerWrap}>
        <div className={styles.banner} />
        <div className={styles.headerPerfil}>
          <div className={styles.avatarWrap}>
            {foto ? (
              <img src={foto} alt={nome} className={styles.avatar} />
            ) : (
              <div className={styles.avatarPlaceholder}>{nome[0]?.toUpperCase()}</div>
            )}
          </div>
          <div className={styles.headerInfo}>
            <h1 className={styles.nomeUsuario}>{nome}</h1>
          </div>
          <button className={styles.btnEditar} onClick={() => router.push("/editarPerfil")}>
            Editar perfil
          </button>
        </div>
      </div>

      <TabsPerfil />

      <div className={styles.conteudoFull}>
        <div className={styles.conteudoFullHeader}>
          <h2 className={styles.tituloSecao}>todos os filmes</h2>
          {!carregando && <span className={styles.conteudoCount}>{logs.length} registros</span>}
        </div>

        {carregando ? (
          <div className={styles.gradeFilmesAval}>
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className={styles.cardFilmeAvalEsq} />
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className={styles.vazioWrap}>
            <p className={styles.vazio}>Você ainda não registrou nenhum filme.</p>
            <p className={styles.vazioDica}>Use o botão "+ log" na navbar para começar.</p>
          </div>
        ) : (
          <div className={styles.gradeFilmesAval}>
            {logs.map(({ filme, estatuetas, like, dataAssistido, id }) => (
              <div key={id} className={styles.cardFilmeAval}>
                <div className={styles.cardFilmeAvalImg}>
                  <img
                    src={getImageURL(filme.poster_path, "w342")}
                    alt={filme.title}
                  />
                  {like && (
                    <img src="/envelopecoracao.png" className={styles.cardFilmeLike} alt="gostei" />
                  )}
                </div>
                <div className={styles.cardFilmeAvalInfo}>
                  <p className={styles.cardFilmeAvalTitulo}>{filme.title}</p>
                  {estatuetas > 0 && <Estatuetas valor={estatuetas} />}
                  {dataAssistido && (
                    <span className={styles.cardFilmeAvalAno}>
                      {new Date(dataAssistido).toLocaleDateString("pt-BR", { month: "short", year: "numeric" })}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}