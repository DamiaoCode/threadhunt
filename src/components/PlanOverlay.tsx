// components/PlanOverlay.tsx
import { useState } from "react";
import { useRouter } from "next/router";
import useUserProfile from "@/hooks/useUserProfile";

const MONTHLY_PRICE_ID = process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY_ID;
const YEARLY_PRICE_ID = process.env.NEXT_PUBLIC_STRIPE_PRO_YEARLY_ID;

export default function PlanOverlay() {
  const router = useRouter();
  const { userEmail, loading, plan, updatePlan } = useUserProfile();
  const [proLoading, setProLoading] = useState(false);
  const [starterLoading, setStarterLoading] = useState(false);
  const [error, setError] = useState("");
  const [billingInterval, setBillingInterval] = useState<"month" | "year">(
    "month"
  );
  const [show, setShow] = useState(true);

  const handleStarter = async () => {
    setStarterLoading(true);
    setError("");
    try {
      await updatePlan("Starter");
      // Optionally, you can redirect or close the overlay here
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Failed to update plan.");
    } finally {
      setStarterLoading(false);
    }
  };

  const handlePro = async () => {
    setProLoading(true);
    setError("");
    try {
      // Get user session from supabase client
      const supabase = (await import("@/lib/supabase")).default;
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData.session;
      if (!session) {
        setError("You must be logged in.");
        setProLoading(false);
        return;
      }
      const user = session.user;
      const priceId =
        billingInterval === "year" ? YEARLY_PRICE_ID : MONTHLY_PRICE_ID;
      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          email: user.email,
          price_id: priceId,
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || "Failed to start checkout.");
        setProLoading(false);
      }
    } catch (err: any) {
      setError(err.message || "Unknown error");
      setProLoading(false);
    }
  };

  // Helper to determine if plan is current
  const isCurrentPlan = (planName: string) => {
    if (!plan) return false;
    return plan.toLowerCase() === planName.toLowerCase();
  };

  // Show close icon if plan is not pending
  const canClose = plan === "Starter" || plan === "Pro";

  if (!show) return null;

  return (
    <div className="absolute inset-0 bg-white/95 backdrop-blur-lg z-50 flex items-center justify-center">
      <div className="max-w-4xl w-full p-6 relative">
        {canClose && (
          <button
            className="absolute top-4 right-4 text-2xl text-gray-400 hover:text-black focus:outline-none"
            aria-label="Close"
            onClick={() => setShow(false)}
          >
            &times;
          </button>
        )}
        <h2 className="text-3xl font-semibold mb-12 text-center">
          Choose a Plan
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
          {/* Starter Plan */}
          <div className="bg-white rounded-xl shadow-md p-6 flex flex-col">
            <h3 className="text-xl font-semibold mb-2">Starter</h3>
            <p className="text-2xl font-bold mb-4">
              €0<span className="text-sm font-normal"> /mo</span>
            </p>
            <ul className="text-gray-600 space-y-2 mb-6">
              <li>✅ Up to 5 hunts per month</li>
              <li>❌ No CSV export</li>
              <li>❌ Limited to 50 opportunities</li>
              <li>✅ Access to core discovery tools</li>
              <li>❌ Competitor insights</li>
            </ul>
            <button
              className="mt-auto bg-black text-white px-4 py-2 rounded hover:bg-gray-800 transition disabled:opacity-60"
              onClick={handleStarter}
              disabled={
                starterLoading || proLoading || loading || plan === "Starter"
              }
            >
              {plan === "Starter"
                ? "Current Plan"
                : starterLoading
                ? "Loading..."
                : "Get Started"}
            </button>
          </div>

          {/* Pro Plan */}
          <div className="bg-zinc-100 border-2 border-black rounded-xl shadow-lg p-6 flex flex-col transform md:scale-105">
            <h3 className="text-xl font-semibold mb-2">Pro</h3>
            {billingInterval === "year" ? (
              <>
                <p className="text-2xl font-bold mb-1">
                  €199<span className="text-sm font-normal"> /year</span>
                </p>
                <p className="text-sm text-gray-500 mb-4">or €19/mo</p>
              </>
            ) : (
              <>
                <p className="text-2xl font-bold mb-1">
                  €19<span className="text-sm font-normal"> /mo</span>
                </p>
                <p className="text-sm text-gray-500 mb-4">or €199/year</p>
              </>
            )}
            <div className="flex gap-2 mb-4">
              <button
                className={`px-3 py-1 rounded-full border ${
                  billingInterval === "month"
                    ? "bg-black text-white"
                    : "bg-white text-black"
                }`}
                onClick={() => setBillingInterval("month")}
                disabled={proLoading}
              >
                Monthly
              </button>
              <button
                className={`px-3 py-1 rounded-full border ${
                  billingInterval === "year"
                    ? "bg-black text-white"
                    : "bg-white text-black"
                }`}
                onClick={() => setBillingInterval("year")}
                disabled={proLoading}
              >
                Yearly
              </button>
            </div>
            <ul className="text-gray-700 space-y-2 mb-6">
              <li>✅ Unlimited hunts (fair use)</li>
              <li>✅ Competitor detection</li>
              <li>✅ CSV export</li>
              <li>✅ Email support</li>
            </ul>
            <button
              className="mt-auto bg-black text-white px-4 py-2 rounded hover:bg-gray-800 transition disabled:opacity-60"
              onClick={handlePro}
              disabled={
                proLoading || starterLoading || loading || plan === "Pro"
              }
            >
              {plan === "Pro"
                ? "Current Plan"
                : proLoading
                ? "Redirecting..."
                : billingInterval === "year"
                ? "Upgrade Yearly"
                : "Upgrade Monthly"}
            </button>
            {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
