"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import Parse from "@/lib/parseClient";
import TabsPerfil from "../../../components/TabsPerfil";
import styles from "@/styles/perfil.module.css";
import fil from "@/styles/filmesPerfil.module.css";
import { getFilme, getImageURL } from "@/lib/tmdb";
import { useRouter } from "next/navigation";
import RevealSection from '@/app/components/RevealSection';

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

// Card com fade-in animado
function CardFilme({ item, index, router }) {
  const { filme, estatuetas, like, dataAssistido, id } = item;
  return (
    <div
      key={id}
      className={`${styles.cardFilmeAval} ${fil.cardAnimar}`}
      style={{ animationDelay: `${Math.min(index * 40, 400)}ms` }}
      onClick={() => router.push(`/filmes/${filme.id}`)}
    >
      <div className={styles.cardFilmeAvalImg}>
        <img src={getImageURL(filme.poster_path, "w342")} alt={filme.title} />
        {like && (
          <div className={fil.likeBadge}>
            <img src="/envelopecoracao.png" alt="gostei" className={fil.likeBadgeImg} />
          </div>
        )}
      </div>
      <div className={styles.cardFilmeAvalInfo}>
        <p className={styles.cardFilmeAvalTitulo}>{filme.title}</p>
        {estatuetas > 0 && <Estatuetas valor={estatuetas} />}
        {filme.release_date && (
          <span className={styles.cardFilmeAvalAno}>
            {filme.release_date.slice(0, 4)}
          </span>
        )}
      </div>
    </div>
  );
}

export default function PerfilFilmes() {
  const [logs, setLogs] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [usuario, setUsuario] = useState(null);
  const [gradeKey, setGradeKey] = useState(0); // força re-render para reanimar
  const router = useRouter();

  const [ordenacao, setOrdenacao] = useState("recente");
  const [filtroLike, setFiltroLike] = useState(false);
  const [filtroAno, setFiltroAno] = useState("");
  const [filtroGenero, setFiltroGenero] = useState("");
  
  const fotoObj = usuario?.get("foto");
  const foto = (typeof fotoObj?.url === "function" ? fotoObj.url() : fotoObj?._url) || null;
  const bannerObj = usuario?.get("banner");
  const bannerUrl = (typeof bannerObj?.url === "function" ? bannerObj.url() : bannerObj?._url) || null;
  const nome = usuario?.get("nome") || usuario?.get("username") || "";

  // Reinicia animação sempre que filtro muda
  function mudarFiltro(setter, valor) {
    setter(valor);
    setGradeKey((k) => k + 1);
  }

  useEffect(() => {
    async function carregar() {
      const user = Parse.User.current();
      await user.fetch();
      setUsuario(user);
      if (!user) { setCarregando(false); return; }

      try {
        const query = new Parse.Query("Log");
        query.equalTo("usuarioId", user);
        query.descending("dataAssistido");
        query.limit(1000);
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

  // Anos de lançamento disponíveis (do filme, não do log)
  const anosDisponiveis = useMemo(() => {
    const anos = new Set(
      logs
        .filter((l) => l.filme?.release_date)
        .map((l) => l.filme.release_date.slice(0, 4))
    );
    return Array.from(anos).sort((a, b) => b - a);
  }, [logs]);

  // Gêneros disponíveis
  const generosDisponiveis = useMemo(() => {
    const generos = new Set();
    logs.forEach((l) => {
      l.filme?.genres?.forEach((g) => generos.add(g.name));
    });
    return Array.from(generos).sort();
  }, [logs]);

  // Logs filtrados e ordenados
  const logsFiltrados = useMemo(() => {
    let lista = [...logs];

    if (filtroLike) lista = lista.filter((l) => l.like);

    if (filtroAno) {
      lista = lista.filter((l) =>
        l.filme?.release_date?.startsWith(filtroAno)
      );
    }

    if (filtroGenero) {
      lista = lista.filter((l) =>
        l.filme?.genres?.some((g) => g.name === filtroGenero)
      );
    }

    if (ordenacao === "nota_desc") {
      lista.sort((a, b) => b.estatuetas - a.estatuetas);
    } else if (ordenacao === "nota_asc") {
      lista.sort((a, b) => a.estatuetas - b.estatuetas);
    }

    return lista;
  }, [logs, ordenacao, filtroLike, filtroAno, filtroGenero]);

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
        </div>
      </div>
      <TabsPerfil />

      <div className={styles.conteudoFull}>
        <div className={styles.conteudoFullHeader}>
          <h2 className={styles.tituloSecao}>todos os filmes</h2>
          {!carregando && (
            <span className={styles.conteudoCount}>
              {logsFiltrados.length} registro{logsFiltrados.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {/* Barra de filtros */}
        <div className={fil.filtrosBar}>
          <div className={fil.filtrosEsq}>
            <select
              className={fil.select}
              value={ordenacao}
              onChange={(e) => mudarFiltro(setOrdenacao, e.target.value)}
            >
              <option value="recente">mais recentes</option>
              <option value="nota_desc">maior nota</option>
              <option value="nota_asc">menor nota</option>
            </select>

            <select
              className={fil.select}
              value={filtroAno}
              onChange={(e) => mudarFiltro(setFiltroAno, e.target.value)}
            >
              <option value="">todos os anos</option>
              {anosDisponiveis.map((ano) => (
                <option key={ano} value={ano}>{ano}</option>
              ))}
            </select>

            {generosDisponiveis.length > 0 && (
              <select
                className={fil.select}
                value={filtroGenero}
                onChange={(e) => mudarFiltro(setFiltroGenero, e.target.value)}
              >
                <option value="">todos os gêneros</option>
                {generosDisponiveis.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            )}
          </div>

          <button
            className={`${fil.btnLike} ${filtroLike ? fil.btnLikeAtivo : ""}`}
            onClick={() => mudarFiltro(setFiltroLike, (v) => !v)}
          >
            <img
              src="/envelopecoracao.png"
              alt="like"
              className={fil.btnLikeImg}
              style={{ opacity: filtroLike ? 1 : 0.4 }}
            />
            gostei
          </button>
        </div>

        {carregando ? (
          <div className={styles.gradeFilmesAval}>
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className={styles.cardFilmeAvalEsq} />
            ))}
          </div>
        ) : logsFiltrados.length === 0 ? (
          <div className={styles.vazioWrap}>
            <p className={styles.vazio}>Nenhum filme encontrado.</p>
            <p className={styles.vazioDica}>Tente mudar os filtros.</p>
          </div>
        ) : (
          <div key={gradeKey} className={styles.gradeFilmesAval}>
            {logsFiltrados.map((item, index) => (
              <RevealSection key={item.id} delay={Math.min(index * 40, 300)}>
                <CardFilme item={item} index={0} router={router} />
              </RevealSection>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}