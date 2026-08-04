import { createFileRoute } from "@tanstack/react-router";

/**
 * Deadline reminder job.
 * Called hourly by pg_cron. Sends one "due in 24 hours" alert and one
 * "overdue" alert per task, and flips overdue tasks to `late`.
 */
export const Route = createFileRoute("/api/public/hooks/task-reminders")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const provided =
          request.headers.get("apikey") ??
          request.headers.get("authorization")?.replace(/^Bearer /i, "") ??
          "";
        const expected = process.env["SUPABASE_ANON_KEY"] ?? process.env["SUPABASE_PUBLISHABLE_KEY"] ?? "";
        if (!expected || provided !== expected) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const now = new Date();
        const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        const openStatuses = ["pending", "in_progress", "late"];

        // 1) Due within the next 24 hours, not yet reminded
        const { data: soon, error: soonErr } = await supabaseAdmin
          .from("tasks")
          .select("id, title, assigned_to, due_date")
          .in("status", openStatuses)
          .eq("reminder_24h_sent", false)
          .gt("due_date", now.toISOString())
          .lte("due_date", in24h.toISOString());
        if (soonErr) return Response.json({ error: soonErr.message }, { status: 500 });

        // 2) Past due, not yet alerted
        const { data: late, error: lateErr } = await supabaseAdmin
          .from("tasks")
          .select("id, title, assigned_to, assigned_by, due_date")
          .in("status", openStatuses)
          .eq("overdue_notified", false)
          .lt("due_date", now.toISOString());
        if (lateErr) return Response.json({ error: lateErr.message }, { status: 500 });

        const notifications: Array<{
          user_id: string; title: string; message: string; related_task_id: string;
        }> = [];

        for (const t of soon ?? []) {
          notifications.push({
            user_id: t.assigned_to,
            title: "Deadline in 24 hours",
            message: `"${t.title}" is due ${new Date(t.due_date).toLocaleString()}.`,
            related_task_id: t.id,
          });
        }
        for (const t of late ?? []) {
          notifications.push({
            user_id: t.assigned_to,
            title: "Task overdue",
            message: `"${t.title}" was due ${new Date(t.due_date).toLocaleString()}.`,
            related_task_id: t.id,
          });
          if (t.assigned_by && t.assigned_by !== t.assigned_to) {
            notifications.push({
              user_id: t.assigned_by,
              title: "Assigned task overdue",
              message: `"${t.title}" passed its deadline without submission.`,
              related_task_id: t.id,
            });
          }
        }

        if (notifications.length > 0) {
          const { error } = await supabaseAdmin.from("notifications").insert(notifications);
          if (error) return Response.json({ error: error.message }, { status: 500 });
        }

        if ((soon ?? []).length > 0) {
          await supabaseAdmin
            .from("tasks")
            .update({ reminder_24h_sent: true })
            .in("id", (soon ?? []).map((t) => t.id));
        }

        if ((late ?? []).length > 0) {
          await supabaseAdmin
            .from("tasks")
            .update({ overdue_notified: true, status: "late" })
            .in("id", (late ?? []).map((t) => t.id));
        }

        return Response.json({
          ok: true,
          reminded: (soon ?? []).length,
          overdue: (late ?? []).length,
          notifications: notifications.length,
          ran_at: now.toISOString(),
        });
      },
    },
  },
});
