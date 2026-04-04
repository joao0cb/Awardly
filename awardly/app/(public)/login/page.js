"use client";

import { useState } from "react";
import Parse from '@/lib/parseClient';
import { useRouter } from "next/navigation";
import styles from "@/styles/login.module.css";
import DarkVeil from "@/app/components/DarkVeil";

export default function Login() {
  const [form, setForm] = useState({ username: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [lembrar, setLembrar] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [showReset, setShowReset] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage("");
    try {
      const user = await Parse.User.logIn(form.username, form.password);
      const sessionToken = user.getSessionToken();

      document.cookie = `awardly_session=${sessionToken}; path=/`;

      if (lembrar) {
        const expira = new Date();
        expira.setDate(expira.getDate() + 30);
        document.cookie = `awardly_lembrar=true; expires=${expira.toUTCString()}; path=/`;
      } else {
        document.cookie = 'awardly_lembrar=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/';
      }

      setTimeout(() => {
        window.location.href = '/homeLogin';
      }, 200);
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function handleResetPassword() {
    if (!resetEmail) {
      setMessage("Digite seu email para recuperar a senha.");
      return;
    }
    try {
      await Parse.User.requestPasswordReset(resetEmail);
      setMessage("Email de recuperação enviado!");
      setShowReset(false);
      setResetEmail("");
    } catch (error) {
      setMessage(error.message);
    }
  }

  return (
    <div className={styles.page}>
      <DarkVeil hueShift={-160} noiseIntensity={0.02} speed={0.5} warpAmount={1} />

      <div className={styles.container}>
        <h1 className={styles.title}>Login</h1>

        <form onSubmit={handleSubmit} className={styles.form}>
          <input name="username" placeholder="Usuário" value={form.username} onChange={handleChange} />
          <div className={styles.senha}>
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Senha"
              value={form.password}
              onChange={handleChange}
            />
            <button
              type="button"
              className={styles.botaoOlho}
              onClick={() => setShowPassword(!showPassword)}
            >
              <img
                src={showPassword ? "/olho-aberto.png" : "/olho-fechado.png"}
                alt="mostrar senha"
                width={20}
                height={20}
              />
            </button>
          </div>

          <label className={styles.lembrar}>
            <input
              type="checkbox"
              checked={lembrar}
              onChange={(e) => setLembrar(e.target.checked)}
            />
            Lembrar de mim
          </label>

          <button type="submit" className={styles.btnPrimary}>Entrar</button>
        </form>

        <button onClick={() => { setShowReset(!showReset); setMessage(""); }} className={styles.btnSenha}>
          Esqueci minha senha
        </button>

        {showReset && (
          <div className={styles.resetBox}>
            <input
              type="email"
              placeholder="Digite seu email"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              className={styles.resetInput}
            />
            <button onClick={handleResetPassword} className={styles.btnPrimary}>
              Enviar
            </button>
          </div>
        )}

        <p className={styles.message}>{message}</p>

        <button onClick={() => router.push("/cadastro")} className={styles.btnGhost}>
          Não tem conta? Cadastre-se
        </button>
      </div>
    </div>
  );
}