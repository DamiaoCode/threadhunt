import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import supabase from "@/lib/supabase";
import ProjectList from "../components/ProjectList";
import Topbar from "../components/Topbar";
import FloatingLogos from "@/components/FloatingLogos";
import PlanOverlay from "@/components/PlanOverlay";

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
      .update({ plan: "Starter" })
      .eq("user_id", user.id);
    setProfile((prev) => prev && { ...prev, plan: "Starter" });
  };

  const handlePro = async () => {
    if (!user) return;
    await supabase
      .from("profiles")
      .update({ plan: "Pro" })
      .eq("user_id", user.id);
    setProfile((prev) => prev && { ...prev, plan: "Pro" });
  };

  if (loading) return <p>Loading...</p>;
  if (!user || !profile) return null;

  return (
    <div className="min-h-screen bg-gray-50 relative">
      <Topbar />

      <main className="p-6 max-w-4xl mx-auto relative z-10">
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
        <PlanOverlay onStarter={handleStarter} onPro={handlePro} />
      )}

      <FloatingLogos />
    </div>
  );
}
