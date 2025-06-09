"use client";
import { CurrentMatch } from "@/components/game/CurrentMatch";
export default function AnotadorPage() {
  return (
    <div className="space-y-6 w-full">
      <h1 className="text-2xl font-bold">Anotador</h1>
      <CurrentMatch />
    </div>
  );
}
