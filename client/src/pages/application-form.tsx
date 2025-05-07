import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";

export default function ApplicationForm() {
  const [location, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [applicationData, setApplicationData] = useState({
    gardenerType: "new",
    preferredArea: "",
    specialRequests: "",
    gardeningExperience: ""
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Authentication Error",
        description: "You must be logged in to submit an application.",
        variant: "destructive"
      });
      navigate("/login");
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      await apiRequest('POST', '/api/applications', applicationData);
      
      toast({
        title: "Application Submitted",
        description: "Your garden plot application has been submitted successfully.",
      });
      
      navigate("/applications");
    } catch (err: any) {
      toast({
        title: "Submission Failed",
        description: err.message || "An error occurred while submitting your application",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Garden Plot Application</h1>
        <p className="text-gray-600">Apply for a garden plot in our community garden</p>
      </div>
      
      <div className="max-w-3xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Plot Application Form</CardTitle>
            <CardDescription>
              Please fill out this form to apply for a garden plot. All fields marked with * are required.
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label className="text-base font-medium">Gardener Type *</Label>
                <p className="text-sm text-gray-500 mb-2">
                  Are you a new gardener or returning from previous years?
                </p>
                <RadioGroup 
                  value={applicationData.gardenerType}
                  onValueChange={(value) => setApplicationData({...applicationData, gardenerType: value})}
                  className="flex flex-col space-y-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="new" id="gardener-new" />
                    <Label htmlFor="gardener-new" className="font-normal">New Gardener</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="returning" id="gardener-returning" />
                    <Label htmlFor="gardener-returning" className="font-normal">Returning Gardener</Label>
                  </div>
                </RadioGroup>
              </div>
              
              <div>
                <Label htmlFor="preferred-area">Preferred Garden Area</Label>
                <p className="text-sm text-gray-500 mb-2">
                  If you have a preference for a specific garden area, please select it below.
                </p>
                <Select 
                  value={applicationData.preferredArea}
                  onValueChange={(value) => setApplicationData({...applicationData, preferredArea: value})}
                >
                  <SelectTrigger id="preferred-area">
                    <SelectValue placeholder="Select preferred area (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No Preference</SelectItem>
                    <SelectItem value="Area A">Area A (Sunny)</SelectItem>
                    <SelectItem value="Area B">Area B (Partial Shade)</SelectItem>
                    <SelectItem value="Area C">Area C (Near Water Source)</SelectItem>
                    <SelectItem value="Area D">Area D (Accessible Path)</SelectItem>
                    <SelectItem value="Area E">Area E (Quiet Corner)</SelectItem>
                    <SelectItem value="Area F">Area F (Community Area)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="special-requests">Special Requests</Label>
                <p className="text-sm text-gray-500 mb-2">
                  Do you have any special requests or requirements for your garden plot?
                </p>
                <Textarea
                  id="special-requests"
                  placeholder="E.g., I need a plot with good drainage, or I would prefer to be near other tomato growers."
                  value={applicationData.specialRequests}
                  onChange={(e) => setApplicationData({...applicationData, specialRequests: e.target.value})}
                  rows={3}
                />
              </div>
              
              <div>
                <Label htmlFor="gardening-experience">Gardening Experience</Label>
                <p className="text-sm text-gray-500 mb-2">
                  Please briefly describe your gardening experience and what you plan to grow.
                </p>
                <Textarea
                  id="gardening-experience"
                  placeholder="E.g., I've been growing vegetables for 2 years at home. I plan to grow tomatoes, peppers, and herbs."
                  value={applicationData.gardeningExperience}
                  onChange={(e) => setApplicationData({...applicationData, gardeningExperience: e.target.value})}
                  rows={4}
                />
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                <h3 className="text-sm font-medium text-yellow-800">Work Day Commitment</h3>
                <p className="text-sm text-yellow-700 mt-1">
                  By submitting this application, you acknowledge that you're required to participate in at least 2 community work days per year to maintain your plot privileges.
                </p>
              </div>
            
              <div className="flex justify-end space-x-4">
                <Button variant="outline" type="button" onClick={() => navigate('/applications')}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Submitting..." : "Submit Application"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
