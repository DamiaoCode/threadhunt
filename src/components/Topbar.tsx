import React from "react";
import { useRouter } from "next/router";

type TopbarProps = {
  userEmail?: string;
  plan?: string;
};

export default function Topbar({ userEmail = "", plan = "Free" }: TopbarProps) {
  const router = useRouter(); // 👈 define o router aqui

  return (
    <header className="w-full px-6 py-4 flex items-center justify-between border-b bg-white shadow-sm">
      <h1
        className="text-lg font-bold tracking-tight cursor-pointer"
        onClick={() => router.push("/dashboard")}
      >
        ThreadHunt
      </h1>
      <div className="flex items-center gap-4">
        <span className="px-3 py-1 text-sm bg-gray-100 border rounded-full text-gray-600">
          {plan}
        </span>
        <span className="text-sm text-gray-700">{userEmail}</span>
      </div>
    </header>
  );
}
