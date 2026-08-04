import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { CompanySettings } from "@/lib/types";

export function useCompanySettings() {
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("company_settings")
      .select("*")
      .order("updated_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    setSettings((data as CompanySettings) ?? null);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { settings, loading, reload: load };
}
