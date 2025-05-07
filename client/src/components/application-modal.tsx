import { useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface Application {
  id: number;
  userId: number;
  status: string;
  gardenerType: string;
  preferredArea?: string;
  specialRequests?: string;
  gardeningExperience?: string;
  submittedAt: string;
  processedAt?: string;
  priority: number;
}

interface User {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: string;
}

interface ApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  application?: Application;
  applicant?: User;
}

export default function ApplicationModal({ 
  isOpen, 
  onClose, 
  application, 
  applicant 
}: ApplicationModalProps) {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  if (!application || !applicant) return null;

  const handleApprove = async () => {
    try {
      setIsSubmitting(true);
      await apiRequest('PUT', `/api/applications/${application.id}`, {
        status: 'approved'
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/applications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
      
      toast({
        title: "Application Approved",
        description: "The applicant will be notified via email.",
      });
      
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to approve application.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleReject = async () => {
    try {
      setIsSubmitting(true);
      await apiRequest('PUT', `/api/applications/${application.id}`, {
        status: 'rejected'
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/applications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
      
      toast({
        title: "Application Rejected",
        description: "The applicant will be notified via email.",
      });
      
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reject application.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader className="bg-primary text-white px-6 py-4 -mx-6 -mt-6 rounded-t-lg">
          <DialogTitle className="text-lg font-medium">Application Details</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 pt-2">
          <div>
            <h4 className="text-sm font-medium text-gray-500">Applicant Information</h4>
            <div className="mt-2 grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500">Name</p>
                <p className="text-sm font-medium">{`${applicant.firstName} ${applicant.lastName}`}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Email</p>
                <p className="text-sm font-medium">{applicant.email}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Phone</p>
                <p className="text-sm font-medium">{applicant.phone || "N/A"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Address</p>
                <p className="text-sm font-medium">{applicant.address || "N/A"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Application Date</p>
                <p className="text-sm font-medium">{formatDate(application.submittedAt)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Gardener Type</p>
                <p className="text-sm font-medium capitalize">{application.gardenerType}</p>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-gray-500">Plot Preferences</h4>
            <div className="mt-2">
              <div className="flex items-start">
                <p className="text-xs text-gray-500 w-1/4">Preferred Area</p>
                <p className="text-sm font-medium">{application.preferredArea || "No preference"}</p>
              </div>
              <div className="flex items-start mt-2">
                <p className="text-xs text-gray-500 w-1/4">Special Requests</p>
                <p className="text-sm">{application.specialRequests || "None"}</p>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-gray-500">Experience & Commitment</h4>
            <div className="mt-2">
              <div className="flex items-start">
                <p className="text-xs text-gray-500 w-1/4">Gardening Experience</p>
                <p className="text-sm">{application.gardeningExperience || "None specified"}</p>
              </div>
              <div className="flex items-start mt-2">
                <p className="text-xs text-gray-500 w-1/4">Priority</p>
                <div className="flex items-center">
                  <p className="text-sm font-medium">
                    {application.priority >= 8 ? "High" : application.priority >= 5 ? "Medium" : "Low"}
                  </p>
                  <div className="ml-2 w-12 bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        application.priority >= 8 
                          ? "bg-green-500" 
                          : application.priority >= 5 
                            ? "bg-blue-500" 
                            : "bg-yellow-500"
                      }`} 
                      style={{ width: `${Math.min(100, application.priority * 10)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {application.status === 'pending' && (
            <div className="border-t pt-4 flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={handleReject}
                disabled={isSubmitting}
              >
                Reject
              </Button>
              <Button
                onClick={handleApprove}
                disabled={isSubmitting}
              >
                Approve
              </Button>
            </div>
          )}
          
          {application.status === 'approved' && (
            <div className="border-t pt-4">
              <div className="bg-green-50 border border-green-200 rounded-md p-3">
                <p className="text-sm text-green-800">
                  This application was approved
                  {application.processedAt ? ` on ${formatDate(application.processedAt)}` : ''}.
                </p>
              </div>
            </div>
          )}
          
          {application.status === 'rejected' && (
            <div className="border-t pt-4">
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-800">
                  This application was rejected
                  {application.processedAt ? ` on ${formatDate(application.processedAt)}` : ''}.
                </p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
