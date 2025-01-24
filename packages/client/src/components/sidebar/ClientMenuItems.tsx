import { MessageSquare, FileText, Settings, ListTodo, InboxIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Separator } from "../ui/separator";
import { useClient } from "../../contexts/ClientContext";
import { useSidebar } from "../ui/sidebar";

export const ClientMenuItems = () => {
  const navigate = useNavigate();
  const { selectedClient } = useClient();
  const { state } = useSidebar();
  const isMainSidebarCollapsed = state === "collapsed";
  
  const topMenuItem = { icon: InboxIcon, label: "Inbox", badge: "8", path: "/inbox" };
  
  const menuItems = [
    { icon: MessageSquare, label: "Messages", badge: "3", path: "/messages" },
    { icon: ListTodo, label: "Tasks", badge: "5", path: "/tasks" },
    { icon: FileText, label: "Documents", path: "/documents" },
  ];

  const settingsItem = { icon: Settings, label: "Settings", path: "/settings" };

  return (
    <div className="space-y-4">
      {isMainSidebarCollapsed && selectedClient && (
        <div className="px-2 py-4">
          <h2 className="text-lg font-semibold text-gray-700">{selectedClient.firstName}</h2>
        </div>
      )}

      <button
        onClick={() => navigate(topMenuItem.path)}
        className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-700"
      >
        <div className="flex items-center">
          <topMenuItem.icon size={20} />
          <span className="ml-2">{topMenuItem.label}</span>
        </div>
        {topMenuItem.badge && (
          <span className="bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full text-xs font-medium">
            {topMenuItem.badge}
          </span>
        )}
      </button>

      <Separator className="my-2" />

      <div className="space-y-1">
        {menuItems.map((item) => (
          <button
            key={item.label}
            onClick={() => navigate(item.path)}
            className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-700"
          >
            <div className="flex items-center">
              <item.icon size={20} />
              <span className="ml-2">{item.label}</span>
            </div>
            {item.badge && (
              <span className="bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full text-xs font-medium">
                {item.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      <Separator className="my-2" />

      <button
        onClick={() => navigate(settingsItem.path)}
        className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-700"
      >
        <div className="flex items-center">
          <settingsItem.icon size={20} />
          <span className="ml-2">{settingsItem.label}</span>
        </div>
      </button>
    </div>
  );
};