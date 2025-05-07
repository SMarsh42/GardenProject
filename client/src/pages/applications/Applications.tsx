import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
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
import { Search, PlusCircle } from "lucide-react";
import { Application } from "@/lib/types";
import { useAuth } from "@/hooks/useAuth";

export default function Applications() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Fetch applications based on role
  const { data: applications, isLoading } = useQuery({
    queryKey: ['/api/applications'],
    queryFn: async () => {
      const res = await fetch('/api/applications', {
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Failed to fetch applications');
      return res.json() as Promise<Application[]>;
    },
  });

  // Fetch users to map user names
  const { data: users } = useQuery({
    queryKey: ['/api/users'],
    queryFn: async () => {
      const res = await fetch('/api/users', {
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Failed to fetch users');
      return res.json();
    },
  });

  // Format date string
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Find user name by ID
  const getUserName = (userId: number) => {
    const user = users?.find((u: any) => u.id === userId);
    return user ? `${user.firstName} ${user.lastName}` : `User #${userId}`;
  };

  // Filter applications based on search and status
  const filteredApplications = applications?.filter((app) => {
    // Status filter
    if (statusFilter !== "all" && app.status !== statusFilter) {
      return false;
    }

    // Search filter (simple implementation)
    if (searchQuery) {
      const appUser = users?.find((u: any) => u.id === app.userId);
      const userName = appUser ? `${appUser.firstName} ${appUser.lastName}`.toLowerCase() : "";
      const appId = app.id.toString();
      const searchLower = searchQuery.toLowerCase();
      
      return (
        userName.includes(searchLower) ||
        appId.includes(searchLower)
      );
    }

    return true;
  });

  const handleReview = (id: number) => {
    navigate(`/applications/${id}`);
  };

  // Check if user has permission to view this page
  if (user?.role !== 'manager' && user?.role !== 'committee') {
    return (
      <div className="max-w-4xl mx-auto mt-8 text-center">
        <h2 className="text-2xl font-semibold mb-4">Access Denied</h2>
        <p className="mb-4">You don't have permission to view this page.</p>
        <Button asChild>
          <Link href="/">Return to Dashboard</Link>
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-heading font-semibold">Garden Plot Applications</h2>
        <div className="flex space-x-2">
          <div className="relative">
            <Input
              type="text"
              placeholder="Search applications..."
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
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4">Loading applications...</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead>Applicant</TableHead>
                  <TableHead>Applied Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredApplications && filteredApplications.length > 0 ? (
                  filteredApplications.map((application) => (
                    <TableRow key={application.id}>
                      <TableCell>
                        <div className="flex items-center">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {getUserName(application.userId)}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-900">
                          {formatDate(application.appliedDate)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-900">
                          {application.applicationType === "new" ? "New Gardener" : "Returning"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-900">
                          {application.priority === "high" ? "High" : "Standard"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            application.status === "pending" ? "warning" :
                            application.status === "approved" ? "success" :
                            "error"
                          }
                        >
                          {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="link"
                            className="text-primary hover:text-primary-dark"
                            onClick={() => handleReview(application.id)}
                          >
                            {application.status === "pending" ? "Review" : "View"}
                          </Button>
                          {application.status === "approved" && (
                            <Button
                              variant="link"
                              className="text-red-600 hover:text-red-800"
                              onClick={() => handleReview(application.id)}
                            >
                              Revoke
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4 text-gray-500">
                      No applications found
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
