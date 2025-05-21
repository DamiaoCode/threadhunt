import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Topbar from "../components/Topbar";
import supabase from "@/lib/supabase";

export default function Hunt() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [icps, setIcps] = useState<string[]>([]);
  const [selectedIcps, setSelectedIcps] = useState<string[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const router = useRouter();
  const [customIcp, setCustomIcp] = useState("");

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);

    try {
      const res = await fetch("/api/generate-icps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description }),
      });

      const data = await res.json();
      setIcps(data.icps || []);
    } catch (err) {
      console.error("Erro ao gerar ICPs:", err);
    }

    setGenerating(false);
  };
  const handleContinue = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("projects")
      .insert([
        {
          name: title,
          description,
          user_id: user.id,
          query_icp: selectedIcps,
        },
      ])
      .select()
      .single(); // get inserted project

    if (error) {
      console.error("Erro ao guardar projeto:", error.message);
      return;
    }

    // 👇 Trigger async discovery pipeline
    try {
      fetch("/api/process-discovery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: data.id,
          name: title,
          description,
          query_icp: selectedIcps,
        }),
      })
        .then(() => {
          console.log("✅ Discovery task launched");
        })
        .catch((err) => {
          console.error("❌ Discovery API failed", err);
        });
    } catch (err) {
      console.error("Discovery population failed:", err);
    }

    // ✅ Redirect user to view their project
    router.push(`/project/${data.id}`);
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="min-h-screen bg-gray-50">
      <Topbar userEmail={user?.email} plan="Free" />
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-xl bg-white shadow-md rounded p-8 space-y-6 border"
        >
          <h1 className="text-2xl font-semibold text-center">
            Describe Your Product
          </h1>

          {/* Only show title & description if ICPs are NOT generated */}
          {!icps.length && (
            <>
              <div>
                <label
                  className="block text-sm font-medium mb-1"
                  htmlFor="title"
                >
                  Project Title
                </label>
                <input
                  id="title"
                  type="text"
                  className="w-full px-4 py-2 border rounded"
                  placeholder="e.g. Smart Task Manager"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div>
                <label
                  className="block text-sm font-medium mb-1"
                  htmlFor="description"
                >
                  Description
                </label>
                <textarea
                  id="description"
                  rows={6}
                  className="w-full px-4 py-2 border rounded"
                  placeholder="Explain what your app does, what problem it solves, and who it's for..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full bg-black text-white py-2 rounded hover:bg-gray-800 transition"
                disabled={generating}
              >
                {generating ? "Generating..." : "Next"}
              </button>
            </>
          )}

          {/* ICP Checkboxes + Manual Add */}
          {icps.length > 0 && (
            <div className="mt-6 space-y-4">
              <p className="text-sm font-medium">
                Suggested Ideal Customer Profiles:
              </p>
              {icps.map((profile, idx) => (
                <label key={idx} className="block">
                  <input
                    type="checkbox"
                    className="mr-2"
                    checked={selectedIcps.includes(profile)}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setSelectedIcps((prev) =>
                        checked
                          ? [...prev, profile]
                          : prev.filter((p) => p !== profile)
                      );
                    }}
                  />

                  {profile}
                </label>
              ))}

              {/* Custom ICP Input */}
              <div className="flex items-center gap-2 mt-4">
                <input
                  type="text"
                  placeholder="Add custom profile..."
                  className="flex-1 px-4 py-2 border rounded"
                  value={customIcp}
                  onChange={(e) => setCustomIcp(e.target.value)}
                />
                <button
                  type="button"
                  className="bg-gray-800 text-white px-3 py-2 rounded hover:bg-black"
                  onClick={() => {
                    if (customIcp.trim()) {
                      setIcps((prev) => [...prev, customIcp.trim()]);
                      setSelectedIcps((prev) => [...prev, customIcp.trim()]); // ✅ pre-check it
                      setCustomIcp("");
                    }
                  }}
                >
                  Add
                </button>
              </div>

              <button
                type="button"
                onClick={handleContinue}
                className="bg-gray-800 text-white px-3 py-2 rounded hover:bg-black mt-4 w-full"
              >
                Continue
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
