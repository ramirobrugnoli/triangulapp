import { PointsTable } from "@/components/stats/PointsTable";
/* import { TopScorers } from '@/components/stats/TopScorers';
 */
export default function EstadisticasPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Estadísticas</h1>
      <PointsTable />
      {/* <TopScorers /> */}
    </div>
  );
} 