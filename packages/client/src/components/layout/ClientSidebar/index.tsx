import { Menu } from "lucide-react";
import { useState, useEffect } from "react";
import { MobileSheetWrapper } from "../../../components/mobile/MobileSheetWrapper";
import { ClientMenuItems } from "./ClientMenuItems";

export const ClientSidebar = () => {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const SidebarContent = () => (
    <div className="w-full h-full bg-white border-r border-gray-200 p-4">
      <ClientMenuItems />
    </div>
  );

  if (isMobile) {
    return (
      <div className="fixed top-0 right-0 z-50 p-2">
        <MobileSheetWrapper
          trigger={<Menu className="h-5 w-5 text-white" />}
          side="right"
          className="w-64 p-0"
        >
          <SidebarContent />
        </MobileSheetWrapper>
      </div>
    );
  }

  return (
    <div className="w-64 h-screen">
      <SidebarContent />
    </div>
  );
}; 