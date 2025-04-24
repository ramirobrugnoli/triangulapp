"use client";

import dynamic from "next/dynamic";
import { ApexOptions } from "apexcharts";

// Importación dinámica de ApexCharts para evitar problemas de SSR
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface StatisticsChartProps {
  options: ApexOptions;
  series: any[];
  type: "bar" | "line" | "area";
}

export function StatisticsChart({ options, series, type }: StatisticsChartProps) {
  return (
    <Chart
      options={options}
      series={series}
      type={type}
      height="100%"
    />
  );
} 