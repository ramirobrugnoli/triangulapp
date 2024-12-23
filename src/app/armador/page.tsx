"use client";
import { TeamsBuilder } from "@/components/teamsbuilder/TeamsBuilder";

export default function AnotadorPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Armador equipos</h1>
      <TeamsBuilder />
    </div>
  );
}
