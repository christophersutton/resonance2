import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { X } from "lucide-react";
import { ReactNode } from "react";

type MobileSheetWrapperProps = {
  children: ReactNode;
  trigger: ReactNode;
  side: "left" | "right";
  className?: string;
};

export const MobileSheetWrapper = ({ 
  children, 
  trigger, 
  side, 
  className = "" 
}: MobileSheetWrapperProps) => {
  return (
    <Sheet>
      <SheetTrigger className="w-full">
        {trigger}
      </SheetTrigger>
      <SheetContent side={side} className={`w-64 p-0 ${className}`}>
        <div className="relative h-full">
          <SheetClose className="absolute right-4 top-4 z-50 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </SheetClose>
          {children}
        </div>
      </SheetContent>
    </Sheet>
  );
};