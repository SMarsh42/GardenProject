import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const [location, navigate] = useLocation();
  const { login, error } = useAuth();
  const { toast } = useToast();
  const [credentials, setCredentials] = useState({
    username: "",
    password: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!credentials.username || !credentials.password) {
      toast({
        title: "Validation Error",
        description: "Please enter both username and password.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      await login(credentials);
      navigate("/dashboard");
    } catch (err: any) {
      toast({
        title: "Login Failed",
        description: err.message || "Invalid username or password",
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
            <CardTitle className="text-2xl">Sign In</CardTitle>
            <CardDescription>
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={credentials.username}
                  onChange={(e) => setCredentials({...credentials, username: e.target.value})}
                  placeholder="Enter your username"
                  autoComplete="username"
                />
              </div>
              
              <div>
                <div className="flex justify-between items-center">
                  <Label htmlFor="password">Password</Label>
                  <Link href="#forgot-password" className="text-xs text-primary hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={credentials.password}
                  onChange={(e) => setCredentials({...credentials, password: e.target.value})}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                />
              </div>
              
              {error && (
                <div className="text-sm text-red-500">
                  {error}
                </div>
              )}
              
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Signing In..." : "Sign In"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="justify-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{" "}
              <Link href="/register" className="text-primary hover:underline">
                Register
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
