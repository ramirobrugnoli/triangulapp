"use client";
import { useEffect } from "react";
import { useStatsStore } from "@/store/statsStore";
import { useRouter } from "next/navigation";

export default function RedirectToFirstPlayer() {
  const { players, fetchStats } = useStatsStore();
  const router = useRouter();

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    if (players.length > 0) {
      router.replace(`/estadisticas/individuales/${players[0].id}`);
    }
  }, [players, router]);

  return null;
}