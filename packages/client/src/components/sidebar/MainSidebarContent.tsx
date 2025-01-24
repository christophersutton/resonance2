import { Users, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { NewClientDialog } from "../NewClientDialog";
import { useClient } from "@/contexts/ClientContext";
import { Separator } from "../ui/separator";
import { cn } from "@/lib/utils";

type MainSidebarContentProps = {
  isCollapsed: boolean;
  isMobile: boolean;
  onToggleCollapse?: () => void;
};

export const MainSidebarContent = ({ 
  isCollapsed, 
  isMobile,
  onToggleCollapse 
}: MainSidebarContentProps) => {
  const { clients, selectedClient, setSelectedClient, isLoading, error } = useClient();

  return (
    <>
      <div className="p-4 flex items-center justify-between border-b border-gray-700">
        {!isCollapsed && <h1 className="text-xl font-bold">DevCRM</h1>}
        {!isMobile && (
          <button
            onClick={onToggleCollapse}
            className="p-2 hover:bg-crm-sidebar-hover rounded-lg text-white"
          >
            {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          {!isCollapsed && (
            <h2 className="text-sm uppercase text-gray-400 mb-2">
              Clients ({clients.length})
            </h2>
          )}
          <div className="space-y-1">
            {isLoading ? (
              <div className="text-gray-400 text-sm px-4 py-2">Loading clients...</div>
            ) : error ? (
              <div className="text-red-400 text-sm px-4 py-2">Error: {error.message}</div>
            ) : clients.length === 0 ? (
              <div className="text-gray-400 text-sm px-4 py-2">No clients found</div>
            ) : (
              <>
                {clients.map((client) => {
                  return (
                    <button
                      key={client.id}
                      onClick={() => setSelectedClient(client)}
                      className={cn(
                        "w-full flex items-center px-4 py-2 transition-colors truncate",
                        selectedClient?.id === client.id
                          ? "text-blue-500"
                          : "text-gray-300 hover:text-white",
                        isCollapsed ? "justify-center" : "justify-between"
                      )}
                    >
                      <div className={cn(
                        "flex items-center min-w-0",
                        isCollapsed && "justify-center"
                      )}>
                        <Users size={20} className="shrink-0" />
                        {!isCollapsed && (
                          <span className="ml-3 truncate">
                            {client.organizationName || 'Unnamed Client'}
                          </span>
                        )}
                      </div>
                      {!isCollapsed && client.unreadMessages > 0 && (
                        <span className="bg-blue-500 text-white px-2 py-0.5 rounded-full text-xs shrink-0 ml-2">
                          {client.unreadMessages}
                        </span>
                      )}
                    </button>
                  );
                })}
              </>
            )}
          </div>
          <Separator className="my-4 bg-gray-700" />
          {isCollapsed ? (
            <button
              className="w-full flex items-center justify-center p-2 rounded-lg hover:bg-crm-sidebar-hover transition-colors"
            >
              <Plus size={20} />
            </button>
          ) : (
            <NewClientDialog />
          )}
        </div>
      </div>
    </>
  );
};