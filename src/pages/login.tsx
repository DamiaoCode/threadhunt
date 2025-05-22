// pages/login.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import supabase from "@/lib/supabase";
import Image from "next/image";
import { Geist, Geist_Mono } from "next/font/google";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const floatingLogos = [
  {
    src: "/images/reddit-logo.png",
    style: "top-[20%] left-[25%] rotate-340 w-50",
  },
  {
    src: "/images/stackoverflow-logo.png",
    style: "top-[30%] right-[30%] w-30 rotate-40",
  },
  {
    src: "/images/twitter-logo.png",
    style: "bottom-[20%] left-[30%] rotate-15 w-30",
  },
  {
    src: "/images/quora-logo.png",
    style: "bottom-[25%] right-[35%] w-20 rotate-40",
  },
];

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        router.push("/dashboard");
      }
    };
    checkSession();

    const handleNavClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest(
        "a[href^='#']"
      ) as HTMLAnchorElement | null;
      if (anchor) {
        const id = anchor.getAttribute("href")!.slice(1);
        const el = document.getElementById(id);
        if (el) {
          e.preventDefault();
          const header = document.querySelector("header");
          const headerHeight = header
            ? (header as HTMLElement).offsetHeight
            : 0;
          const y =
            el.getBoundingClientRect().top + window.scrollY - headerHeight - 8;
          window.scrollTo({ top: y, behavior: "smooth" });
        }
      }
    };
    document.addEventListener("click", handleNavClick);
    return () => document.removeEventListener("click", handleNavClick);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMsg(error.message);
    } else {
      router.push("/dashboard");
    }

    setLoading(false);
  };

  return (
    <div
      className={`${geistSans.className} ${geistMono.className} relative flex flex-col min-h-screen items-center text-center bg-white dark:bg-black px-6 py-12 sm:px-12 overflow-hidden scroll-smooth`}
    >
      <header className="fixed top-0 left-0 w-full z-50 backdrop-blur bg-white/60 dark:bg-black/30 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
          <h1
            className="text-lg font-bold tracking-tight cursor-pointer"
            onClick={() => router.push("/")}
          >
            ThreadHunt
          </h1>
          <nav className="space-x-6 text-sm sm:text-base">
            <a href="#features" className="hover:underline">
              Features
            </a>
            <a href="#benefits" className="hover:underline">
              Benefits
            </a>
            <a href="#how-it-works" className="hover:underline">
              How it Works
            </a>
            <a href="#pricing" className="hover:underline">
              Pricing
            </a>
          </nav>
        </div>
      </header>

      <div className="fixed top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        {floatingLogos.map((logo, i) => (
          <Image
            key={i}
            src={logo.src}
            alt="bg-logo"
            width={64}
            height={64}
            className={`absolute opacity-10 animate-float-slow ${logo.style}`}
          />
        ))}
      </div>

      <main className="w-full h-[calc(100vh-100px)] flex flex-col pt-16 px-4 z-10">
        <div className="flex-grow flex items-center justify-center">
          <form
            onSubmit={handleLogin}
            className="w-full max-w-sm max-h-[calc(100vh-100px)] bg-white shadow-md rounded p-6 space-y-4 border"
          >
            <h1 className="text-xl font-semibold text-center">Login</h1>
            <input
              type="email"
              placeholder="Email"
              className="w-full px-4 py-2 border rounded"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              className="w-full px-4 py-2 border rounded"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {errorMsg && (
              <p className="text-red-600 text-sm text-center">{errorMsg}</p>
            )}
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
              disabled={loading}
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>
            <p className="text-sm text-center text-gray-500">
              Não tens conta?{" "}
              <a href="/signup" className="text-green-600 hover:underline">
                Criar conta
              </a>
            </p>
          </form>
        </div>
        <footer className="text-xs text-gray-400 dark:text-gray-600 z-10 text-center pb-4">
          &copy; {new Date().getFullYear()} ThreadHunt — by João Damião
        </footer>
      </main>
    </div>
  );
}
