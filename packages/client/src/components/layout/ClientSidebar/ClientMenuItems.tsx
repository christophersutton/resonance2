import { MessageSquare, FileText, Settings, ListTodo } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { Separator } from "@/components/ui/separator";
import { useClient } from "@/contexts/ClientContext";
import { cn } from "@/lib/utils";

export const ClientMenuItems = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedClient } = useClient();

  const menuItems = [
    { icon: MessageSquare, label: "Messages", path: `/clients/${selectedClient?.id}/messages` },
    { icon: ListTodo, label: "Tasks", path: `/clients/${selectedClient?.id}/tasks` },
    { icon: FileText, label: "Documents", path: `/clients/${selectedClient?.id}/documents` },
    { icon: Settings, label: "Settings", path: `/clients/${selectedClient?.id}/settings` },
  ];

  return (
    <div className="space-y-2">
      {menuItems.map(({ icon: Icon, label, path }) => {
        const isActive = location.pathname === path;
        return (
          <button
            key={path}
            onClick={() => navigate(path)}
            className={cn(
              "w-full flex items-center p-2 rounded-lg transition-colors",
              "hover:bg-gray-100 dark:hover:bg-gray-800",
              isActive && "bg-primary/10 text-primary hover:bg-primary/20 dark:bg-primary/20 dark:hover:bg-primary/30"
            )}
          >
            <Icon className={cn("h-5 w-5 mr-3", isActive ? "text-primary" : "text-gray-500")} />
            <span>{label}</span>
          </button>
        );
      })}
      <Separator className="my-4" />
    </div>
  );
}; 