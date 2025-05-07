import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

export default function Register() {
  const [location, navigate] = useLocation();
  const { register } = useAuth();
  const { toast } = useToast();
  const [userData, setUserData] = useState({
    username: "",
    password: "",
    confirmPassword: "",
    email: "",
    firstName: "",
    lastName: "",
    phone: "",
    address: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!userData.username || !userData.password || !userData.email || !userData.firstName || !userData.lastName) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }
    
    if (userData.password !== userData.confirmPassword) {
      toast({
        title: "Password Error",
        description: "Passwords do not match.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      await register({
        username: userData.username,
        password: userData.password,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        phone: userData.phone,
        address: userData.address,
        role: "gardener" // Default role
      });
      
      toast({
        title: "Registration Successful",
        description: "Your account has been created. You can now login.",
      });
      
      navigate("/login");
    } catch (err: any) {
      toast({
        title: "Registration Failed",
        description: err.message || "An error occurred during registration",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary">Garden Manager</h1>
          <p className="text-gray-600 mt-2">Community Garden Management System</p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Create an Account</CardTitle>
            <CardDescription>
              Register to apply for a garden plot
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={userData.firstName}
                    onChange={(e) => setUserData({...userData, firstName: e.target.value})}
                    placeholder="John"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={userData.lastName}
                    onChange={(e) => setUserData({...userData, lastName: e.target.value})}
                    placeholder="Doe"
                    required
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={userData.email}
                  onChange={(e) => setUserData({...userData, email: e.target.value})}
                  placeholder="john.doe@example.com"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="username">Username *</Label>
                <Input
                  id="username"
                  value={userData.username}
                  onChange={(e) => setUserData({...userData, username: e.target.value})}
                  placeholder="johndoe"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={userData.password}
                    onChange={(e) => setUserData({...userData, password: e.target.value})}
                    placeholder="••••••••"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="confirmPassword">Confirm Password *</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={userData.confirmPassword}
                    onChange={(e) => setUserData({...userData, confirmPassword: e.target.value})}
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={userData.phone}
                  onChange={(e) => setUserData({...userData, phone: e.target.value})}
                  placeholder="(555) 123-4567"
                />
              </div>
              
              <div>
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={userData.address}
                  onChange={(e) => setUserData({...userData, address: e.target.value})}
                  placeholder="123 Garden St, Anytown"
                />
              </div>
              
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Creating Account..." : "Register"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="justify-center">
            <p className="text-sm text-gray-600">
              Already have an account?{" "}
              <Link href="/login" className="text-primary hover:underline">
                Sign In
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
