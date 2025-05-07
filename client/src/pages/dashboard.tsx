import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { StatCard } from "@/components/ui/statcard";
import { Button } from "@/components/ui/button";
import { GardenPlot, GardenLegend } from "@/components/ui/gardenplot";
import EventCard from "@/components/event-card";
import { formatCurrency } from "@/lib/utils";
import { useState } from "react";
import PlotDetailsModal from "@/components/plot-details-modal";
import ApplicationModal from "@/components/application-modal";

interface DashboardData {
  plots: {
    total: number;
    available: number;
    percentAssigned: number;
  };
  applications: {
    total: number;
    pending: number;
    approved: number;
    new: number;
  };
  workDay: {
    nextDate: string;
    title: string;
    signups: number;
    maxAttendees: number;
  } | null;
  payments: {
    outstanding: number;
    outstandingCount: number;
  };
  events: {
    id: number;
    title: string;
    date: string;
    startTime: string;
    endTime: string;
    attendees: number;
  }[];
}

interface Application {
  id: number;
  userId: number;
  status: string;
  gardenerType: string;
  submittedAt: string;
  priority: number;
}

interface User {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
}

export default function Dashboard() {
  const [selectedPlot, setSelectedPlot] = useState<any>(null);
  const [isPlotModalOpen, setIsPlotModalOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [selectedApplicant, setSelectedApplicant] = useState<User | null>(null);
  const [isApplicationModalOpen, setIsApplicationModalOpen] = useState(false);

  const { data: dashboardData, isLoading } = useQuery<DashboardData>({
    queryKey: ['/api/dashboard'],
  });
  
  const { data: plots, isLoading: isLoadingPlots } = useQuery({
    queryKey: ['/api/plots'],
  });
  
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
    setIsApplicationModalOpen(true);
  };

  const handleViewPlot = (plot: any) => {
    setSelectedPlot(plot);
    setIsPlotModalOpen(true);
  };

  if (isLoading || isLoadingPlots || isLoadingApplications || isLoadingUsers) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-center text-gray-500">Failed to load dashboard data</p>
        </div>
      </div>
    );
  }

  return (
    <div id="dashboard" className="py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-gray-400">Overview of Community Garden</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Garden Plots"
          value={dashboardData.plots.total}
          icon=""
          iconBgColor="bg--800"
          iconColor="text-primary"
          footerLabel="Available"
          footerValue={dashboardData.plots.available}
          progressValue={dashboardData.plots.percentAssigned}
          progressColor="bg-primary"
        />

        <StatCard
          title="Plot Applications"
          value={dashboardData.applications.total}
          icon=""
          iconBgColor="bg--800"
          iconColor="text-primary"
          footerLabel="New This Week"
          footerValue={dashboardData.applications.new}
          footerElement={
            <div className="mt-2 flex items-center gap-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-700 text-yellow-400">
                Pending: {dashboardData.applications.pending}
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-700 text-green-400">
                Approved: {dashboardData.applications.approved}
              </span>
            </div>
          }
        />

        {dashboardData.workDay && (
          <StatCard
            title="Next Community Work Day"
            value={dashboardData.workDay ? 
              new Date(dashboardData.workDay.nextDate).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
              }) : "None"}
            icon=""
            iconBgColor="bg--800"
            iconColor="text-primary"
            footerLabel={dashboardData.workDay ? 
              `${dashboardData.workDay.signups}/${dashboardData.workDay.maxAttendees} Spots` : ""}
            footerElement={
              <div>
                <div className="text-sm text-gray-300 mb-2">{dashboardData.workDay ? dashboardData.workDay.title : ""}</div>
                <Button size="sm" className="w-full">
                  <Link href="/work-days">View Work Days</Link>
                </Button>
              </div>
            }
          />
        )}

        <StatCard
          title="Payment Status"
          value={formatCurrency(dashboardData.payments.outstanding)}
          icon=""
          iconBgColor="bg--800"
          iconColor="text-primary"
          footerLabel={`${dashboardData.payments.outstandingCount} gardener${dashboardData.payments.outstandingCount !== 1 ? 's' : ''} with unpaid fees`}
          footerElement={
            <div>
              <div className="text-sm text-gray-300 mb-2">Outstanding Balance</div>
              <Button size="sm" className="w-full">
                <Link href="/payments">Manage Payments</Link>
              </Button>
            </div>
          }
        />
      </div>

      {/* Recent Applications */}
      <div className="bg-card rounded-lg shadow-md mb-8 border border-gray-700">
        <div className="px-6 py-4 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white flex items-center">
              <span className="material-icons mr-2 text-primary">description</span>
              Recent Applications
            </h2>
            <Link href="/applications" className="text-sm text-primary hover:text-primary/90 flex items-center">
              View all
              <span className="material-icons text-sm ml-1">arrow_forward</span>
            </Link>
          </div>
        </div>
        
        {applications && applications.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-gray-800">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Applicant</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Date</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Type</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Priority</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {applications.slice(0, 5).map(application => {
                  const applicant = users?.find(user => user.id === application.userId);
                  if (!applicant) return null;
                  
                  const priorityLevel = application.priority >= 8 
                    ? { text: "High", color: "bg-primary", percentage: 90 }
                    : application.priority >= 5 
                      ? { text: "Medium", color: "bg-blue-500", percentage: 50 }
                      : { text: "Low", color: "bg-yellow-500", percentage: 25 };
                  
                  return (
                    <tr key={application.id} className="hover:bg-gray-800/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-gray-800 rounded-full flex items-center justify-center text-primary">
                            <span className="material-icons text-sm">person</span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-white">{`${applicant.firstName} ${applicant.lastName}`}</div>
                            <div className="text-sm text-gray-400">{applicant.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-300">
                          {new Date(application.submittedAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          application.status === 'approved' 
                            ? 'bg-gray-800 text-green-400'
                            : application.status === 'rejected'
                              ? 'bg-gray-800 text-red-400'
                              : 'bg-gray-800 text-yellow-400'
                        }`}>
                          {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        <span>{application.gardenerType.charAt(0).toUpperCase() + application.gardenerType.slice(1)}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="text-xs text-gray-300">{priorityLevel.text}</div>
                          <div className="ml-1 w-8 bg-gray-700 rounded-full h-2">
                            <div className={`${priorityLevel.color} h-2 rounded-full`} style={{ width: `${priorityLevel.percentage}%` }}></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button 
                          className="text-primary hover:text-primary/80 bg-gray-800 px-2 py-1 rounded mr-1"
                          onClick={() => handleViewApplication(application)}
                        >
                          View
                        </button>
                        {application.status === 'pending' && (
                          <button 
                            className="text-white bg-primary hover:bg-primary/90 px-2 py-1 rounded"
                            onClick={() => handleViewApplication(application)}
                          >
                            Approve
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-800 text-primary mb-4">
              <span className="material-icons text-3xl">note_add</span>
            </div>
            <h3 className="text-lg font-medium text-white mb-2">No Applications Yet</h3>
            <p className="text-gray-400 mb-4">There are no active applications at this time.</p>
            <Button>
              <Link href="/application-form">Submit an Application</Link>
            </Button>
          </div>
        )}
      </div>

      {/* Garden Layout Preview & Upcoming Events */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Garden Layout Preview */}
        <div className="bg-card rounded-lg shadow-md border border-gray-700 lg:col-span-2">
          <div className="px-6 py-4 border-b border-gray-700">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white flex items-center">
                <span className="material-icons mr-2 text-primary"></span>
                Garden Layout
              </h2>
              <Link href="/garden-layout" className="text-sm text-primary hover:text-primary/90 flex items-center">
                Full View
                <span className="material-icons text-sm ml-1">arrow_forward</span>
              </Link>
            </div>
          </div>
          <div className="p-6">
            <div className="flex items-center justify-center">
              <div className="relative w-full max-w-lg">
                <div className="border border-gray-700 rounded-lg p-2 bg-gray-800">
                  <div className="grid grid-cols-8 gap-1 aspect-[4/3]">
                    {Array.isArray(plots) && plots.slice(0, 48).map((plot: any) => (
                      <GardenPlot 
                        key={plot.id} 
                        plot={plot} 
                        onClick={handleViewPlot}
                      />
                    ))}
                  </div>
                </div>
                <div className="mt-4 flex justify-center">
                  <GardenLegend />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="bg-card rounded-lg shadow-md border border-gray-700">
          <div className="px-6 py-4 border-b border-gray-700">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white flex items-center">
                <span className="material-icons mr-2 text-primary">event</span>
                Upcoming Events
              </h2>
            </div>
          </div>
          
          {dashboardData.events && dashboardData.events.length > 0 ? (
            <div className="p-4">
              <ul className="divide-y divide-gray-700">
                {dashboardData.events.map(event => (
                  <EventCard 
                    key={event.id} 
                    event={event}
                    onViewDetails={() => {}}
                  />
                ))}
              </ul>
              <div className="mt-4">
                <Button className="w-full flex justify-center items-center">
                  <span className="material-icons text-sm mr-1">add</span>
                  Add New Event
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-800 text-primary mb-4">
                <span className="material-icons text-3xl">calendar_month</span>
              </div>
              <h3 className="text-lg font-medium text-white mb-2">No Upcoming Events</h3>
              <p className="text-gray-400 mb-4">There are no scheduled events at this time.</p>
              <Button>
                <span className="material-icons text-sm mr-1">add</span>
                Create Event
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <PlotDetailsModal
        isOpen={isPlotModalOpen}
        onClose={() => setIsPlotModalOpen(false)}
        plot={selectedPlot}
        gardeners={users?.filter(user => user.role === 'gardener')}
      />

      <ApplicationModal
        isOpen={isApplicationModalOpen}
        onClose={() => setIsApplicationModalOpen(false)}
        application={selectedApplication || undefined}
        applicant={selectedApplicant || undefined}
      />
    </div>
  );
}
