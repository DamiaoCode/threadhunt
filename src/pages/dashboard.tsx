import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import supabase from "@/lib/supabase";
import ProjectList from "../components/ProjectList";
import Topbar from "../components/Topbar";

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const getSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error || !data.session) {
        router.push("/login");
      } else {
        setUser(data.session.user);
      }
      setLoading(false);
    };
    getSession();
  }, [router]);

  if (loading) return <p>Loading...</p>;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Bar */}
      <Topbar userEmail={user?.email} plan="Free" />

      {/* Main Body */}
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
    </div>
  );
}
