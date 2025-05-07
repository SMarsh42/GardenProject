import { cn } from "@/lib/utils";
import { Sidebar } from "@/components/ui/sidebar";

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileSidebar({ isOpen, onClose }: MobileSidebarProps) {
  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <Sidebar
        className={cn(
          "md:hidden z-30",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="absolute top-0 right-0 p-4">
          <button onClick={onClose} className="text-white">
            <span className="material-icons">close</span>
          </button>
        </div>
      </Sidebar>
    </>
  );
}
