import { useLocation, Link } from "wouter";
import {
  Home,
  ClipboardList,
  Grid,
  DollarSign,
  Calendar,
  MessageSquare,
  Globe,
  Info,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

interface SidebarProps {
  isSidebarOpen: boolean;
}

export default function Sidebar({ isSidebarOpen }: SidebarProps) {
  const [location] = useLocation();
  const { user } = useAuth();

  const isManager = user?.role === "manager";
  const isCommittee = user?.role === "committee";
  const isManagerOrCommittee = isManager || isCommittee;

  const sidebarLinks = [
    {
      title: "Dashboard",
      href: "/",
      icon: <Home className="h-5 w-5 mr-3" />,
      allowedRoles: ["manager", "committee", "gardener"],
    },
    {
      title: "Applications",
      href: "/applications",
      icon: <ClipboardList className="h-5 w-5 mr-3" />,
      allowedRoles: ["manager", "committee"],
    },
    {
      title: "Plot Management",
      href: "/plots",
      icon: <Grid className="h-5 w-5 mr-3" />,
      allowedRoles: ["manager", "committee"],
    },
    {
      title: "Payments",
      href: "/payments",
      icon: <DollarSign className="h-5 w-5 mr-3" />,
      allowedRoles: ["manager", "committee"],
    },
    {
      title: "My Payments",
      href: "/gardener-payments",
      icon: <DollarSign className="h-5 w-5 mr-3" />,
      allowedRoles: ["gardener"],
    },
    {
      title: "Work Days",
      href: "/workdays",
      icon: <Calendar className="h-5 w-5 mr-3" />,
      allowedRoles: ["manager", "committee"],
    },
    {
      title: "Forum",
      href: "/forum",
      icon: <MessageSquare className="h-5 w-5 mr-3" />,
      allowedRoles: ["manager", "committee", "gardener"],
    },
    {
      title: "Garden Layout",
      href: "/garden",
      icon: <Globe className="h-5 w-5 mr-3" />,
      allowedRoles: ["manager", "committee", "gardener"],
    },
    {
      title: "Garden Info",
      href: "/info",
      icon: <Info className="h-5 w-5 mr-3" />,
      allowedRoles: ["manager", "committee", "gardener"],
    },
    {
      title: "User Management",
      href: "/users",
      icon: <Users className="h-5 w-5 mr-3" />,
      allowedRoles: ["manager"],
    },
  ];

  // Filter links based on user role
  const filteredLinks = sidebarLinks.filter(link => {
    if (!user) return false;
    return link.allowedRoles.includes(user.role);
  });

  return (
    <aside
      className={cn(
        "bg-white fixed md:relative md:col-span-1 w-64 h-screen shadow-md z-20 transition-transform duration-300 ease-in-out",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}
    >
      <div className="py-4 px-3">
        <nav className="mt-5 space-y-1">
          {filteredLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              <a
                className={cn(
                  "flex items-center px-4 py-3 w-full rounded-md",
                  location === link.href
                    ? "bg-primary-light text-white"
                    : "text-gray-700 hover:bg-gray-100"
                )}
              >
                {link.icon}
                {link.title}
              </a>
            </Link>
          ))}
        </nav>
      </div>
    </aside>
  );
}
