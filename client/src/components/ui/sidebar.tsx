import { cn } from "@/lib/utils";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";

interface NavItemProps {
  href: string;
  icon: string;
  children: React.ReactNode;
  active?: boolean;
}

export function NavItem({ href, icon, children, active }: NavItemProps) {
  return (
    <Link href={href}>
      <a
        className={cn(
          "flex items-center space-x-2 px-4 py-2.5 rounded-lg",
          active
            ? "bg-green-800 text-white"
            : "bg-black-800 text-white hover:text-green-400"
        )}
      >
        <span className="material-icons text-sm">{icon}</span>
        <span>{children}</span>
      </a>
    </Link>
  );
}

interface SidebarSectionProps {
  title: string;
  children: React.ReactNode;
}

export function SidebarSection({ title, children }: SidebarSectionProps) {
  return (
    <div className="space-y-2">
      <h3 className="text-xs uppercase tracking-wider text-gray-300">{title}</h3>
      {children}
    </div>
  );
}

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <aside className={cn("fixed z-10 inset-y-0 left-0 w-64 bg-gray-900 text-white shadow-lg transform md:translate-x-0", className)}>
      <div className="p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-green-400">Garden Manager</h1>
        </div>
        
        <div className="mt-8 space-y-4">
          <SidebarSection title="Main">
            <NavItem href="/dashboard" icon="" active={location === "/dashboard"}>
              Dashboard
            </NavItem>
            <NavItem href="/applications" icon="" active={location === "/applications"}>
              Applications
            </NavItem>
            <NavItem href="/garden-layout" icon="" active={location === "/garden-layout"}>
              Garden Layout
            </NavItem>
            <NavItem href="/work-days" icon="" active={location === "/work-days"}>
              Work Days
            </NavItem>
          </SidebarSection>
          
          <SidebarSection title="Communication">
            <NavItem href="/messages" icon="" active={location === "/messages"}>
              Messages
            </NavItem>
            <NavItem href="/forum" icon="" active={location === "/forum"}>
              Q&A Forum
            </NavItem>
          </SidebarSection>
          {user.role === "gardener" && (
            <SidebarSection title="My Account">
              <NavItem href="/gardener-payments" icon="" active={location === "/gardener-payments"}>
                My Payments
              </NavItem>
            </SidebarSection>
          )}

          <SidebarSection title="Administration">
            {(user.role === "manager" || user.role === "committee") && (
              <NavItem href="/payments" icon="" active={location === "/payments"}>
                Payments
              </NavItem>
            )}
            <NavItem href="/settings" icon="" active={location === "/settings"}>
              Settings
            </NavItem>
          </SidebarSection>
        </div>
      </div>
      
      <div className="absolute bottom-0 w-full p-4 border-t border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-green-700 flex items-center justify-center">
            <span className="material-icons">GM</span>
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-medium">{`${user.firstName} ${user.lastName}`}</h4>
            <p className="text-xs text-gray-400">{user.role.charAt(0).toUpperCase() + user.role.slice(1)}</p>
          </div>
          <button 
            className="text-gray-400 hover:text-green-400 focus:outline-none"
            onClick={logout}
          >
            <span className="material-icons text-sm">logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
