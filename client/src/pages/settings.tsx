import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";

export default function Settings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("profile");
  
  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    phone: "",
    address: ""
  });
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    applicationUpdates: true,
    paymentReminders: true,
    workDayReminders: true,
    forumUpdates: false
  });

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    toast({
      title: "Profile Updated",
      description: "Your profile information has been updated successfully.",
    });
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match.",
        variant: "destructive",
      });
      return;
    }
    
    toast({
      title: "Password Updated",
      description: "Your password has been changed successfully.",
    });
    
    setPasswordData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: ""
    });
  };

  const handleNotificationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    toast({
      title: "Notification Settings Updated",
      description: "Your notification preferences have been saved.",
    });
  };

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Settings</h1>
        <p className="text-gray-600">Manage your account and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <Card className="lg:col-span-1">
          <CardContent className="p-4">
            <Tabs orientation="vertical" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
              <TabsList className="flex flex-col h-auto space-y-2">
                <TabsTrigger value="profile" className="w-full justify-start">
                  <span className="material-icons text-sm mr-2">person</span>
                  Profile
                </TabsTrigger>
                <TabsTrigger value="password" className="w-full justify-start">
                  <span className="material-icons text-sm mr-2">lock</span>
                  Password
                </TabsTrigger>
                <TabsTrigger value="notifications" className="w-full justify-start">
                  <span className="material-icons text-sm mr-2">notifications</span>
                  Notifications
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardContent>
        </Card>

        {/* Content */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>
              {activeTab === "profile" ? "Profile Information" : 
               activeTab === "password" ? "Change Password" : 
               "Notification Settings"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Profile Tab */}
            {activeTab === "profile" && (
              <form onSubmit={handleProfileSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input 
                      id="firstName"
                      value={profileData.firstName}
                      onChange={(e) => setProfileData({...profileData, firstName: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input 
                      id="lastName"
                      value={profileData.lastName}
                      onChange={(e) => setProfileData({...profileData, lastName: e.target.value})}
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input 
                    id="email"
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input 
                    id="phone"
                    type="tel"
                    value={profileData.phone}
                    onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                  />
                </div>
                
                <div>
                  <Label htmlFor="address">Address</Label>
                  <Input 
                    id="address"
                    value={profileData.address}
                    onChange={(e) => setProfileData({...profileData, address: e.target.value})}
                  />
                </div>
                
                <div className="flex justify-end">
                  <Button type="submit">
                    Save Changes
                  </Button>
                </div>
              </form>
            )}

            {/* Password Tab */}
            {activeTab === "password" && (
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input 
                    id="currentPassword"
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input 
                    id="newPassword"
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input 
                    id="confirmPassword"
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                    required
                  />
                </div>
                
                <div className="flex justify-end">
                  <Button type="submit">
                    Change Password
                  </Button>
                </div>
              </form>
            )}

            {/* Notifications Tab */}
            {activeTab === "notifications" && (
              <form onSubmit={handleNotificationSubmit} className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium">Email Notifications</h3>
                    <p className="text-sm text-gray-500">Receive emails for important updates</p>
                  </div>
                  <Switch 
                    checked={notificationSettings.emailNotifications}
                    onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, emailNotifications: checked})}
                  />
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Notification Types</h3>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm">Application Updates</p>
                      <p className="text-xs text-gray-500">Updates about your plot applications</p>
                    </div>
                    <Switch 
                      checked={notificationSettings.applicationUpdates}
                      onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, applicationUpdates: checked})}
                      disabled={!notificationSettings.emailNotifications}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm">Payment Reminders</p>
                      <p className="text-xs text-gray-500">Notifications about due and overdue payments</p>
                    </div>
                    <Switch 
                      checked={notificationSettings.paymentReminders}
                      onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, paymentReminders: checked})}
                      disabled={!notificationSettings.emailNotifications}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm">Work Day Reminders</p>
                      <p className="text-xs text-gray-500">Notifications about upcoming work days</p>
                    </div>
                    <Switch 
                      checked={notificationSettings.workDayReminders}
                      onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, workDayReminders: checked})}
                      disabled={!notificationSettings.emailNotifications}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm">Forum Updates</p>
                      <p className="text-xs text-gray-500">Notifications about new answers to your questions</p>
                    </div>
                    <Switch 
                      checked={notificationSettings.forumUpdates}
                      onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, forumUpdates: checked})}
                      disabled={!notificationSettings.emailNotifications}
                    />
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button type="submit">
                    Save Preferences
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
