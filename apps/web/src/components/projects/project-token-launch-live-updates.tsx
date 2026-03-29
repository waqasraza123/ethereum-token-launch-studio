"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

type ProjectTokenLaunchLiveUpdatesProps = Readonly<{
  projectId: string;
}>;

export function ProjectTokenLaunchLiveUpdates({
  projectId
}: ProjectTokenLaunchLiveUpdatesProps) {
  const router = useRouter();
  const [channelState, setChannelState] = useState("connecting");
  const [isRefreshing, startTransition] = useTransition();

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    const channel = supabase
      .channel(`project-token-launch:${projectId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          filter: `project_id=eq.${projectId}`,
          schema: "app_public",
          table: "project_token_launch_requests"
        },
        () => {
          startTransition(() => {
            router.refresh();
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          filter: `project_id=eq.${projectId}`,
          schema: "app_public",
          table: "project_activities"
        },
        () => {
          startTransition(() => {
            router.refresh();
          });
        }
      )
      .subscribe((status: string) => {
        setChannelState(status.toLowerCase());
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [projectId, router]);

  return (
    <section className="placeholder-panel">
      <h2 className="placeholder-panel-title">Live updates</h2>
      <p className="placeholder-panel-description">Channel state: {channelState}</p>
      <p className="dashboard-list-meta">
        Refresh state: {isRefreshing ? "refreshing" : "idle"}
      </p>
    </section>
  );
}
