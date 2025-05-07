import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Printer } from "lucide-react";
import { Plot } from "@/lib/types";

export default function GardenLayout() {
  const [, navigate] = useLocation();
  const [viewFilter, setViewFilter] = useState("all");

  // Fetch plots
  const { data: plots, isLoading } = useQuery({
    queryKey: ['/api/plots'],
    queryFn: async () => {
      const res = await fetch('/api/plots', {
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Failed to fetch plots');
      return res.json();
    },
  });

  // Filter plots based on view setting
  const filteredPlots = plots?.filter((plot: Plot) => {
    if (viewFilter === "all") return true;
    return plot.status === viewFilter;
  });

  // Group plots by row
  const getPlotsByRow = () => {
    if (!filteredPlots) return {};

    return filteredPlots.reduce((rows: { [key: string]: Plot[] }, plot: Plot) => {
      // Extract row letter from plotNumber (e.g., "A1" => "A")
      const rowLetter = plot.plotNumber.match(/^[A-Za-z]+/)?.[0] || "";
      
      if (!rows[rowLetter]) {
        rows[rowLetter] = [];
      }
      
      rows[rowLetter].push(plot);
      return rows;
    }, {});
  };

  const plotsByRow = getPlotsByRow();
  
  // Get count of plots by status
  const getStatusCounts = () => {
    if (!plots) return { available: 0, occupied: 0, maintenance: 0 };
    
    return plots.reduce((counts: { [key: string]: number }, plot: Plot) => {
      counts[plot.status] = (counts[plot.status] || 0) + 1;
      return counts;
    }, { available: 0, occupied: 0, maintenance: 0 });
  };

  const statusCounts = getStatusCounts();

  const handlePlotClick = (id: number) => {
    navigate(`/plots/${id}`);
  };

  const handlePrintLayout = () => {
    window.print();
  };

  const sortPlotNumbers = (a: Plot, b: Plot) => {
    // Extract the numeric part from the plot numbers
    const numA = parseInt(a.plotNumber.replace(/[^0-9]/g, ""));
    const numB = parseInt(b.plotNumber.replace(/[^0-9]/g, ""));
    return numA - numB;
  };

  return (
    <div>
      <h2 className="text-2xl font-heading font-semibold mb-6">Garden Layout</h2>
      
      <Card className="mb-8">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div>
            <CardTitle>Plot Layout Map</CardTitle>
            <CardDescription>
              Visual representation of all garden plots
            </CardDescription>
          </div>
          <div className="flex space-x-2">
            <Select
              value={viewFilter}
              onValueChange={setViewFilter}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Show All Plots" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Show All Plots</SelectItem>
                <SelectItem value="available">Available Only</SelectItem>
                <SelectItem value="occupied">Occupied Only</SelectItem>
                <SelectItem value="maintenance">Maintenance Only</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={handlePrintLayout}>
              <Printer className="mr-2 h-4 w-4" />
              Print Layout
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4">Loading garden layout...</p>
            </div>
          ) : (
            <div>
              <div className="border border-gray-200 rounded-lg p-4 overflow-x-auto">
                <div className="garden-map space-y-2 min-w-[800px]">
                  {Object.keys(plotsByRow).sort().map(rowLetter => (
                    <div key={rowLetter} className="flex gap-2">
                      {plotsByRow[rowLetter].sort(sortPlotNumbers).map((plot: Plot) => (
                        <div
                          key={plot.id}
                          onClick={() => handlePlotClick(plot.id)}
                          className={`
                            garden-plot 
                            ${plot.status === "available" ? "garden-plot-available" : 
                              plot.status === "occupied" ? "garden-plot-occupied" : 
                              "garden-plot-maintenance"}
                          `}
                        >
                          <span>{plot.plotNumber}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="mt-6 flex items-center space-x-6">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-green-100 border border-success rounded mr-2"></div>
                  <span className="text-sm text-gray-700">Available ({statusCounts.available})</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-gray-200 border border-gray-400 rounded mr-2"></div>
                  <span className="text-sm text-gray-700">Occupied ({statusCounts.occupied})</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-red-100 border border-red-400 rounded mr-2"></div>
                  <span className="text-sm text-gray-700">Maintenance ({statusCounts.maintenance})</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
