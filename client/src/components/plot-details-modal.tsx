import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";

interface PlotDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  plot?: {
    id: number;
    plotNumber: string;
    status: string;
    area: string;
    size: string;
    yearlyFee: number;
    notes?: string;
    assignedTo?: number | null;
  };
  gardeners?: {
    id: number;
    firstName: string;
    lastName: string;
  }[];
}

export default function PlotDetailsModal({ 
  isOpen, 
  onClose, 
  plot, 
  gardeners = [] 
}: PlotDetailsModalProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [status, setStatus] = useState(plot?.status || "available");
  const [assignedTo, setAssignedTo] = useState<string>(plot?.assignedTo?.toString() || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!plot) return null;

  const handleSave = async () => {
    try {
      setIsSubmitting(true);
      await apiRequest('PUT', `/api/plots/${plot.id}`, {
        status,
        assignedTo: assignedTo ? parseInt(assignedTo) : null
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/plots'] });
      
      toast({
        title: "Plot Updated",
        description: `Plot ${plot.plotNumber} has been updated.`,
      });
      
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update plot.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Plot {plot.plotNumber} Details</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-gray-500">Plot Number</Label>
              <p className="text-sm font-medium">{plot.plotNumber}</p>
            </div>
            <div>
              <Label className="text-xs text-gray-500">Area</Label>
              <p className="text-sm font-medium">{plot.area}</p>
            </div>
            <div>
              <Label className="text-xs text-gray-500">Size</Label>
              <p className="text-sm font-medium">{plot.size}</p>
            </div>
            <div>
              <Label className="text-xs text-gray-500">Yearly Fee</Label>
              <p className="text-sm font-medium">${plot.yearlyFee}</p>
            </div>
          </div>
          
          {plot.notes && (
            <div>
              <Label className="text-xs text-gray-500">Notes</Label>
              <p className="text-sm">{plot.notes}</p>
            </div>
          )}
          
          <div className="space-y-3 pt-2">
            <div>
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="assigned">Assigned</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="unavailable">Unavailable</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {(status === "assigned" || status === "paid") && (
              <div>
                <Label>Assigned To</Label>
                <Select value={assignedTo} onValueChange={setAssignedTo}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select gardener" />
                  </SelectTrigger>
                  <SelectContent>
                    {gardeners.map(gardener => (
                      <SelectItem key={gardener.id} value={gardener.id.toString()}>
                        {`${gardener.firstName} ${gardener.lastName}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex justify-end space-x-3 pt-2">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
