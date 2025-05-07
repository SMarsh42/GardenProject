import { useState } from "react";
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
import { useAuth } from "@/hooks/useAuth";
import { Calendar, Clock, Users, CalendarPlus, CheckCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const workDayFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  date: z.string().min(1, "Date is required"),
  description: z.string().optional(),
  maxAttendees: z.string().optional().transform(val => val ? parseInt(val) : undefined),
});

type WorkDayFormValues = z.infer<typeof workDayFormSchema>;

export default function WorkDays() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("upcoming");

  // Check if user is manager or committee
  const isManager = user?.role === "manager";
  const isCommittee = user?.role === "committee";
  const canManageWorkDays = isManager || isCommittee;

  const form = useForm<WorkDayFormValues>({
    resolver: zodResolver(workDayFormSchema),
    defaultValues: {
      title: "",
      date: new Date().toISOString().slice(0, 16), // format: YYYY-MM-DDThh:mm
      description: "",
      maxAttendees: "20",
    },
  });

  // Fetch all work days
  const { data: workDays, isLoading } = useQuery({
    queryKey: ['/api/workdays'],
    queryFn: async () => {
      const res = await fetch('/api/workdays', {
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Failed to fetch work days');
      return res.json();
    },
  });

  // Fetch user's work day attendance
  const { data: userAttendance } = useQuery({
    queryKey: ['/api/users', user?.id, 'workdays'],
    queryFn: async () => {
      const res = await fetch(`/api/users/${user?.id}/workdays`, {
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Failed to fetch attendance');
      return res.json();
    },
    enabled: !!user,
  });

  // Create a new work day
  const createWorkDay = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/workdays', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/workdays'] });
      setDialogOpen(false);
      form.reset({
        title: "",
        date: new Date().toISOString().slice(0, 16),
        description: "",
        maxAttendees: "20",
      });
      toast({
        title: "Success",
        description: "Work day created successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create work day",
        variant: "destructive",
      });
    },
  });

  // Register for a work day
  const registerWorkDay = useMutation({
    mutationFn: async (workDayId: number) => {
      const response = await apiRequest('POST', `/api/workdays/${workDayId}/attend`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/workdays'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users', user?.id, 'workdays'] });
      toast({
        title: "Success",
        description: "You have registered for the work day",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to register for work day",
        variant: "destructive",
      });
    },
  });

  // Mark attendance for a work day (for managers/committee)
  const markAttendance = useMutation({
    mutationFn: async ({ attendeeId, attended }: { attendeeId: number; attended: boolean }) => {
      const response = await apiRequest('PUT', `/api/workdays/0/attendees/${attendeeId}`, { attended });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/workdays'] });
      toast({
        title: "Success",
        description: "Attendance marked successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to mark attendance",
        variant: "destructive",
      });
    },
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const isUserRegistered = (workDayId: number) => {
    return userAttendance?.some((a: any) => a.workDayId === workDayId);
  };

  const getSortedWorkDays = () => {
    if (!workDays) return { upcoming: [], past: [] };
    
    const now = new Date();
    const upcoming = workDays
      .filter((wd: any) => new Date(wd.date) >= now)
      .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    const past = workDays
      .filter((wd: any) => new Date(wd.date) < now)
      .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    return { upcoming, past };
  };

  const { upcoming, past } = getSortedWorkDays();

  const onSubmitNewWorkDay = (values: WorkDayFormValues) => {
    createWorkDay.mutate({
      title: values.title,
      date: new Date(values.date).toISOString(),
      description: values.description || undefined,
      maxAttendees: values.maxAttendees,
    });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-heading font-semibold">Work Days</h2>
        {canManageWorkDays && (
          <Button onClick={() => setDialogOpen(true)}>
            <CalendarPlus className="mr-2 h-4 w-4" />
            Create Work Day
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming Work Days</TabsTrigger>
          <TabsTrigger value="past">Past Work Days</TabsTrigger>
          <TabsTrigger value="my-attendance">My Attendance</TabsTrigger>
        </TabsList>
        
        <TabsContent value="upcoming" className="space-y-4">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4">Loading work days...</p>
            </div>
          ) : upcoming && upcoming.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcoming.map((workDay: any) => (
                <Card key={workDay.id}>
                  <CardHeader>
                    <CardTitle>{workDay.title}</CardTitle>
                    <CardDescription className="flex items-center mt-1">
                      <Calendar className="h-4 w-4 mr-1" />
                      {formatDate(workDay.date)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center text-sm text-gray-500">
                      <Clock className="h-4 w-4 mr-1" />
                      {formatTime(workDay.date)}
                    </div>
                    {workDay.maxAttendees && (
                      <div className="flex items-center text-sm text-gray-500">
                        <Users className="h-4 w-4 mr-1" />
                        Max Attendees: {workDay.maxAttendees}
                      </div>
                    )}
                    {workDay.description && (
                      <p className="text-sm mt-2">{workDay.description}</p>
                    )}
                  </CardContent>
                  <CardFooter>
                    {isUserRegistered(workDay.id) ? (
                      <Button variant="outline" disabled className="w-full">
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Registered
                      </Button>
                    ) : (
                      <Button 
                        className="w-full"
                        onClick={() => registerWorkDay.mutate(workDay.id)}
                        disabled={registerWorkDay.isPending}
                      >
                        Register
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No upcoming work days scheduled.
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="past" className="space-y-4">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4">Loading work days...</p>
            </div>
          ) : past && past.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {past.map((workDay: any) => (
                <Card key={workDay.id} className="opacity-75">
                  <CardHeader>
                    <CardTitle>{workDay.title}</CardTitle>
                    <CardDescription className="flex items-center mt-1">
                      <Calendar className="h-4 w-4 mr-1" />
                      {formatDate(workDay.date)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center text-sm text-gray-500">
                      <Clock className="h-4 w-4 mr-1" />
                      {formatTime(workDay.date)}
                    </div>
                    {workDay.description && (
                      <p className="text-sm mt-2">{workDay.description}</p>
                    )}
                  </CardContent>
                  <CardFooter>
                    <Badge variant="secondary" className="w-full justify-center py-1">
                      Completed
                    </Badge>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No past work days found.
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="my-attendance">
          <Card>
            <CardHeader>
              <CardTitle>My Work Day Attendance</CardTitle>
              <CardDescription>
                Track your participation in community work days
              </CardDescription>
            </CardHeader>
            <CardContent>
              {userAttendance && userAttendance.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Work Day</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {userAttendance.map((attendance: any) => {
                      const workDay = workDays?.find((wd: any) => wd.id === attendance.workDayId);
                      if (!workDay) return null;
                      
                      return (
                        <TableRow key={attendance.id}>
                          <TableCell className="font-medium">{workDay.title}</TableCell>
                          <TableCell>{formatDate(workDay.date)}</TableCell>
                          <TableCell>
                            {attendance.attended ? (
                              <Badge variant="success">Attended</Badge>
                            ) : new Date(workDay.date) < new Date() ? (
                              <Badge variant="error">Missed</Badge>
                            ) : (
                              <Badge variant="secondary">Registered</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  You haven't registered for any work days yet.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Work Day Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Work Day</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitNewWorkDay)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Spring Cleanup" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date and Time</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Details about this work day..."
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="maxAttendees"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Maximum Attendees</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" {...field} />
                    </FormControl>
                    <FormDescription>
                      Leave empty for unlimited spots
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            
              <DialogFooter>
                <Button type="submit" disabled={createWorkDay.isPending}>
                  {createWorkDay.isPending ? "Creating..." : "Create Work Day"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
