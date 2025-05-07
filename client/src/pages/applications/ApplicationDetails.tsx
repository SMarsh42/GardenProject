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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ArrowLeft, Check, X } from "lucide-react";

export default function ApplicationDetails() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [notes, setNotes] = useState("");
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  // Check if user is manager or committee
  const canManageApplications = user?.role === "manager" || user?.role === "committee";

  // Fetch application details
  const { data: application, isLoading } = useQuery({
    queryKey: ['/api/applications', parseInt(id)],
    queryFn: async () => {
      const res = await fetch(`/api/applications/${id}`, {
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Failed to fetch application');
      return res.json();
    },
  });

  // Fetch user details
  const { data: applicantUser } = useQuery({
    queryKey: ['/api/users', application?.userId],
    queryFn: async () => {
      const res = await fetch(`/api/users/${application?.userId}`, {
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Failed to fetch user details');
      return res.json();
    },
    enabled: !!application?.userId,
  });

  // Fetch plot details if present
  const { data: plot } = useQuery({
    queryKey: ['/api/plots', application?.plotId],
    queryFn: async () => {
      const res = await fetch(`/api/plots/${application?.plotId}`, {
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Failed to fetch plot details');
      return res.json();
    },
    enabled: !!application?.plotId,
  });

  // Fetch available plots for assignment
  const { data: availablePlots } = useQuery({
    queryKey: ['/api/plots/available'],
    queryFn: async () => {
      const res = await fetch('/api/plots/available', {
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Failed to fetch available plots');
      return res.json();
    },
    enabled: canManageApplications && application?.status === "pending",
  });

  // Mutation to update application status
  const updateApplication = useMutation({
    mutationFn: async ({ status, notesText, assignedPlotId }: { status: string; notesText?: string; assignedPlotId?: number }) => {
      const payload: any = { status };
      
      if (notesText) {
        payload.notes = application?.notes 
          ? `${application.notes}\n\n${new Date().toLocaleString()}: ${notesText}`
          : `${new Date().toLocaleString()}: ${notesText}`;
      }
      
      if (assignedPlotId) {
        payload.plotId = assignedPlotId;
      }
      
      const response = await apiRequest(
        'PUT', 
        `/api/applications/${id}`, 
        payload
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/applications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/applications', parseInt(id)] });
      queryClient.invalidateQueries({ queryKey: ['/api/plots'] });
    },
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleApprove = async () => {
    if (!canManageApplications) return;
    
    // Get the plot to assign (either requested or first available)
    const plotToAssign = application?.plotId ? application.plotId : 
      availablePlots && availablePlots.length > 0 ? availablePlots[0].id : undefined;
    
    if (!plotToAssign) {
      toast({
        title: "Error",
        description: "No plots available for assignment",
        variant: "destructive",
      });
      return;
    }
    
    try {
      await updateApplication.mutateAsync({
        status: "approved",
        notesText: `Application approved by ${user?.firstName} ${user?.lastName}. Plot ${plotToAssign} assigned.`,
        assignedPlotId: plotToAssign
      });
      
      toast({
        title: "Application Approved",
        description: "The application has been approved and a plot has been assigned.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to approve application",
        variant: "destructive",
      });
    }
  };

  const handleReject = async () => {
    if (!notes.trim()) {
      toast({
        title: "Note Required",
        description: "Please provide a reason for rejection",
        variant: "destructive",
      });
      return;
    }
    
    try {
      await updateApplication.mutateAsync({
        status: "rejected",
        notesText: `Application rejected by ${user?.firstName} ${user?.lastName}. Reason: ${notes}`
      });
      
      toast({
        title: "Application Rejected",
        description: "The application has been rejected.",
      });
      
      setNotes("");
      setShowRejectDialog(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reject application",
        variant: "destructive",
      });
    }
  };

  const handleRevoke = async () => {
    try {
      await updateApplication.mutateAsync({
        status: "rejected",
        notesText: `Application approval revoked by ${user?.firstName} ${user?.lastName}.`
      });
      
      toast({
        title: "Approval Revoked",
        description: "The application approval has been revoked.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to revoke approval",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4">Loading application details...</p>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="max-w-4xl mx-auto mt-8 text-center">
        <h2 className="text-2xl font-semibold mb-4">Application Not Found</h2>
        <p className="mb-4">The application you're looking for doesn't exist or you don't have permission to view it.</p>
        <Button asChild>
          <a href="/applications">Return to Applications</a>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate("/applications")}
          className="mr-2"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Applications
        </Button>
        <h2 className="text-2xl font-heading font-semibold">Application Details</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>Application #{application.id}</CardTitle>
                  <CardDescription>
                    Submitted on {formatDate(application.appliedDate)}
                  </CardDescription>
                </div>
                <Badge
                  variant={
                    application.status === "pending" ? "warning" :
                    application.status === "approved" ? "success" :
                    "error"
                  }
                  className="text-sm px-3 py-1"
                >
                  {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Applicant</h3>
                <p className="text-lg">
                  {applicantUser ? `${applicantUser.firstName} ${applicantUser.lastName}` : `User #${application.userId}`}
                </p>
                {applicantUser && (
                  <p className="text-sm text-gray-500">{applicantUser.email}</p>
                )}
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Application Type</h3>
                <p className="text-lg">
                  {application.applicationType === "new" ? "New Gardener" : "Returning Gardener"}
                </p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Priority</h3>
                <p className="text-lg">
                  {application.priority === "high" ? "High Priority" : "Standard Priority"}
                </p>
              </div>
              
              {application.plotId && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Requested Plot</h3>
                  <p className="text-lg">
                    {plot ? `${plot.plotNumber} (${plot.size})` : `Plot #${application.plotId}`}
                  </p>
                </div>
              )}
              
              {application.notes && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Notes</h3>
                  <div className="bg-gray-50 p-3 rounded-md mt-2">
                    <pre className="whitespace-pre-wrap text-sm font-sans">
                      {application.notes}
                    </pre>
                  </div>
                </div>
              )}
            </CardContent>
            {canManageApplications && application.status === "pending" && (
              <CardFooter className="flex justify-end space-x-4 border-t pt-6">
                <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">
                      <X className="mr-2 h-4 w-4" />
                      Reject
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Reject Application</AlertDialogTitle>
                      <AlertDialogDescription>
                        Please provide a reason for rejecting this application.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <Textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Reason for rejection..."
                      className="min-h-[100px] mt-2"
                    />
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleReject}>Reject Application</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                
                <Button onClick={handleApprove}>
                  <Check className="mr-2 h-4 w-4" />
                  Approve
                </Button>
              </CardFooter>
            )}
            {canManageApplications && application.status === "approved" && (
              <CardFooter className="flex justify-end space-x-4 border-t pt-6">
                <Button variant="destructive" onClick={handleRevoke}>
                  Revoke Approval
                </Button>
              </CardFooter>
            )}
          </Card>
        </div>
        
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Available Plots</CardTitle>
              <CardDescription>
                Plots that can be assigned to this applicant
              </CardDescription>
            </CardHeader>
            <CardContent>
              {availablePlots && availablePlots.length > 0 ? (
                <div className="space-y-2">
                  {availablePlots.map((plot: any) => (
                    <div 
                      key={plot.id} 
                      className="p-3 border rounded-md hover:bg-gray-50 cursor-pointer"
                    >
                      <div className="font-medium">{plot.plotNumber}</div>
                      <div className="text-sm text-gray-500">Size: {plot.size}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No plots available for assignment.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
