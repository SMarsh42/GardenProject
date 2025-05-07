import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GardenPlot, GardenLegend } from "@/components/ui/gardenplot";
import PlotDetailsModal from "@/components/plot-details-modal";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface Plot {
  id: number;
  plotNumber: string;
  status: string;
  area: string;
  size: string;
  yearlyFee: number;
  notes?: string;
  assignedTo?: number | null;
}

interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
}

export default function GardenLayout() {
  const [selectedArea, setSelectedArea] = useState<string>("all");
  const [selectedPlot, setSelectedPlot] = useState<Plot | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: plots, isLoading: isLoadingPlots } = useQuery<Plot[]>({
    queryKey: ['/api/plots'],
  });

  const { data: users, isLoading: isLoadingUsers } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });

  const handleViewPlot = (plot: Plot) => {
    setSelectedPlot(plot);
    setIsModalOpen(true);
  };

  const areas = plots ? [...new Set(plots.map(plot => plot.area))].sort() : [];
  
  const filteredPlots = plots?.filter(plot => 
    selectedArea === "all" || plot.area === selectedArea
  );

  // Group plots by area
  const plotsByArea = filteredPlots?.reduce((acc, plot) => {
    if (!acc[plot.area]) {
      acc[plot.area] = [];
    }
    acc[plot.area].push(plot);
    return acc;
  }, {} as Record<string, Plot[]>);

  if (isLoadingPlots || isLoadingUsers) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const plotCounts = {
    total: plots?.length || 0,
    available: plots?.filter(p => p.status === "available").length || 0,
    assigned: plots?.filter(p => p.status === "assigned").length || 0,
    paid: plots?.filter(p => p.status === "paid").length || 0,
    unavailable: plots?.filter(p => p.status === "unavailable").length || 0,
  };

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-wrap justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Garden Layout</h1>
          <p className="text-gray-600">View and manage garden plots</p>
        </div>
        
        <div className="mt-4 sm:mt-0 flex space-x-4">
          <div className="w-40">
            <Label htmlFor="area-filter">Filter by Area</Label>
            <Select value={selectedArea} onValueChange={setSelectedArea}>
              <SelectTrigger id="area-filter">
                <SelectValue placeholder="All Areas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Areas</SelectItem>
                {areas.map(area => (
                  <SelectItem key={area} value={area}>Area {area}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label className="opacity-0">Add Plot</Label>
            <Button>
              <span className="material-icons text-sm mr-1"></span>
              Add Plot
            </Button>
          </div>
        </div>
      </div>

      {/* Plot statistics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">Total Plots</p>
              <p className="text-2xl font-bold">{plotCounts.total}</p>
            </div>
            <div className="bg-gray-100 p-2 rounded-full">
              <span className="material-icons text-gray-500"></span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">Available</p>
              <p className="text-2xl font-bold">{plotCounts.available}</p>
            </div>
            <div className="bg-green-100 p-2 rounded-full">
              <span className="material-icons text-green-500"></span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">Assigned</p>
              <p className="text-2xl font-bold">{plotCounts.assigned}</p>
            </div>
            <div className="bg-blue-100 p-2 rounded-full">
              <span className="material-icons text-blue-500"></span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">Paid</p>
              <p className="text-2xl font-bold">{plotCounts.paid}</p>
            </div>
            <div className="bg-purple-100 p-2 rounded-full">
              <span className="material-icons text-purple-500"></span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">Unavailable</p>
              <p className="text-2xl font-bold">{plotCounts.unavailable}</p>
            </div>
            <div className="bg-red-100 p-2 rounded-full">
              <span className="material-icons text-red-500"></span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Garden Layout */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Garden Plot Layout</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center mb-4">
            <GardenLegend />
          </div>
          
          {plotsByArea && Object.keys(plotsByArea).sort().map(area => (
            <div key={area} className="mb-8">
              <h3 className="font-medium text-gray-700 mb-3">Area {area}</h3>
              <div className="grid grid-cols-8 md:grid-cols-12 gap-2">
                {plotsByArea[area].sort((a, b) => a.plotNumber.localeCompare(b.plotNumber)).map(plot => (
                  <GardenPlot 
                    key={plot.id} 
                    plot={plot} 
                    onClick={handleViewPlot}
                    className="aspect-square"
                  />
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Plot Details Modal */}
      <PlotDetailsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        plot={selectedPlot || undefined}
        gardeners={users?.filter(user => true) || []}
      />
    </div>
  );
}
