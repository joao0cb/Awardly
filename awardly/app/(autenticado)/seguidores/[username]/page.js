"use client";

import { useEffect, useState, Suspense } from "react";
import Parse from "@/lib/parseClient";
import NavbarLogin from "@/app/components/NavbarLogin";
import styles from "@/styles/perfil.module.css";
import pub from "@/styles/perfilPublico.module.css";
import { useRouter, useParams, useSearchParams } from "next/navigation";

function userPointer(userId) {
  const u = new Parse.User();
  u.id = userId;
  return u;
}

function CardUsuario({ usuario, usuarioLogado }) {
  const router = useRouter();
  const [seguindo, setSeguindo] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const ehEuMesmo = usuarioLogado?.id === usuario.objectId;

  useEffect(() => {
    if (!usuarioLogado || ehEuMesmo) return;
    async function verificar() {
      const qFollow = new Parse.Query("Follow");
      qFollow.equalTo("seguidor", usuarioLogado);
      qFollow.equalTo("seguindo", userPointer(usuario.objectId));
      const existe = await qFollow.first();
      setSeguindo(!!existe);
    }
    verificar();
  }, [usuario.objectId]);

  async function handleToggleFollow() {
    if (!usuarioLogado || salvando) return;
    setSalvando(true);
    const alvoPtr = userPointer(usuario.objectId);
    try {
      if (seguindo) {
        const qFollow = new Parse.Query("Follow");
        qFollow.equalTo("seguidor", usuarioLogado);
        qFollow.equalTo("seguindo", alvoPtr);
        const existe = await qFollow.first();
        if (existe) await existe.destroy();
        setSeguindo(false);
      } else {
        const Follow = Parse.Object.extend("Follow");
        const novoFollow = new Follow();
        novoFollow.set("seguidor", usuarioLogado);
        novoFollow.set("seguindo", alvoPtr);
        const acl = new Parse.ACL();
        acl.setPublicReadAccess(true);
        acl.setWriteAccess(usuarioLogado.id, true);
        novoFollow.setACL(acl);
        await novoFollow.save();
        setSeguindo(true);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className={pub.cardUsuario}>
      <div
        className={pub.cardUsuarioInfo}
        onClick={() =>
          ehEuMesmo
            ? router.push("/perfil")
            : router.push(`/perfil/${usuario.username}`)
        }
      >
        <div className={pub.cardUsuarioAvatar}>
          {usuario.foto ? (
            <img src={usuario.foto} alt={usuario.nome} className={pub.cardUsuarioFoto} />
          ) : (
            <div className={pub.cardUsuarioAvatarPlaceholder}>
              {(usuario.nome || usuario.username || "?")[0].toUpperCase()}
            </div>
          )}
        </div>
        <div className={pub.cardUsuarioTexto}>
          <span className={pub.cardUsuarioNome}>{usuario.nome || usuario.username}</span>
          {usuario.username && usuario.nome && (
            <span className={pub.cardUsuarioUsername}>@{usuario.username}</span>
          )}
          {usuario.bio && <span className={pub.cardUsuarioBio}>{usuario.bio}</span>}
        </div>
      </div>
      {usuarioLogado && !ehEuMesmo && (
        <button
          className={seguindo ? pub.btnSeguindo : pub.btnSeguir}
          onClick={handleToggleFollow}
          disabled={salvando}
        >
          {salvando ? "..." : seguindo ? "seguindo" : "seguir"}
        </button>
      )}
    </div>
  );
}

function ConteudoSeguidores() {
  const { username } = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const abaParam = searchParams.get("aba") || "seguidores";

  const [aba, setAba] = useState(abaParam);
  const [nomeAlvo, setNomeAlvo] = useState("");
  const [usuarioLogado, setUsuarioLogado] = useState(null);
  const [lista, setLista] = useState([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    async function carregarUsuarios() {
      setCarregando(true);
      try {
        const logado = Parse.User.current();
        if (logado) {
          await logado.fetch();
          setUsuarioLogado(logado);
        }

        const dados = await Parse.Cloud.run("buscarUsuarioPorUsername", { username });
        const id = dados.objectId; // id local, usado só neste useEffect
        setNomeAlvo(dados?.nome || dados?.username || "Usuário");

        const alvoPtr = userPointer(id);

        const qFollow = new Parse.Query("Follow");
        if (aba === "seguidores") {
          qFollow.equalTo("seguindo", alvoPtr);
          qFollow.include("seguidor");
        } else {
          qFollow.equalTo("seguidor", alvoPtr);
          qFollow.include("seguindo");
        }
        qFollow.descending("createdAt");
        qFollow.limit(100);
        const resultados = await qFollow.find();

        const usuarios = resultados.map((f) => {
          const u = aba === "seguidores" ? f.get("seguidor") : f.get("seguindo");
          return {
            objectId: u?.id,
            nome: u?.get("nome") || "",
            username: u?.get("username") || "",
            bio: u?.get("bio") || "",
            foto: u?.get("foto")?._url || null,
          };
        }).filter((u) => u.objectId);

        setLista(usuarios);
      } catch (e) {
        console.error(e);
      } finally {
        setCarregando(false);
      }
    }
    carregarUsuarios();
  }, [username, aba]);

  function mudarAba(novaAba) {
    setAba(novaAba);
    router.replace(`/seguidores/${username}?aba=${novaAba}`, { scroll: false });
  }

  const nomeLogado = usuarioLogado?.get("nome") || usuarioLogado?.get("username") || "";
  const fotoLogadoObj = usuarioLogado?.get("foto");
  const fotoLogado = (typeof fotoLogadoObj?.url === "function" ? fotoLogadoObj.url() : fotoLogadoObj?._url) || null;

  return (
    <main className={styles.principal}>
      <NavbarLogin usuario={{ nome: nomeLogado, foto: fotoLogado }} />

      <div className={pub.paginaSeguidores}>
        <div className={pub.cabecalhoSeguidores}>
          <button
            className={pub.btnVoltarSeg}
            onClick={() =>
              usuarioLogado?.get("username") === username
                ? router.push("/perfil")
                : router.push(`/perfil/${username}`)
            }
          >
            ← voltar
          </button>
          <h1 className={pub.tituloSeguidores}>{nomeAlvo}</h1>
        </div>

        <div className={pub.abasSeguidores}>
          <button
            className={`${pub.abaSeg} ${aba === "seguidores" ? pub.abaSegAtiva : ""}`}
            onClick={() => mudarAba("seguidores")}
          >
            seguidores
          </button>
          <button
            className={`${pub.abaSeg} ${aba === "seguindo" ? pub.abaSegAtiva : ""}`}
            onClick={() => mudarAba("seguindo")}
          >
            seguindo
          </button>
        </div>

        <div className={pub.listaUsuarios}>
          {carregando && <p className={styles.vazio}>carregando...</p>}
          {!carregando && lista.length === 0 && (
            <p className={styles.vazio}>
              {aba === "seguidores" ? "Nenhum seguidor ainda." : "Não está seguindo ninguém ainda."}
            </p>
          )}
          {!carregando && lista.map((u) => (
            <CardUsuario key={u.objectId} usuario={u} usuarioLogado={usuarioLogado} />
          ))}
        </div>
      </div>
    </main>
  );
}

export default function PaginaSeguidores() {
  return (
    <Suspense>
      <ConteudoSeguidores />
    </Suspense>
  );
}