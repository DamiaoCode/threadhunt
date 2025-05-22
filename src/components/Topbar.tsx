import React from "react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import supabase from "@/lib/supabase";
import useUserProfile from "@/hooks/useUserProfile";
import PlanOverlay from "@/components/PlanOverlay";

export default function Topbar() {
  const router = useRouter();
  const { userEmail, plan, updatePlan } = useUserProfile();
  const [showPlanOverlay, setShowPlanOverlay] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const handleUpgradeToStarter = async () => {
    await updatePlan("Starter");
  };

  return (
    <header className="w-full px-6 py-4 flex items-center justify-between border-b bg-white shadow-sm">
      <h1
        className="text-lg font-bold tracking-tight cursor-pointer"
        onClick={() => router.push("/dashboard")}
      >
        ThreadHunt
      </h1>
      <div className="flex items-center gap-4">
        <button
          onClick={handleUpgradeToStarter}
          className="px-3 py-1 text-sm bg-gray-100 border rounded-full text-gray-600 hover:bg-gray-200 transition"
        >
          {plan}
        </button>
        <span className="text-sm text-gray-700">{userEmail}</span>
        <button
          onClick={handleLogout}
          className="text-sm text-red-600 hover:underline"
        >
          Sign Out
        </button>
      </div>
      {showPlanOverlay && (
        <div className="fixed inset-0 z-50">
          <PlanOverlay
            onStarter={async () => {
              const normalizedPlan = plan?.toLowerCase();

              if (normalizedPlan === "starter") {
                // ⚡ Já é Starter — apenas fechar overlay
                setShowPlanOverlay(false);
                return;
              }

              await supabase
                .from("profiles")
                .update({ plan: "Starter" })
                .eq("user_id", user.id);

              setPlan("Starter");
              setShowPlanOverlay(false);
            }}
            onPro={async () => {
              const normalizedPlan = plan?.toLowerCase();

              if (normalizedPlan === "pro") {
                // ⚡ Já é Pro — apenas fechar overlay
                setShowPlanOverlay(false);
                return;
              }

              await supabase
                .from("profiles")
                .update({ plan: "Pro" })
                .eq("user_id", user.id);

              setPlan("Pro");
              setShowPlanOverlay(false);
            }}
          />
        </div>
      )}
    </header>
  );
}
