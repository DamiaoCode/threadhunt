import React, { useState } from "react";
import { useRouter } from "next/router";
import supabase from "@/lib/supabase";
import useUserProfile from "@/hooks/useUserProfile";
import UpdateSubscriptionModal from "@/components/UpdateSubscriptionModal";
import PlanOverlay from "@/components/PlanOverlay";

export default function Topbar() {
  const router = useRouter();
  const { userEmail, plan, updatePlan } = useUserProfile();
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showPlanOverlay, setShowPlanOverlay] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const handleOpenStripePortal = async () => {
    setLoading(true);
    try {
      const supabase = (await import("@/lib/supabase")).default;
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData.session;
      if (!session) throw new Error("Not logged in");
      const user = session.user;
      const res = await fetch("/api/create-stripe-portal-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id }),
      });
      const data = await res.json();
      if (data.url) {
        window.open(data.url, "_blank");
      } else {
        alert(data.error || "Failed to open Stripe portal");
      }
    } catch (err: any) {
      alert(err.message || "Unknown error");
    } finally {
      setLoading(false);
    }
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
          onClick={() => setShowUpdateModal(true)}
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
      {showUpdateModal && (
        <UpdateSubscriptionModal
          onClose={() => setShowUpdateModal(false)}
          onOpenStripePortal={async () => {
            setShowUpdateModal(false);
            await handleOpenStripePortal();
          }}
          onOpenPlanOverlay={() => {
            setShowUpdateModal(false);
            setShowPlanOverlay(true);
          }}
          loading={loading}
          plan={plan}
        />
      )}
      {showPlanOverlay && <PlanOverlay />}
    </header>
  );
}
