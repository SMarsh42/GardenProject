import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Toast } from "@/components/ui/toast";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useApplications } from "@/hooks/useApplications";

// Form schema
const applicationSchema = z.object({
  applicationType: z.enum(["new", "returning"], {
    required_error: "Application type is required",
  }),
  plotId: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof applicationSchema>;

export default function ApplicationForm() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const { createApplication } = useApplications();
  const [submitting, setSubmitting] = useState(false);

  // Fetch available plots
  const { data: availablePlots, isLoading: loadingPlots } = useQuery({
    queryKey: ['/api/plots/available'],
    queryFn: async () => {
      const res = await fetch('/api/plots/available', {
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Failed to fetch available plots');
      return res.json();
    },
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      applicationType: "new",
      notes: "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to submit an application",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      // Convert plotId to number if it exists
      const plotId = values.plotId ? parseInt(values.plotId) : undefined;
      
      // Determine priority (returning gardeners get high priority)
      const priority = values.applicationType === "returning" ? "high" : "standard";
      
      const applicationData = {
        userId: user.id,
        plotId,
        applicationType: values.applicationType,
        priority,
        notes: values.notes,
        status: "pending",
      };
      
      await createApplication.mutateAsync(applicationData);
      
      toast({
        title: "Application Submitted",
        description: "Your garden plot application has been submitted successfully.",
      });
      
      navigate("/");
    } catch (error) {
      console.error("Error submitting application:", error);
      toast({
        title: "Submission Error",
        description: "There was a problem submitting your application. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-heading font-semibold mb-6">Garden Plot Application</h2>
      
      <Card>
        <CardHeader>
          <CardTitle>Apply for a Garden Plot</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="applicationType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gardener Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select gardener type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="new">New Gardener</SelectItem>
                        <SelectItem value="returning">Returning Gardener</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Returning gardeners receive higher priority in the plot assignment process.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="plotId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preferred Plot (Optional)</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a plot (optional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {loadingPlots ? (
                          <SelectItem value="" disabled>
                            Loading plots...
                          </SelectItem>
                        ) : availablePlots && availablePlots.length > 0 ? (
                          [
                            <SelectItem key="none" value="">
                              No preference
                            </SelectItem>,
                            ...availablePlots.map((plot: any) => (
                              <SelectItem key={plot.id} value={plot.id.toString()}>
                                {plot.plotNumber} ({plot.size})
                              </SelectItem>
                            )),
                          ]
                        ) : (
                          <SelectItem value="" disabled>
                            No plots available
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      If you have a specific plot in mind, you can select it here.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Any additional information or special requests..."
                        className="min-h-[120px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Include any special requirements or information that may help with your application.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/")}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={submitting}
                >
                  {submitting ? "Submitting..." : "Submit Application"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
