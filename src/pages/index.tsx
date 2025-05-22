"use client";

import Image from "next/image";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/router";

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

export default function Home() {
  const router = useRouter();
  useEffect(() => {
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
  const handleStarter = () => {
    router.push("/signup?plan=starter");
  };

  const handlePro = () => {
    router.push("/signup?plan=pro");
  };

  return (
    <div
      className={`${geistSans.className} ${geistMono.className} relative flex flex-col min-h-screen items-center text-center bg-white dark:bg-black px-6 py-12 sm:px-12 overflow-hidden scroll-smooth`}
    >
      {/* Navbar */}
      <header className="fixed top-0 left-0 w-full z-50 backdrop-blur bg-white/60 dark:bg-black/30 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
          <span className="font-bold text-lg">ThreadHunt</span>
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

      {/* Floating background logos (parallax effect) */}
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

      <main className="w-full min-h-screen flex items-center justify-center pt-32 px-4 z-10">
        <div className="max-w-2xl w-full text-center space-y-6">
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight">
            Find users with <span>ThreadHunt</span>
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            ThreadHunt is an AI-Driven platform that helps you find real users
            for your product by scanning the web for relevant threads and
            discussions.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
            <Link
              href="#pricing"
              className="rounded-full bg-foreground text-background hover:bg-[#383838] dark:hover:bg-[#ccc] transition-colors font-medium px-6 py-3 text-sm sm:text-base"
            >
              Start now
            </Link>
            <Link
              href="/login"
              className="rounded-full border border-black/[.08] dark:border-white/[.145] hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] transition-colors px-6 py-3 text-sm sm:text-base"
            >
              Already have an account
            </Link>
          </div>
        </div>
      </main>

      {/* Boilerplate sections */}

      <section
        id="features"
        className="w-full min-h-screen h-[calc(100vh-100px)] px-4 z-10 flex items-center justify-center scroll-mt-20"
      >
        <div className="max-w-6xl w-full">
          <h2 className="text-3xl font-semibold mb-12 text-center">Features</h2>

          {/* Feature 1 */}
          <div className="flex flex-col md:flex-row items-center gap-8 mb-16">
            <div className="flex-1">
              <h3 className="text-2xl font-semibold mb-2">
                Discover your competitors in seconds
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                ThreadHunt helps you find products that solve the same problems
                as yours, so you can analyze their positioning, pricing, and
                user engagement across forums and social platforms.
              </p>
            </div>
            <div className="flex-1">
              <img
                src="/images/feature-competitors.png"
                alt="Competitor example"
                className="rounded-lg shadow-md w-full"
              />
            </div>
          </div>

          {/* Feature 2 */}
          <div className="flex flex-col md:flex-row-reverse items-center gap-8">
            <div className="flex-1">
              <h3 className="text-2xl font-semibold mb-2">
                Instantly find thousands of related threads
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                ThreadHunt scans the web for real discussions where people are
                asking questions your product can solve — making it easier to
                connect with your ideal audience where they are already active.
              </p>
            </div>
            <div className="flex-1">
              <img
                src="/images/feature-threads.png"
                alt="Threads example"
                className="rounded-lg shadow-md w-full"
              />
            </div>
          </div>
        </div>
      </section>

      <section
        id="benefits"
        className="w-full h-[calc(100vh-100px)] px-4 z-10 flex items-center justify-center scroll-mt-20"
      >
        <div className="max-w-6xl w-full">
          <h2 className="text-3xl font-semibold mb-12 text-center">Benefits</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-md p-6 text-left">
              <div className="text-3xl mb-4">⏱️</div>
              <h3 className="text-xl font-semibold mb-2">
                Stop wasting time digging through forums
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Instead of scrolling endlessly, let ThreadHunt uncover the exact
                conversations where people are already asking for what you
                offer.
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-md p-6 text-left">
              <div className="text-3xl mb-4">📊</div>
              <h3 className="text-xl font-semibold mb-2">
                Uncover your competition — and rise above it
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Know which tools your audience is already using. Learn from
                their strengths and stand out by solving what they don’t.
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-md p-6 text-left">
              <div className="text-3xl mb-4">✅</div>
              <h3 className="text-xl font-semibold mb-2">
                Validate product demand instantly
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                See how many real people are actively facing the problems you
                solve — no guesswork, just data.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section
        id="how-it-works"
        className="w-full  h-[calc(100vh-100px)] max-w-4xl py-24 px-4 z-10 scroll-mt-20"
      >
        <h2 className="text-3xl font-semibold mb-4">How it Works</h2>
        <p className="text-gray-600 dark:text-gray-400">
          [Fazer um vídeo a explicar o processo]
        </p>
      </section>

      <section
        id="pricing"
        className="w-full min-h-screen h-[calc(100vh-100px)] px-4 z-10 flex items-center justify-center scroll-mt-20"
      >
        <div className="max-w-4xl w-full">
          <h2 className="text-3xl font-semibold mb-12 text-center">Pricing</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
            {/* Starter Plan */}
            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-md p-6 flex flex-col">
              <h3 className="text-xl font-semibold mb-2">Starter</h3>
              <p className="text-2xl font-bold mb-4">
                €0<span className="text-sm font-normal"> /mo</span>
              </p>
              <ul className="text-gray-600 dark:text-gray-400 space-y-2 mb-6">
                <li>✅ Up to 5 hunts per month</li>
                <li>❌ No CSV export</li>
                <li>❌ Limited to 50 opportunities</li>
                <li>✅ Access to core discovery tools</li>
                <li>❌ Competitor insights</li>
              </ul>
              <button
                className="mt-auto bg-black text-white px-4 py-2 rounded hover:bg-gray-800 transition"
                onClick={handleStarter}
              >
                Get Started
              </button>
            </div>

            {/* Pro Plan (highlighted) */}
            <div className="bg-zinc-100 dark:bg-zinc-800 border-2 border-black dark:border-white rounded-xl shadow-lg p-6 flex flex-col transform md:scale-105">
              <h3 className="text-xl font-semibold mb-2">Pro</h3>
              <p className="text-2xl font-bold mb-1">
                €19<span className="text-sm font-normal"> /mo</span>
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                or €99/year
              </p>
              <ul className="text-gray-700 dark:text-gray-300 space-y-2 mb-6">
                <li>✅ Unlimited hunts (fair use)</li>
                <li>✅ Competitor detection</li>
                <li>✅ CSV export</li>
                <li>✅ Email support</li>
              </ul>
              <button
                className="mt-auto bg-black text-white px-4 py-2 rounded hover:bg-gray-800 transition"
                onClick={handlePro}
              >
                Become a Hunter!
              </button>
            </div>
          </div>
        </div>
      </section>

      <footer className="mt-24 text-xs text-gray-400 dark:text-gray-600 z-10">
        &copy; {new Date().getFullYear()} ThreadHunt — by João Damião
      </footer>
    </div>
  );
}
