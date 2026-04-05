"use client";

import { useEffect, useState } from "react";
import Parse from "@/lib/parseClient";
import TabsPerfil from "@/app/components/TabsPerfil";
import CardLogCategoria from "@/app/components/CardLogCategoria";
import AtividadeItem from "@/app/components/AtividadeItem";
import styles from "@/styles/perfil.module.css";
import { useRouter } from "next/navigation";
import pub from "@/styles/perfilPublico.module.css";

function tempoRelativo(date) {
  if (!date) return "";
  const diff = Date.now() - new Date(date).getTime();
  const min = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  const sem = Math.floor(d / 7);
  if (min < 60) return `${min} min atrás`;
  if (h < 24) return `${h}h atrás`;
  if (d < 7) return `${d} dia${d > 1 ? "s" : ""} atrás`;
  return `${sem} semana${sem > 1 ? "s" : ""} atrás`;
}

function CardCategoria({ log }) {
  return (
    <div className={styles.cardLogCategoria}>
      <div className={styles.cardLogCatHeader}>
        <span className={styles.cardLogCatCategoria}>{log.categoria}</span>
        <span className={styles.cardLogCatAno}>{log.ano}</span>
      </div>
      <div className={styles.cardLogCatBody}>
        {log.vencedorReal && (
          <div className={styles.cardLogCatLinha}>
            <span className={styles.cardLogCatLabel}>venceu</span>
            <span className={styles.cardLogCatValor}>{log.vencedorReal}</span>
          </div>
        )}
        {log.deveriaTerGanhado && (
          <div className={styles.cardLogCatLinha}>
            <span className={styles.cardLogCatLabel}>deveria ter ganhado</span>
            <span className={styles.cardLogCatValor}>{log.deveriaTerGanhado}</span>
          </div>
        )}
        {log.queriaQueGanhasse && (
          <div className={styles.cardLogCatLinha}>
            <span className={styles.cardLogCatLabel}>queria que ganhasse</span>
            <span className={styles.cardLogCatValor}>{log.queriaQueGanhasse}</span>
          </div>
        )}
        {log.review && (
          <p className={styles.cardLogCatReview}>{log.review}</p>
        )}
      </div>
      <span className={styles.cardLogCatData}>{log.data}</span>
    </div>
  );
}

export default function PerfilCategorias() {
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
        const query = new Parse.Query("LogCategoria");
        query.equalTo("usuarioId", user);
        query.descending("createdAt");
        query.limit(100);
        const resultados = await query.find();
        setLogs(resultados.map((l) => ({
          id: l.id,
          categoria: l.get("categoria"),
          ano: l.get("ano"),
          vencedorReal: l.get("vencedorReal"),
          deveriaTerGanhado: l.get("deveriaTerGanhado"),
          queriaQueGanhasse: l.get("queriaQueGanhasse"),
          review: l.get("review"),
          data: tempoRelativo(l.createdAt),
        })));
      } catch (e) {
        console.error(e);
      } finally {
        setCarregando(false);
      }
    }
    carregar();
  }, []);

  const nome = usuario?.get("nome") || usuario?.get("username") || "Usuário";
  const fotoObj = usuario?.get("foto");
  const foto = (typeof fotoObj?.url === "function" ? fotoObj.url() : fotoObj?._url) || null;
  const bannerObj = usuario?.get("banner");
  const bannerUrl = (typeof bannerObj?.url === "function" ? bannerObj.url() : bannerObj?._url) || null;

  return (
    <main className={styles.principal}>
      <div className={styles.bannerWrap}>
        {bannerUrl ? (
          <img src={bannerUrl} alt="Banner" className={styles.bannerImg} />
        ) : (
          <div className={styles.banner} />
        )}
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
          <h2 className={styles.tituloSecao}>categorias avaliadas</h2>
          {!carregando && <span className={styles.conteudoCount}>{logs.length} avaliações</span>}
        </div>

        {carregando ? (
          <div className={styles.listaLogsCat}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className={styles.reviewCardEsq} />
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className={styles.vazioWrap}>
            <p className={styles.vazio}>Você ainda não avaliou nenhuma categoria.</p>
            <p className={styles.vazioDica}>Acesse a página de categorias para começar.</p>
          </div>
        ) : (
          <div className={styles.listaLogsCat}>
            {logs.map((l) => (
              <CardCategoria key={l.id} log={l} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}