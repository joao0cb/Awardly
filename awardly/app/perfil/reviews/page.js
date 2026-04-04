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

export default function PerfilReviews() {
  const [reviews, setReviews] = useState([]);
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
        query.exists("review");
        query.descending("createdAt");
        const resultados = await query.find();

        const comDetalhes = await Promise.allSettled(
          resultados.map(async (r) => {
            const filme = await getFilme(r.get("filmeId"));
            return {
              filme,
              estatuetas: r.get("estatuetas") || 0,
              like: r.get("like") || false,
              review: r.get("review"),
              dataAssistido: r.get("dataAssistido"),
              data: r.createdAt?.toLocaleDateString("pt-BR"),
              id: r.id,
            };
          })
        );

        setReviews(
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
          <h2 className={styles.tituloSecao}>todas as reviews</h2>
          {!carregando && <span className={styles.conteudoCount}>{reviews.length} reviews</span>}
        </div>

        {carregando ? (
          <div className={styles.listaReviews}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className={styles.reviewCardEsq} />
            ))}
          </div>
        ) : reviews.length === 0 ? (
          <div className={styles.vazioWrap}>
            <p className={styles.vazio}>Você ainda não escreveu nenhuma review.</p>
            <p className={styles.vazioDica}>Ao registrar um filme, adicione um texto de review.</p>
          </div>
        ) : (
          <div className={styles.listaReviews}>
            {reviews.map(({ filme, estatuetas, like, review, data, id }) => (
              <div key={id} className={styles.reviewCard}>
                <img
                  src={getImageURL(filme.poster_path, "w185")}
                  alt={filme.title}
                  className={styles.reviewPoster}
                />
                <div className={styles.reviewBody}>
                  <div className={styles.reviewHeader}>
                    <span className={styles.reviewFilme}>{filme.title}</span>
                    <div className={styles.reviewAcoes}>
                      {like && (
                        <img src="/envelopecoracao.png" className={styles.reviewEnvelope} alt="gostei" />
                      )}
                    </div>
                  </div>
                  {estatuetas > 0 && <Estatuetas valor={estatuetas} />}
                  <p className={styles.reviewTexto}>{review}</p>
                  <span className={styles.reviewData}>{data}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}