import { useState, useEffect } from "react";
import { Users } from "lucide-react";
import { useClient } from "../../../contexts/ClientContext";
import { cn } from "../../../lib/utils";
import { MobileSheetWrapper } from "../../../components/mobile/MobileSheetWrapper";

type MainSidebarProps = {
  children: (props: {
    isCollapsed: boolean;
    isMobile: boolean;
    onToggleCollapse?: () => void;
  }) => React.ReactNode;
  mobileHeader?: React.ReactNode;
};

export const MainSidebar = ({ 
  children,
  mobileHeader: customMobileHeader 
}: MainSidebarProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { selectedClient } = useClient();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setIsCollapsed(true);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const defaultMobileHeader = (
    <div className="flex items-center text-white w-full">
      <Users className="mr-2" size={20} />
      {selectedClient?.organizationName || "Select Client"}
    </div>
  );

  if (isMobile) {
    return (
      <div className="fixed top-0 left-0 w-full z-50 bg-crm-sidebar-bg text-white p-2">
        <MobileSheetWrapper
          trigger={customMobileHeader || defaultMobileHeader}
          side="left"
          className="bg-crm-sidebar-bg text-white border-r border-gray-700"
        >
          {children({ 
            isCollapsed: false, 
            isMobile: true,
            onToggleCollapse: undefined
          })}
        </MobileSheetWrapper>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "h-screen bg-crm-sidebar-bg text-white transition-all duration-200 flex flex-col",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      {children({ 
        isCollapsed, 
        isMobile: false,
        onToggleCollapse: () => setIsCollapsed(!isCollapsed)
      })}
    </div>
  );
}; 