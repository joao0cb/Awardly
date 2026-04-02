"use client";

import { useState } from "react";
import Parse from "@/lib/Parse";
import { useRouter } from "next/navigation";
import styles from "./cadastro.module.css";
import DarkVeil from "../components/DarkVeil";

export default function Cadastro() {
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [message, setMessage] = useState("");
  const router = useRouter();

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage("");
    try {
      const user = new Parse.User();
      user.set("username", form.username);
      user.set("email", form.email);
      user.set("password", form.password);

      await user.signUp();
      setMessage("Cadastro realizado com sucesso!");
      router.push("/login");
    } catch (error) {
      setMessage(error.message);
    }
  }

  return (
    <div className={styles.page}>
      <DarkVeil hueShift={-160} noiseIntensity={0.02} speed={0.5} warpAmount={1} />

      <div className={styles.container}>
        <h1 className={styles.title}>Cadastro</h1>

        <form onSubmit={handleSubmit} className={styles.form}>
          <input
            name="username"
            placeholder="Usuário"
            value={form.username}
            onChange={handleChange}
          />
          <input
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
          />
          <input
            type="password"
            name="password"
            placeholder="Senha"
            value={form.password}
            onChange={handleChange}
          />
          <button type="submit" className={styles.btnPrimary}>Cadastrar</button>
        </form>

        <p className={styles.message}>{message}</p>

        <button onClick={() => router.push("/login")} className={styles.btnGhost}>
          Já tem conta? Faça login
        </button>
      </div>
    </div>
  );
}