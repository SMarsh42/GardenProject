import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Edit, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Textarea } from "@/components/ui/textarea";

const plotFormSchema = z.object({
  plotNumber: z.string().min(1, "Plot number is required"),
  size: z.string().min(1, "Size is required"),
  status: z.enum(["available", "occupied", "maintenance"]),
  notes: z.string().optional(),
});

type PlotFormValues = z.infer<typeof plotFormSchema>;

export default function PlotManagement() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);

  const form = useForm<PlotFormValues>({
    resolver: zodResolver(plotFormSchema),
    defaultValues: {
      plotNumber: "",
      size: "10x10",
      status: "available",
      notes: "",
    },
  });

  // Check if user has access
  const isManager = user?.role === "manager";
  const isCommittee = user?.role === "committee";
  const hasAccess = isManager || isCommittee;

  // Fetch all plots
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

  // Fetch users to map names to plots
  const { data: users } = useQuery({
    queryKey: ['/api/users'],
    queryFn: async () => {
      const res = await fetch('/api/users', {
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Failed to fetch users');
      return res.json();
    },
    enabled: hasAccess,
  });

  // Create a new plot
  const createPlot = useMutation({
    mutationFn: async (plotData: PlotFormValues) => {
      const response = await apiRequest('POST', '/api/plots', plotData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/plots'] });
      setDialogOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Plot created successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create plot",
        variant: "destructive",
      });
    },
  });

  // Update a plot's status
  const updatePlotStatus = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const response = await apiRequest('PUT', `/api/plots/${id}`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/plots'] });
      toast({
        title: "Success",
        description: "Plot status updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update plot status",
        variant: "destructive",
      });
    },
  });

  // Filter plots based on search and status filter
  const filteredPlots = plots?.filter((plot: any) => {
    // Status filter
    if (statusFilter !== "all" && plot.status !== statusFilter) {
      return false;
    }

    // Search filter
    if (searchQuery) {
      const plotNumber = plot.plotNumber.toLowerCase();
      const searchLower = searchQuery.toLowerCase();
      
      return plotNumber.includes(searchLower);
    }

    return true;
  });

  const getUserName = (userId: number) => {
    const user = users?.find((u: any) => u.id === userId);
    return user ? `${user.firstName} ${user.lastName}` : "Unassigned";
  };

  const handleRowClick = (id: number) => {
    navigate(`/plots/${id}`);
  };

  const onSubmitNewPlot = (values: PlotFormValues) => {
    createPlot.mutate(values);
  };

  // If user doesn't have access
  if (!hasAccess) {
    return (
      <div className="max-w-4xl mx-auto mt-8 text-center">
        <h2 className="text-2xl font-semibold mb-4">Access Denied</h2>
        <p className="mb-4">You don't have permission to view this page.</p>
        <Button asChild>
          <a href="/">Return to Dashboard</a>
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-heading font-semibold">Plot Management</h2>
        <div className="flex space-x-2">
          <div className="relative">
            <Input
              type="text"
              placeholder="Search plots..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="absolute left-3 top-2.5">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
          </div>
          <Select
            value={statusFilter}
            onValueChange={setStatusFilter}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="available">Available</SelectItem>
              <SelectItem value="occupied">Occupied</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
            </SelectContent>
          </Select>
          {isManager && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Plot
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Plot</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmitNewPlot)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="plotNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Plot Number</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. A1" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="size"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Size</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select size" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="10x10">10x10</SelectItem>
                              <SelectItem value="10x20">10x20</SelectItem>
                              <SelectItem value="20x20">20x20</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="available">Available</SelectItem>
                              <SelectItem value="occupied">Occupied</SelectItem>
                              <SelectItem value="maintenance">Maintenance</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notes</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Any additional information about this plot..."
                              className="resize-none"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  
                    <DialogFooter>
                      <Button type="submit" disabled={createPlot.isPending}>
                        {createPlot.isPending ? "Creating..." : "Create Plot"}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4">Loading plots...</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plot Number</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPlots && filteredPlots.length > 0 ? (
                  filteredPlots.map((plot: any) => (
                    <TableRow key={plot.id} className="cursor-pointer hover:bg-gray-50" onClick={() => handleRowClick(plot.id)}>
                      <TableCell className="font-medium">{plot.plotNumber}</TableCell>
                      <TableCell>{plot.size}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            plot.status === "available" ? "success" : 
                            plot.status === "occupied" ? "secondary" : 
                            "error"
                          }
                        >
                          {plot.status.charAt(0).toUpperCase() + plot.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>{plot.userId ? getUserName(plot.userId) : "Unassigned"}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRowClick(plot.id);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          {isManager && plot.status !== "available" && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                updatePlotStatus.mutate({ id: plot.id, status: "available" });
                              }}
                            >
                              Mark Available
                            </Button>
                          )}
                          {isManager && plot.status !== "maintenance" && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                updatePlotStatus.mutate({ id: plot.id, status: "maintenance" });
                              }}
                            >
                              Mark Maintenance
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-4 text-gray-500">
                      No plots found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}
