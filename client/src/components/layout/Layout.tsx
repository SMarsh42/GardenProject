import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import Header from "./Header";
import Sidebar from "./Sidebar";
import { useAuth } from "@/hooks/useAuth";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user, loading } = useAuth();
  const [location, navigate] = useLocation();

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Check if user is authenticated and redirect to login if not
  useEffect(() => {
    if (!loading && !user && location !== "/login" && location !== "/register") {
      navigate("/login");
    }
  }, [user, loading, location, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-light">
      <Header toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />
      
      <div className="flex">
        <Sidebar isSidebarOpen={isSidebarOpen} />
        
        <div className="flex-1 md:ml-64 p-4 mt-2">
          {children}
        </div>
      </div>
    </div>
  );
}
