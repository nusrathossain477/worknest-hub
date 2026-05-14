import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import type { AttendanceRow, Profile } from "@/lib/types";
import { format, differenceInMinutes } from "date-fns";

export const Route = createFileRoute("/_authenticated/attendance")({
  component: AttendancePage,
});

function AttendancePage() {
  const { user, role } = useAuth();
  const [rows, setRows] = useState<AttendanceRow[]>([]);
  const [profiles, setProfiles] = useState<Map<string, Profile>>(new Map());

  const load = async () => {
    if (!user) return;
    let q = supabase.from("attendance").select("*").order("check_in", { ascending: false }).limit(200);
    if (role !== "admin") q = q.eq("user_id", user.id);
    const { data } = await q;
    setRows((data as AttendanceRow[]) ?? []);

    if (role === "admin" && data?.length) {
      const ids = Array.from(new Set(data.map((r: any) => r.user_id)));
      const { data: profs } = await supabase.from("profiles").select("*").in("id", ids);
      setProfiles(new Map((profs ?? []).map((p: any) => [p.id, p])));
    }
  };

  useEffect(() => { load(); }, [user?.id, role]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Attendance</h1>
        <p className="text-sm text-muted-foreground">
          {role === "admin" ? "Check-in / check-out records across the team" : "Your check-in history"}
        </p>
      </div>

      <div className="overflow-hidden rounded-lg border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="px-4 py-2 font-medium">Date</th>
              {role === "admin" && <th className="px-4 py-2 font-medium">Member</th>}
              <th className="px-4 py-2 font-medium">Check-in</th>
              <th className="px-4 py-2 font-medium">Check-out</th>
              <th className="px-4 py-2 font-medium">Hours</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={role === "admin" ? 5 : 4} className="px-4 py-8 text-center text-muted-foreground">No records yet.</td></tr>
            )}
            {rows.map((r) => {
              const inT = new Date(r.check_in);
              const outT = r.check_out ? new Date(r.check_out) : null;
              const minutes = outT ? differenceInMinutes(outT, inT) : null;
              return (
                <tr key={r.id} className="border-t">
                  <td className="px-4 py-2">{format(inT, "MMM d, yyyy")}</td>
                  {role === "admin" && <td className="px-4 py-2">{profiles.get(r.user_id)?.full_name || "—"}</td>}
                  <td className="px-4 py-2">{format(inT, "p")}</td>
                  <td className="px-4 py-2">{outT ? format(outT, "p") : <span className="text-accent">In progress</span>}</td>
                  <td className="px-4 py-2">{minutes != null ? `${(minutes / 60).toFixed(2)}h` : "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
