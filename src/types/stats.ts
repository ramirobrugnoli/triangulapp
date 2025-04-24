import { Player } from "@/types";
import { ApexOptions } from "apexcharts";

export type StatMetric = 'goals' | 'wins' | 'normalWins';

export interface ChartData {
  categories: string[];
  series: any[];
  colors: string[];
  topThree: Player[];
  totalPlayers: number;
  chartOptions: ApexOptions;
} 