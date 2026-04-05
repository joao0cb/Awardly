"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "@/styles/perfil.module.css";

const TABS = [
  { label: "Perfil", href: "/perfil" },
  { label: "Filmes", href: "/perfil/filmes" },
  { label: "Categorias", href: "/perfil/categorias" },
  { label: "Reviews", href: "/perfil/reviews" },
  { label: "Watchlist", href: "/perfil/watchlist" },
];

export default function TabsPerfil() {
  const pathname = usePathname();

  return (
    <nav className={styles.tabs}>
      {TABS.map((tab) => {
        const ativa = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`${styles.tab} ${ativa ? styles.tabAtiva : ""}`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}