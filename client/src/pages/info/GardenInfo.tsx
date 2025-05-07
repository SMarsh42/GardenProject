import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Mail, Phone, MapPin } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useQuery } from "@tanstack/react-query";

export default function GardenInfo() {
  // Fetch users to get committee members
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

  // Filter to get committee members and manager
  const committeeMembers = users?.filter((user: any) => 
    user.role === "committee" || user.role === "manager"
  ) || [];

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <div>
      <h2 className="text-2xl font-heading font-semibold mb-6">Garden Information</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl text-primary">About Our Community Garden</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                Our community garden was established in 2010 to provide local residents with space to grow their own fresh produce and flowers. The garden spans 2 acres and includes 50 individual plots, communal herb gardens, and a shared orchard area.
              </p>
              <p className="text-gray-700">
                We are committed to sustainable gardening practices and fostering a sense of community among our gardeners. The garden operates from April through October each year, with applications for plots opening in January.
              </p>
              <p className="text-gray-700">
                The garden is managed by a volunteer committee of experienced gardeners who oversee plot assignments, organize work days, and maintain common areas.
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-xl text-primary">Garden Rules</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-gray-700 list-disc pl-5">
                <li>Plots must be planted by May 15th and kept maintained throughout the season.</li>
                <li>Gardeners must attend at least 2 community work days per season.</li>
                <li>Organic gardening practices are required - no synthetic pesticides or fertilizers.</li>
                <li>Water conservation methods should be practiced at all times.</li>
                <li>Harvest only from your own plot unless given permission.</li>
                <li>Keep pathways clear and maintain the areas around your plot.</li>
                <li>Permanent structures require prior approval from the garden committee.</li>
                <li>End of season cleanup must be completed by October 31st.</li>
              </ul>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-xl text-primary">Frequently Asked Questions</CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger>How much does a plot cost?</AccordionTrigger>
                  <AccordionContent>
                    Standard plots (10'x10') cost $45 per season. Large plots (10'x20') cost $75 per season. The fee includes water access, shared tools, and compost.
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="item-2">
                  <AccordionTrigger>When can I apply for a plot?</AccordionTrigger>
                  <AccordionContent>
                    Applications open January 15th each year. Current gardeners have until February 15th to renew their plots. New gardener applications are then processed in the order received.
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="item-3">
                  <AccordionTrigger>What are the work day requirements?</AccordionTrigger>
                  <AccordionContent>
                    Each gardener must participate in at least 2 of the 6 scheduled work days throughout the season. Work days typically last 3 hours and involve maintaining common areas, fixing infrastructure, and community projects.
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="item-4">
                  <AccordionTrigger>Are tools provided?</AccordionTrigger>
                  <AccordionContent>
                    The garden has a shared tool shed with basic gardening equipment (shovels, rakes, hoes, wheelbarrows). Gardeners are welcome to bring their own tools, but please label them clearly and do not leave personal tools in the communal shed.
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="item-5">
                  <AccordionTrigger>What happens if I can't maintain my plot?</AccordionTrigger>
                  <AccordionContent>
                    If you are unable to maintain your plot due to illness, travel, or other circumstances, please notify the garden committee. We can often arrange temporary help. Plots that show signs of neglect (excessive weeds, unharvested produce) for more than 2 weeks may receive a warning. After 2 warnings, plots may be reassigned.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </div>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl text-primary">Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start">
                <Mail className="h-5 w-5 text-gray-500 mr-3 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Email</p>
                  <p className="text-gray-600">info@communitygardenmanager.org</p>
                </div>
              </div>
              <div className="flex items-start">
                <Phone className="h-5 w-5 text-gray-500 mr-3 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Phone</p>
                  <p className="text-gray-600">(555) 123-4567</p>
                </div>
              </div>
              <div className="flex items-start">
                <MapPin className="h-5 w-5 text-gray-500 mr-3 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Location</p>
                  <p className="text-gray-600">123 Garden Way, Greenville, CA 98765</p>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-200">
                <h4 className="font-medium text-gray-800">Garden Hours</h4>
                <p className="text-gray-600 mt-2">Dawn to Dusk, 7 days a week</p>
                <p className="text-gray-600 mt-1">April 1 - October 31</p>
                <p className="text-sm text-gray-500 italic mt-2">Gates are locked during off-hours.</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-xl text-primary">Garden Committee</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                {committeeMembers.length > 0 ? (
                  committeeMembers.map((member: any) => (
                    <li key={member.id} className="flex items-center">
                      <Avatar className="mr-3">
                        <AvatarFallback className="bg-primary-light bg-opacity-20 text-primary">
                          {getInitials(member.firstName, member.lastName)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-gray-800">
                          {member.firstName} {member.lastName}
                        </p>
                        <p className="text-sm text-gray-600">
                          {member.role === "manager" ? "Garden Manager" : "Committee Member"}
                        </p>
                      </div>
                    </li>
                  ))
                ) : (
                  <>
                    <li className="flex items-center">
                      <Avatar className="mr-3">
                        <AvatarFallback className="bg-primary-light bg-opacity-20 text-primary">
                          SB
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-gray-800">Sarah Baker</p>
                        <p className="text-sm text-gray-600">Garden Manager</p>
                      </div>
                    </li>
                    <li className="flex items-center">
                      <Avatar className="mr-3">
                        <AvatarFallback className="bg-primary-light bg-opacity-20 text-primary">
                          DM
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-gray-800">David Martinez</p>
                        <p className="text-sm text-gray-600">Committee Treasurer</p>
                      </div>
                    </li>
                    <li className="flex items-center">
                      <Avatar className="mr-3">
                        <AvatarFallback className="bg-primary-light bg-opacity-20 text-primary">
                          LW
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-gray-800">Lisa Wong</p>
                        <p className="text-sm text-gray-600">Events Coordinator</p>
                      </div>
                    </li>
                  </>
                )}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
