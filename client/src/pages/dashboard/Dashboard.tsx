import { useEffect } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { 
  FileText, 
  Grid, 
  Calendar, 
  MessageSquare 
} from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const isManagerOrCommittee = user?.role === "manager" || user?.role === "committee";

  // Fetch pending applications count
  const { data: applications } = useQuery({
    queryKey: ['/api/applications/pending'],
    queryFn: async () => {
      const res = await fetch('/api/applications/pending', {
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Failed to fetch applications');
      return res.json();
    },
    enabled: isManagerOrCommittee,
  });

  // Fetch available plots count
  const { data: availablePlots } = useQuery({
    queryKey: ['/api/plots/available'],
    queryFn: async () => {
      const res = await fetch('/api/plots/available', {
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Failed to fetch available plots');
      return res.json();
    },
  });

  // Fetch all plots for total count
  const { data: allPlots } = useQuery({
    queryKey: ['/api/plots'],
    queryFn: async () => {
      const res = await fetch('/api/plots', {
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Failed to fetch plots');
      return res.json();
    },
  });

  // Fetch upcoming work days
  const { data: upcomingWorkDays } = useQuery({
    queryKey: ['/api/workdays/upcoming'],
    queryFn: async () => {
      const res = await fetch('/api/workdays/upcoming', {
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Failed to fetch work days');
      return res.json();
    },
  });

  // Fetch recent forum topics
  const { data: recentTopics } = useQuery({
    queryKey: ['/api/forum/topics/recent'],
    queryFn: async () => {
      const res = await fetch('/api/forum/topics/recent?limit=4', {
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Failed to fetch forum topics');
      return res.json();
    },
  });

  // Get the next work day
  const nextWorkDay = upcomingWorkDays && upcomingWorkDays.length > 0
    ? upcomingWorkDays[0]
    : null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6 !text-black">Dashboard</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {isManagerOrCommittee && (
          <Card>
            <CardContent className="p-5">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold text-gray-700">Applications</h3>
                  <p className="text-3xl font-bold text-primary mt-2">
                    {applications?.length || 0}
                  </p>
                </div>
                <div className="bg-primary-light bg-opacity-20 rounded-full p-3">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-4">
                {applications?.length 
                  ? `${applications.length} pending applications`
                  : "No pending applications"}
              </p>
            </CardContent>
          </Card>
        )}
        
        <Card>
          <CardContent className="p-5">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold text-gray-700">Available Plots</h3>
                <p className="text-3xl font-bold text-primary mt-2">
                  {availablePlots?.length || 0}
                </p>
              </div>
              <div className="bg-accent bg-opacity-20 rounded-full p-3">
                <Grid className="h-6 w-6 text-accent" />
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-4">
              Out of {allPlots?.length || 0} total plots
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-5">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold text-gray-700">Upcoming Work Day</h3>
                <p className="text-xl font-bold text-primary mt-2">
                  {nextWorkDay ? formatDate(nextWorkDay.date) : "None scheduled"}
                </p>
              </div>
              <div className="bg-secondary bg-opacity-20 rounded-full p-3">
                <Calendar className="h-6 w-6 text-secondary" />
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-4">
              {nextWorkDay?.title || "Check back for updates"}
            </p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {isManagerOrCommittee && (
          <Card>
            <CardContent className="pt-5">
              <h3 className="text-lg font-
              bold text-gray-700 mb-4">Recent Applications</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {applications && applications.length > 0 ? (
                      applications.slice(0, 4).map((app: any) => (
                        <tr key={app.id}>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-800">
                            Application #{app.id}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                            {formatDate(app.appliedDate)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <Badge variant={
                              app.status === "pending" ? "warning" : 
                              app.status === "approved" ? "success" : 
                              "error"
                            }>
                              {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                            </Badge>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} className="px-4 py-3 text-sm text-gray-500 text-center">
                          No recent applications
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="mt-4">
                <Button asChild variant="link" className="text-primary hover:text-primary-dark">
                  <Link href="/applications">View All Applications</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
        
        <Card>
          <CardContent className="pt-5">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Recent Forum Activity</h3>
            <div className="space-y-4">
              {recentTopics && recentTopics.length > 0 ? (
                recentTopics.map((topic: any) => (
                  <div key={topic.id} className="border-b border-gray-200 pb-4">
                    <h4 className="text-base font-medium text-gray-800">{topic.title}</h4>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{topic.content}</p>
                    <div className="flex items-center mt-2">
                      <span className="text-xs text-gray-500">
                        Posted {formatDate(topic.createdAt)}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-gray-500">
                  No recent forum activity
                </div>
              )}
            </div>
            <div className="mt-4">
              <Button asChild variant="link" className="text-primary hover:text-primary-dark">
                <Link href="/forum">Visit Forum</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
