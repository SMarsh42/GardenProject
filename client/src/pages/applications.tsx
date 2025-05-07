import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "wouter";
import { calculatePriorityLevel, formatDate } from "@/lib/utils";
import ApplicationModal from "@/components/application-modal";

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
  processedBy?: number;
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

export default function Applications() {
  const [selectedTab, setSelectedTab] = useState("all");
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [selectedApplicant, setSelectedApplicant] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: applications, isLoading: isLoadingApplications } = useQuery<Application[]>({
    queryKey: ['/api/applications'],
  });

  const { data: users, isLoading: isLoadingUsers } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });

  const handleViewApplication = (application: Application) => {
    setSelectedApplication(application);
    const applicant = users?.find(user => user.id === application.userId) || null;
    setSelectedApplicant(applicant);
    setIsModalOpen(true);
  };

  const filteredApplications = applications?.filter(app => {
    if (selectedTab === 'all') return true;
    return app.status === selectedTab;
  });

  if (isLoadingApplications || isLoadingUsers) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Plot Applications</h1>
          <p className="text-gray-600">Manage garden plot applications</p>
        </div>
        <Button asChild>
          <Link href="/application-form">
            <span className="material-icons text-sm mr-1">add</span>
            New Application
          </Link>
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <Tabs defaultValue="all" onValueChange={setSelectedTab}>
            <TabsList>
              <TabsTrigger value="all">All Applications</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="approved">Approved</TabsTrigger>
              <TabsTrigger value="rejected">Rejected</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applicant</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Preferred Area</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredApplications?.map(application => {
                const applicant = users?.find(user => user.id === application.userId);
                if (!applicant) return null;
                
                const priorityLevel = calculatePriorityLevel(application.priority);
                
                return (
                  <tr key={application.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-green-100 rounded-full flex items-center justify-center text-green-500">
                          <span className="material-icons text-sm">person</span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{`${applicant.firstName} ${applicant.lastName}`}</div>
                          <div className="text-sm text-gray-500">{applicant.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDate(application.submittedAt)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        application.status === 'approved' 
                          ? 'bg-green-100 text-green-800'
                          : application.status === 'rejected'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className="capitalize">{application.gardenerType}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="text-xs text-gray-900">{priorityLevel.text}</div>
                        <div className="ml-1 w-8 bg-gray-200 rounded-full h-2">
                          <div className="h-2 rounded-full" style={{ backgroundColor: priorityLevel.color, width: `${priorityLevel.percentage}%` }}></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span>{application.preferredArea || "Any"}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Button
                        variant="link"
                        className="text-primary hover:text-primary-dark"
                        onClick={() => handleViewApplication(application)}
                      >
                        View
                      </Button>
                      {application.status === 'pending' && (
                        <Button
                          variant="link"
                          className="ml-3 text-primary hover:text-primary-dark"
                          onClick={() => handleViewApplication(application)}
                        >
                          Approve
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <ApplicationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        application={selectedApplication || undefined}
        applicant={selectedApplicant || undefined}
      />
    </div>
  );
}
