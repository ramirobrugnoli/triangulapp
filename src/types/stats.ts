import { Player } from "@/types";
import { ApexOptions } from "apexcharts";

export type StatMetric = 'goals' | 'wins' | 'normalWins' | 'points' | 'triangularPoints';

export interface ChartData {
  categories: string[];
  series: ApexOptions["series"];
  colors: string[];
  topThree: Player[];
  totalPlayers: number;
  chartOptions: ApexOptions;
} 