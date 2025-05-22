import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import supabase from "@/lib/supabase";
import ProjectList from "../components/ProjectList";
import Topbar from "../components/Topbar";

type Profile = {
  user_id: string;
  email: string;
  plan: string;
};

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Buscar o utilizador autenticado
  useEffect(() => {
    const fetchUser = async () => {
      const { data, error } = await supabase.auth.getUser();

      if (error || !data.user) {
        router.push("/login");
        return;
      }

      setUser(data.user);
    };

    fetchUser();
  }, [router]);

  // Buscar o perfil na tabela profiles
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (!error && data) setProfile(data);
      setLoading(false);
    };

    fetchProfile();
  }, [user]);

  const handleStarter = async () => {
    if (!user) return;
    await supabase
      .from("profiles")
      .update({ plan: "starter" })
      .eq("user_id", user.id);
    setProfile((prev) => prev && { ...prev, plan: "Starter" });
  };

  const handlePro = async () => {
    if (!user) return;
    await supabase
      .from("profiles")
      .update({ plan: "pro" })
      .eq("user_id", user.id);
    setProfile((prev) => prev && { ...prev, plan: "Pro" });
  };

  if (loading) return <p>Loading...</p>;
  if (!user || !profile) return null;

  return (
    <div className="min-h-screen bg-gray-50 relative">
      <Topbar userEmail={user.email} plan={profile.plan} />

      <main className="p-6 max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold">Your Projects</h2>
          <button
            className="bg-black text-white px-4 py-2 rounded-full hover:bg-gray-800 transition"
            onClick={() => router.push("/hunt")}
          >
            Hunt For New Product
          </button>
        </div>
        <ProjectList user={user} />
      </main>

      {/* Overlay modal for pricing if plan is pending */}
      {profile.plan === "pending" && (
        <div className="absolute inset-0 bg-white/95 backdrop-blur-lg z-50 flex items-center justify-center">
          <div className="max-w-4xl w-full p-6">
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
                  className="mt-auto bg-black text-white px-4 py-2 rounded hover:bg-gray-800 transition"
                  onClick={handleStarter}
                >
                  Get Started
                </button>
              </div>

              {/* Pro Plan */}
              <div className="bg-zinc-100 border-2 border-black rounded-xl shadow-lg p-6 flex flex-col transform md:scale-105">
                <h3 className="text-xl font-semibold mb-2">Pro</h3>
                <p className="text-2xl font-bold mb-1">
                  €19<span className="text-sm font-normal"> /mo</span>
                </p>
                <p className="text-sm text-gray-500 mb-4">or €99/year</p>
                <ul className="text-gray-700 space-y-2 mb-6">
                  <li>✅ Unlimited hunts (fair use)</li>
                  <li>✅ Competitor detection</li>
                  <li>✅ CSV export</li>
                  <li>✅ Email support</li>
                </ul>
                <button
                  className="mt-auto bg-black text-white px-4 py-2 rounded hover:bg-gray-800 transition"
                  onClick={handlePro}
                >
                  Upgrade Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
