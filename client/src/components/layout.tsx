import { useEffect, useState } from "react";
import { Sidebar } from "@/components/ui/sidebar";
import TopNav from "@/components/top-nav";
import MobileSidebar from "@/components/mobile-sidebar";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user, isLoading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [location, setLocation] = useLocation();

  // Redirect unauthenticated users to login
  useEffect(() => {
    if (!isLoading && !user && location !== '/login' && location !== '/register') {
      setLocation('/login');
    }
  }, [user, isLoading, location, setLocation]);

  // Redirect authenticated users away from auth pages
  useEffect(() => {
    if (!isLoading && user && (location === '/login' || location === '/register')) {
      setLocation('/dashboard');
    }
  }, [user, isLoading, location, setLocation]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // For auth pages, don't show sidebar or top nav
  if (location === '/login' || location === '/register') {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Desktop Sidebar */}
      <Sidebar className="hidden md:block" />
      
      {/* Mobile Sidebar */}
      <MobileSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content */}
      <div className="flex-1 md:ml-64">
        <TopNav onMenuClick={() => setSidebarOpen(true)} />
        
        <main className="text-black">
          {children}
        </main>

        <footer className="bg-white mt-8 py-4 border-t border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-center text-sm text-gray-500">© {new Date().getFullYear()} Community Garden Management System</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
