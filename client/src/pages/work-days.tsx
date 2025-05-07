import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDate } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import WorkDayModal from "@/components/work-day-modal";

interface WorkDay {
  id: number;
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  maxAttendees: number;
  createdBy: number;
}

interface WorkDayAttendance {
  id: number;
  workDayId: number;
  userId: number;
  status: string;
}

interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
}

export default function WorkDays() {
  const [activeTab, setActiveTab] = useState("upcoming");
  const [selectedWorkDay, setSelectedWorkDay] = useState<WorkDay | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: workDays, isLoading: isLoadingWorkDays } = useQuery<WorkDay[]>({
    queryKey: ['/api/workdays'],
  });
  
  const { data: users, isLoading: isLoadingUsers } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });

  const handleSignUp = async (workDayId: number) => {
    try {
      await apiRequest('POST', `/api/workdays/${workDayId}/attend`, {});
      queryClient.invalidateQueries({ queryKey: ['/api/workdays'] });
      toast({
        title: "Success!",
        description: "You have been signed up for this work day.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sign up for work day. You may already be signed up.",
        variant: "destructive",
      });
    }
  };

  const handleViewWorkDay = (workDay: WorkDay) => {
    setSelectedWorkDay(workDay);
    setIsModalOpen(true);
  };

  const handleCreateWorkDay = () => {
    setSelectedWorkDay(null);
    setIsCreateModalOpen(true);
  };

  if (isLoadingWorkDays || isLoadingUsers) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const now = new Date();
  const upcomingWorkDays = workDays?.filter(
    wd => new Date(wd.date) >= now
  ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const pastWorkDays = workDays?.filter(
    wd => new Date(wd.date) < now
  ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const displayWorkDays = activeTab === "upcoming" ? upcomingWorkDays : pastWorkDays;

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-wrap justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Work Days</h1>
          <p className="text-gray-600">Schedule and sign up for garden work days</p>
        </div>
        
        <div className="mt-4 sm:mt-0">
          <Button onClick={handleCreateWorkDay}>
            <span className="material-icons text-sm mr-1"></span>
            Create Work Day
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg">Garden Work Days</CardTitle>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                <TabsTrigger value="past">Past</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          {displayWorkDays?.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No {activeTab} work days scheduled</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {displayWorkDays?.map(workDay => {
                const date = new Date(workDay.date);
                const formattedDate = formatDate(date);
                const attendees = 0; // In a real app, we would fetch this from the API

                return (
                  <Card key={workDay.id} className="overflow-hidden">
                    <div className="bg-primary text-white px-4 py-2">
                      <p className="font-medium">{formattedDate}</p>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-bold text-lg mb-2">{workDay.title}</h3>
                      <div className="text-sm text-gray-600 mb-3">
                        <p>{workDay.startTime} - {workDay.endTime}</p>
                        <p className="mt-1">{attendees}/{workDay.maxAttendees} signed up</p>
                      </div>
                      <p className="text-sm mb-4 line-clamp-2">{workDay.description}</p>
                      <div className="flex justify-between">
                        <Button variant="outline" size="sm" onClick={() => handleViewWorkDay(workDay)}>
                          Details
                        </Button>
                        {activeTab === "upcoming" && (
                          <Button size="sm" onClick={() => handleSignUp(workDay.id)}>
                            Sign Up
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Work Day Details Modal */}
      <WorkDayModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        workDay={selectedWorkDay || undefined}
        mode="view"
      />

      {/* Create Work Day Modal */}
      <WorkDayModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        mode="create"
      />
    </div>
  );
}
