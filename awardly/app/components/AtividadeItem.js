"use client";

import { useRouter } from "next/navigation";
import styles from "@/styles/perfil.module.css";

const icones = { log: "/claquete.png", review: "/escrevendo.png", seguindo: "/pessoa.png", categoria: "/trofeu.png" };

// Destaca palavras entre aspas ou entre ** em amarelo
function TextoDestacado({ texto }) {
  const partes = [];
  const regex = /"([^"]+)"/g;
  let ultimo = 0;
  let match;

  while ((match = regex.exec(texto)) !== null) {
    if (match.index > ultimo) {
      partes.push(<span key={ultimo}>{texto.slice(ultimo, match.index)}</span>);
    }
    partes.push(
      <span key={match.index} style={{ color: "var(--gold)" }}>
        "{match[1]}"
      </span>
    );
    ultimo = match.index + match[0].length;
  }

  if (ultimo < texto.length) {
    partes.push(<span key={ultimo}>{texto.slice(ultimo)}</span>);
  }

  return <>{partes}</>;
}

export default function AtividadeItem({ item }) {
  const router = useRouter();

  function handleClick() {
    if (!item.link) return;
    router.push(item.link);
  }

  return (
    <div
      className={`${styles.atividadeItem} ${item.link ? styles.atividadeItemClicavel : ""}`}
      onClick={handleClick}
    >
      <img src={icones[item.tipo]} alt={item.tipo} className={styles.atividadeIcone} />
      <div className={styles.atividadeInfo}>
        <p className={styles.atividadeTexto}>
          <TextoDestacado texto={item.texto} />
        </p>
        <span className={styles.atividadeData}>{item.data}</span>
      </div>
      {item.link && <span className={styles.atividadeSeta}>→</span>}
    </div>
  );
}