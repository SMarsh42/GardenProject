import { cn, getStatusColor } from "@/lib/utils";

export interface PlotData {
  id: number;
  plotNumber: string;
  status: string;
  area: string;
  size: string;
  assignedTo?: number | null;
}

interface GardenPlotProps {
  plot: PlotData;
  onClick?: (plot: PlotData) => void;
  className?: string;
}

export function GardenPlot({ plot, onClick, className }: GardenPlotProps) {
  const backgroundColor = getStatusColor(plot.status);
  const textColor = plot.status === "paid" ? "text-white" : "text-gray-700";

  return (
    <div 
      className={cn(
        "border border-gray-300 rounded-sm flex items-center justify-center cursor-pointer", 
        className
      )}
      style={{ backgroundColor }}
      onClick={() => onClick?.(plot)}
    >
      <span className={`text-xs font-medium ${textColor}`}>{plot.plotNumber}</span>
    </div>
  );
}

interface GardenLegendProps {
  className?: string;
}

export function GardenLegend({ className }: GardenLegendProps) {
  return (
    <div className={cn("flex items-center space-x-6 text-xs", className)}>
      <div className="flex items-center space-x-1">
        <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: getStatusColor("available") }}></div>
        <span>Available</span>
      </div>
      <div className="flex items-center space-x-1">
        <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: getStatusColor("assigned") }}></div>
        <span>Assigned</span>
      </div>
      <div className="flex items-center space-x-1">
        <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: getStatusColor("paid") }}></div>
        <span>Paid</span>
      </div>
      <div className="flex items-center space-x-1">
        <div className="w-3 h-3 rounded-sm bg-gray-200"></div>
        <span>Unavailable</span>
      </div>
    </div>
  );
}
