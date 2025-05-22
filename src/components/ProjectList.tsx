import { useEffect, useState } from "react";
import supabase from "@/lib/supabase";
import Link from "next/link";

export default function ProjectList({ user }: { user: any }) {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchProjects = async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) console.error("Error fetching projects:", error);
      else setProjects(data);

      setLoading(false);
    };
    fetchProjects();
  }, [user]);

  if (!user) return null;
  if (loading) return <p>Loading projects...</p>;

  return (
    <ul className="space-y-4">
      {projects.map((project) => (
        <li key={project.id} className="border p-4 rounded shadow bg-white">
          <Link
            href={`/project/${project.id}`}
            className="block hover:underline"
          >
            <h2 className="text-xl font-semibold">{project.name}</h2>
            <p className="text-gray-700">{project.description}</p>
          </Link>
        </li>
      ))}
    </ul>
  );
}
