"use client";

import { useState } from "react";
import Parse from "@/lib/Parse";
import { useRouter } from "next/navigation";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const router = useRouter();
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
  });

  const [message, setMessage] = useState("");

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage("");

    try {
      if (isLogin) {
        // LOGIN
        await Parse.User.logIn(form.username, form.password);
        setMessage("Login realizado com sucesso!");
        router.push("/menu");
      } else {
        // CADASTRO
        const user = new Parse.User();
        user.set("username", form.username);
        user.set("email", form.email);
        user.set("password", form.password);

        await user.signUp();
        setMessage("Cadastro realizado com sucesso!");
      }
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function handleResetPassword() {
    if (!form.email) {
      setMessage("Digite seu email para recuperar a senha.");
      return;
    }

    try {
      await Parse.User.requestPasswordReset(form.email);
      setMessage("Email de recuperação enviado!");
    } catch (error) {
      setMessage(error.message);
    }
  }

  return (
    <div className="container">
      <h1>{isLogin ? "Login" : "Cadastro"}</h1>

      <form onSubmit={handleSubmit} className="form">
        <input
          name="username"
          placeholder="Usuário"
          value={form.username}
          onChange={handleChange}
        />

        {!isLogin && (
          <input
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
          />
        )}

        <input
          type="password"
          name="password"
          placeholder="Senha"
          value={form.password}
          onChange={handleChange}
        />

        <button type="submit">
          {isLogin ? "Entrar" : "Cadastrar"}
        </button>
      </form>

      {isLogin && (
        <button onClick={handleResetPassword}>
          Esqueci minha senha
        </button>
      )}

      <p>{message}</p>

      <button onClick={() => setIsLogin(!isLogin)}>
        {isLogin
          ? "Não tem conta? Cadastre-se"
          : "Já tem conta? Faça login"}
      </button>
    </div>
  );
}