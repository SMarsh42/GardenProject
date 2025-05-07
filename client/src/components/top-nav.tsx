import { useAuth } from "@/hooks/use-auth";
import NotificationBell from "@/components/ui/notification-bell";

interface TopNavProps {
  onMenuClick: () => void;
}

export default function TopNav({ onMenuClick }: TopNavProps) {
  const { user } = useAuth();

  return (
    <nav className="bg-card shadow-md border-b border-gray-700 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <button 
              className="md:hidden rounded-md p-2 inline-flex items-center justify-center text-black-400 hover:text-white hover:bg-black-700 focus:outline-none"
              onClick={onMenuClick}
              aria-label="Open menu"
            >
              <span className="material-icons">Menu</span>
            </button>
            <h2 className="ml-4 text-lg font-semibold text-white">Community Garden Management</h2>
          </div>
          <div className="flex items-center space-x-4">
            {user && <NotificationBell />}
            <div className="relative">
              <div className="text-sm text-black-300">
                {user ? (
                  <>Welcome, <span className="font-large text-primary">{user.firstName}</span></>
                ) : (
                  <span>Not logged in</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
