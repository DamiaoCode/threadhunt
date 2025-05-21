// pages/project/[id].tsx
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Topbar from "@/components/Topbar";
import supabase from "@/lib/supabase";
import { useRef } from "react";

export default function ProjectPage() {
  const menuRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();
  const { id } = router.query;

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<any>(null);

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
          setProject(data);
        }

        setLoading(false);
      }
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
      <Topbar userEmail={user?.email} plan="Free" />

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

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-9 gap-6">
          {project.possible_competitors.map((comp: any, idx: number) => {
            const handle = comp.url
              .split("twitter.com/")[1]
              ?.replace(/\/$/, "");

            return (
              <div
                key={idx}
                className="relative flex flex-col items-center text-center opacity-0 animate-fade-in-down"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                {/* 3-dots Button */}
                <button
                  onClick={() =>
                    setMenuOpenIdx((prev) => (prev === idx ? null : idx))
                  }
                  className="absolute top-0 right-0 text-gray-400 hover:text-gray-600 text-sm"
                  title="Options"
                >
                  ⋮
                </button>

                {/* Popover Menu */}
                {menuOpenIdx === idx && (
                  <div
                    ref={menuRef} // 👈 apply here
                    className="absolute top-6 right-0 z-20 bg-white border rounded shadow text-xs"
                  >
                    <button
                      onClick={() => handleDeleteCompetitor(idx)}
                      className="block w-full px-3 py-1 text-left hover:bg-red-50 text-red-600"
                    >
                      Remove
                    </button>
                  </div>
                )}

                {/* Profile Card */}
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
                  <p className="text-xs text-gray-700 truncate max-w-[80px]">
                    @{handle}
                  </p>
                </a>
              </div>
            );
          })}
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
            <table className="w-full table-auto border text-left transition-all duration-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-4 py-2 border w-24">Site</th>
                  <th className="px-4 py-2 border">URL</th>
                </tr>
              </thead>
              <tbody>
                {project.discovery_results.map((item: any, idx: number) => (
                  <tr
                    key={idx}
                    className={`hover:bg-gray-50 opacity-0 animate-fade-in-left`}
                    style={{ animationDelay: `${idx * 60}ms` }}
                  >
                    <td className="px-4 py-2 border">
                      <div className="flex justify-center items-center h-full">
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
                        className="text-blue-600 hover:underline truncate overflow-hidden whitespace-nowrap block max-w-[200px] sm:max-w-[200px] md:max-w-[400px] lg:max-w-[700px]"
                        title={item.url}
                      >
                        {item.url}
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
