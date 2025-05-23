// pages/project/[id].tsx
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Topbar from "@/components/Topbar";
import supabase from "@/lib/supabase";
import { useRef } from "react";
import FloatingLogos from "@/components/FloatingLogos";
import PlanOverlay from "@/components/PlanOverlay";

export default function ProjectPage() {
  const menuRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();
  const { id } = router.query;

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<any>(null);
  const [plan, setPlan] = useState<string>("");
  const [showPlanOverlay, setShowPlanOverlay] = useState(false);

  const [menuOpenIdx, setMenuOpenIdx] = useState<number | null>(null);

  useEffect(() => {
    const getSessionAndProject = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData.session;

      if (!session) {
        router.push("/login");
        return;
      }

      setUser(session.user);

      if (id) {
        const { data, error } = await supabase
          .from("projects")
          .select("*")
          .eq("id", id)
          .single();

        if (error) {
          console.error("Error fetching project:", error.message);
        } else {
          setProject({
            ...data,
            possible_competitors: data.possible_competitors || [],
          });
        }

        setLoading(false);
      }
      const fetchProfile = async () => {
        const { data: sessionData } = await supabase.auth.getSession();
        const session = sessionData.session;
        if (!session) return;

        const { data, error } = await supabase
          .from("profiles")
          .select("plan")
          .eq("user_id", session.user.id)
          .single();

        if (!error && data?.plan) {
          setPlan(data.plan.toLowerCase());
        }
      };

      fetchProfile();
    };

    getSessionAndProject();
  }, [id, router]);
  const handleDeleteCompetitor = async (index: number) => {
    const updatedList = [...project.possible_competitors];
    updatedList.splice(index, 1);

    const { error } = await supabase
      .from("projects")
      .update({ possible_competitors: updatedList })
      .eq("id", project.id);

    if (!error) {
      setProject((prev: any) => ({
        ...prev,
        possible_competitors: updatedList,
      }));
      setMenuOpenIdx(null);
    } else {
      console.error("Failed to delete competitor", error);
    }
  };
  const handleDeleteOpportunity = async (index: number) => {
    const updatedList = [...project.discovery_results];
    updatedList.splice(index, 1); // remove o item clicado

    const { error } = await supabase
      .from("projects")
      .update({ discovery_results: updatedList })
      .eq("id", project.id);

    if (!error) {
      setProject((prev: any) => ({
        ...prev,
        discovery_results: updatedList,
      }));
    } else {
      console.error("❌ Failed to delete opportunity", error);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpenIdx(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // 🔁 Polling para discovery_results
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (
      project &&
      (!project.discovery_results || project.discovery_results.length === 0)
    ) {
      interval = setInterval(async () => {
        const { data, error } = await supabase
          .from("projects")
          .select("*")
          .eq("id", id)
          .single();

        if (data?.discovery_results?.length > 0) {
          setProject(data);
          clearInterval(interval); // parar o polling
        }
      }, 3000);
    }

    return () => clearInterval(interval);
  }, [project, id]);

  if (loading) return <p>Loading...</p>;
  if (!project) return <p>Project not found.</p>;

  return (
    <div className="min-h-screen bg-gray-50">
      <FloatingLogos />

      <Topbar />

      <div className="max-w-4xl mx-auto p-8 space-y-6">
        <h1 className="text-3xl font-bold">{project.name}</h1>

        <div>
          <h2 className="text-xl font-semibold mb-1">Description</h2>
          <p className="text-gray-700">{project.description}</p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-1">Target Audience</h2>
          <ul className="list-disc list-inside text-gray-700">
            {(project.query_icp || []).map((audience: string, idx: number) => (
              <li key={idx}>{audience}</li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-1">Possible Competitors</h2>
        </div>

        <div className="relative min-h-[180px] overflow-hidden rounded-xl">
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-9 gap-6">
            {(project.possible_competitors || []).map(
              (comp: any, idx: number) => {
                const handle = comp.url
                  .split("twitter.com/")[1]
                  ?.replace(/\/$/, "");
                const truncateHandle = (handle: string, max: number) => {
                  return handle.length > max
                    ? handle.slice(0, max - 1) + "…"
                    : handle;
                };

                return (
                  <div
                    key={idx}
                    className="relative flex flex-col items-center text-center opacity-0 animate-fade-in-down"
                    style={{ animationDelay: `${idx * 50}ms` }}
                  >
                    {plan === "pro" && (
                      <button
                        onClick={() => handleDeleteCompetitor(idx)}
                        className="absolute -top-1 -right-1 z-10 bg-white text-red-500 border border-gray-300 rounded-full w-5 h-5 text-xs flex items-center justify-center hover:bg-red-100 transition"
                        title="Remove competitor"
                      >
                        ×
                      </button>
                    )}
                    <a
                      href={comp.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-col items-center"
                    >
                      <img
                        src={`https://unavatar.io/twitter/${handle}`}
                        alt={handle}
                        className="w-12 h-12 rounded-full mb-1 object-cover"
                      />
                      <p
                        className="text-xs text-gray-700 truncate max-w-[110px] sm:max-w-[130px] md:max-w-[160px]"
                        title={handle}
                      >
                        @{truncateHandle(handle, 8)}{" "}
                        {/* Ajusta o número conforme o layout */}
                      </p>
                    </a>
                  </div>
                );
              }
            )}
          </div>

          {plan === "starter" && (
            <div className="absolute inset-0 z-30 backdrop-blur-sm bg-white/60 flex items-center justify-center rounded-xl">
              <div className="rounded-xl px-6 py-4 text-center space-y-2">
                <div className="text-3xl">😕</div>
                <h3 className="text-lg font-semibold text-gray-800">
                  You're not a real hunter yet!
                </h3>
                <p className="text-gray-600 text-sm">
                  Subscribe to unlock competitor insights and level up your
                  discovery.
                </p>
                <button
                  onClick={() => setShowPlanOverlay(true)}
                  className="mt-2 bg-black text-white px-5 py-2 rounded-full hover:bg-gray-800 transition text-sm"
                >
                  Upgrade Plan
                </button>
              </div>
            </div>
          )}
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">Opportunities</h2>

          {!project.discovery_results ||
          project.discovery_results.length === 0 ? (
            <div className="text-gray-600 py-8 text-center animate-pulse">
              <p className="text-lg font-medium">
                🔎 Hang tight, we are scouring the internet to find you some
                users...
              </p>
            </div>
          ) : (
            <table className="w-full table-auto border text-left transition-all duration-300 relative z-10">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-4 py-2 border w-24">Site</th>
                  <th className="px-4 py-2 border">URL</th>
                  <th className="px-4 py-2 border w-24">Action</th>{" "}
                  {/* 👈 NOVO */}
                </tr>
              </thead>
              <tbody>
                {project.discovery_results.map((item: any, idx: number) => (
                  <tr
                    key={idx}
                    className={`hover:bg-gray-50 opacity-0 animate-fade-in-left`}
                    style={{ animationDelay: `${idx * 60}ms` }}
                  >
                    <td className="px-4 py-2 border relative z-20">
                      <div className="flex justify-center items-center h-full relative z-20">
                        <img
                          src={`/images/${item.site.toLowerCase()}-logo.png`}
                          alt={item.site}
                          className="w-6 h-6"
                        />
                      </div>
                    </td>
                    <td className="px-4 py-2 border">
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline truncate overflow-hidden whitespace-nowrap block max-w-[200px] sm:max-w-[200px] md:max-w-[400px] lg:max-w-[600px]"
                        title={item.url}
                      >
                        {item.url}
                      </a>
                    </td>
                    <td className="px-4 py-2 border">
                      <button
                        onClick={() => handleDeleteOpportunity(idx)}
                        className="text-red-600 hover:underline text-sm"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
      {showPlanOverlay && (
        <div className="fixed inset-0 z-50">
          <PlanOverlay
            onStarter={() => setShowPlanOverlay(false)}
            onPro={async (priceId) => {
              const projectId = project.id; // ← OK
              const res = await fetch("/api/create-checkout-session", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ priceId, userId: user?.id, projectId }),
              });

              const data = await res.json();
              if (data.url) {
                window.location.href = data.url;
              } else {
                alert("Erro ao redirecionar para pagamento.");
              }
            }}
          />
        </div>
      )}
    </div>
  );
}
