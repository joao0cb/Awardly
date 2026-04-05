"use client";

import { useRouter } from "next/navigation";
import styles from "@/styles/perfil.module.css";

const icones = { log: "🎬", review: "✍️", seguindo: "👤", categoria: "🏆" };

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
      <span className={styles.atividadeIcone}>{icones[item.tipo]}</span>
      <div className={styles.atividadeInfo}>
        <p className={styles.atividadeTexto}>{item.texto}</p>
        <span className={styles.atividadeData}>{item.data}</span>
      </div>
      {item.link && <span className={styles.atividadeSeta}>→</span>}
    </div>
  );
}