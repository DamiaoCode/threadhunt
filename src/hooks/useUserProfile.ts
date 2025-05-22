// hooks/useUserProfile.ts
import { useEffect, useState } from "react";
import supabase from "@/lib/supabase";

export default function useUserProfile() {
  const [userEmail, setUserEmail] = useState("");
  const [plan, setPlan] = useState("Free");
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserInfo = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData.session;

      if (!session) {
        setLoading(false);
        return;
      }

      const user = session.user;
      setUserEmail(user.email || "");
      setUserId(user.id);

      const { data, error } = await supabase
        .from("profiles")
        .select("plan")
        .eq("user_id", user.id)
        .single();

      if (!error && data?.plan) {
        setPlan(data.plan);
      }

      setLoading(false);
    };

    fetchUserInfo();
  }, []);

  // Atualizador de plano
  const updatePlan = async (newPlan: string) => {
    if (!userId) return;

    const { error } = await supabase
      .from("profiles")
      .update({ plan: newPlan })
      .eq("user_id", userId);

    if (!error) {
      setPlan(newPlan);
    } else {
      console.error("❌ Failed to update plan:", error.message);
    }
  };

  return { userEmail, plan, updatePlan, loading };
}
