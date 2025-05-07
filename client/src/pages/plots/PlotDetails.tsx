import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, Check, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export default function PlotDetails() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [plotNumber, setPlotNumber] = useState("");
  const [size, setSize] = useState("");
  const [status, setStatus] = useState("");
  const [notes, setNotes] = useState("");

  // Check if user is manager or committee
  const isManager = user?.role === "manager";
  const isCommittee = user?.role === "committee";
  const canManagePlots = isManager || isCommittee;

  // Fetch plot details
  const { data: plot, isLoading } = useQuery({
    queryKey: ['/api/plots', parseInt(id)],
    queryFn: async () => {
      const res = await fetch(`/api/plots/${id}`, {
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Failed to fetch plot');
      return res.json();
    },
  });

  // Fetch plot holder details if assigned
  const { data: plotHolder } = useQuery({
    queryKey: ['/api/users', plot?.userId],
    queryFn: async () => {
      const res = await fetch(`/api/users/${plot?.userId}`, {
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Failed to fetch user details');
      return res.json();
    },
    enabled: !!plot?.userId,
  });

  // Fetch payments related to this plot
  const { data: payments } = useQuery({
    queryKey: ['/api/plots', parseInt(id), 'payments'],
    queryFn: async () => {
      const res = await fetch(`/api/plots/${id}/payments`, {
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Failed to fetch payments');
      return res.json();
    },
    enabled: !!id && canManagePlots,
  });

  // Mutation to update plot
  const updatePlot = useMutation({
    mutationFn: async (plotData: any) => {
      const response = await apiRequest('PUT', `/api/plots/${id}`, plotData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/plots'] });
      queryClient.invalidateQueries({ queryKey: ['/api/plots', parseInt(id)] });
      setIsEditing(false);
      toast({
        title: "Success",
        description: "Plot updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update plot",
        variant: "destructive",
      });
    },
  });

  // Initialize form values when plot data is loaded
  useState(() => {
    if (plot) {
      setPlotNumber(plot.plotNumber);
      setSize(plot.size);
      setStatus(plot.status);
      setNotes(plot.notes || "");
    }
  });

  const handleEditClick = () => {
    setPlotNumber(plot.plotNumber);
    setSize(plot.size);
    setStatus(plot.status);
    setNotes(plot.notes || "");
    setIsEditing(true);
  };

  const handleSaveClick = () => {
    updatePlot.mutate({
      plotNumber,
      size,
      status,
      notes,
    });
  };

  const handleCancelClick = () => {
    setIsEditing(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount / 100);
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4">Loading plot details...</p>
      </div>
    );
  }

  if (!plot) {
    return (
      <div className="max-w-4xl mx-auto mt-8 text-center">
        <h2 className="text-2xl font-semibold mb-4">Plot Not Found</h2>
        <p className="mb-4">The plot you're looking for doesn't exist or you don't have permission to view it.</p>
        <Button asChild>
          <a href="/plots">Return to Plots</a>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate("/plots")}
          className="mr-2"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Plots
        </Button>
        <h2 className="text-2xl font-heading font-semibold">Plot Details</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>Plot {plot.plotNumber}</CardTitle>
                  <CardDescription>
                    Size: {plot.size}
                  </CardDescription>
                </div>
                <Badge
                  variant={
                    plot.status === "available" ? "success" :
                    plot.status === "occupied" ? "secondary" :
                    "error"
                  }
                  className="text-sm px-3 py-1"
                >
                  {plot.status.charAt(0).toUpperCase() + plot.status.slice(1)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditing ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="plotNumber">Plot Number</Label>
                      <Input
                        id="plotNumber"
                        value={plotNumber}
                        onChange={(e) => setPlotNumber(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="size">Size</Label>
                      <Select
                        value={size}
                        onValueChange={setSize}
                      >
                        <SelectTrigger id="size">
                          <SelectValue placeholder="Size" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="10x10">10x10</SelectItem>
                          <SelectItem value="10x20">10x20</SelectItem>
                          <SelectItem value="20x20">20x20</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={status}
                      onValueChange={setStatus}
                    >
                      <SelectTrigger id="status">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="available">Available</SelectItem>
                        <SelectItem value="occupied">Occupied</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Notes about this plot"
                      className="min-h-[100px]"
                    />
                  </div>
                </div>
              ) : (
                <>
                  {plot.userId && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Assigned To</h3>
                      <p className="text-lg">
                        {plotHolder ? `${plotHolder.firstName} ${plotHolder.lastName}` : `User #${plot.userId}`}
                      </p>
                      {plotHolder && (
                        <p className="text-sm text-gray-500">{plotHolder.email}</p>
                      )}
                    </div>
                  )}
                  
                  {plot.notes && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Notes</h3>
                      <div className="bg-gray-50 p-3 rounded-md mt-2">
                        <pre className="whitespace-pre-wrap text-sm font-sans">
                          {plot.notes}
                        </pre>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
            {canManagePlots && (
              <CardFooter className="flex justify-end space-x-4 border-t pt-6">
                {isEditing ? (
                  <>
                    <Button variant="outline" onClick={handleCancelClick}>
                      Cancel
                    </Button>
                    <Button onClick={handleSaveClick} disabled={updatePlot.isPending}>
                      {updatePlot.isPending ? "Saving..." : "Save Changes"}
                    </Button>
                  </>
                ) : (
                  <Button onClick={handleEditClick}>
                    Edit Plot
                  </Button>
                )}
              </CardFooter>
            )}
          </Card>
          
          {canManagePlots && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Payment History</CardTitle>
                <CardDescription>
                  Payments received for this plot
                </CardDescription>
              </CardHeader>
              <CardContent>
                {payments && payments.length > 0 ? (
                  <div className="space-y-4">
                    {payments.map((payment: any) => (
                      <div key={payment.id} className="border-b pb-4">
                        <div className="flex justify-between">
                          <div>
                            <div className="font-medium">{formatCurrency(payment.amount)}</div>
                            <div className="text-sm text-gray-500">
                              {formatDate(payment.paymentDate)} • {payment.paymentType}
                            </div>
                            {payment.notes && (
                              <div className="text-sm mt-1">{payment.notes}</div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-gray-500">No payments recorded for this plot.</div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
        
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Plot Location</CardTitle>
            </CardHeader>
            <CardContent>
              <div 
                className={`
                  w-full aspect-square flex items-center justify-center text-3xl font-bold rounded-md
                  ${plot.status === "available" ? "garden-plot-available" :
                    plot.status === "occupied" ? "garden-plot-occupied" :
                    "garden-plot-maintenance"}
                `}
              >
                {plot.plotNumber}
              </div>
              <div className="mt-4 text-center text-sm text-gray-500">
                View full garden layout in the Garden Layout section
              </div>
            </CardContent>
          </Card>
          
          {isManager && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {plot.status !== "available" && (
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => updatePlot.mutate({ status: "available" })}
                  >
                    <Check className="mr-2 h-4 w-4" />
                    Mark as Available
                  </Button>
                )}
                
                {plot.status !== "maintenance" && (
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => updatePlot.mutate({ status: "maintenance" })}
                  >
                    <X className="mr-2 h-4 w-4" />
                    Mark for Maintenance
                  </Button>
                )}
                
                {plot.userId && (
                  <Button
                    variant="outline"
                    className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => {
                      updatePlot.mutate({ 
                        status: "available",
                        userId: null,
                        notes: plot.notes ? 
                          `${plot.notes}\nReassigned to available pool on ${new Date().toLocaleDateString()}.` :
                          `Reassigned to available pool on ${new Date().toLocaleDateString()}.`
                      });
                    }}
                  >
                    <X className="mr-2 h-4 w-4" />
                    Unassign Plot
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
