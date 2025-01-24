import { MainSidebar } from "../components/layout/MainSidebar";
import { MainSidebarContent } from "../components/layout/MainSidebar/MainSidebarContent";
import { ClientSidebar } from "../components/layout/ClientSidebar";
import { Routes, Route, Navigate } from "react-router-dom";
import Messages from "./Messages";
import Tasks from "./Tasks";
import Documents from "./Documents";
import Settings from "./Settings";
import { ClientDashboard } from "../components/ClientDashboard";
import { useClient } from "../contexts/ClientContext";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { selectedClient } = useClient();
  
  if (!selectedClient) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

const Index = () => {
  const { selectedClient } = useClient();

  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      <MainSidebar>
        {(props) => <MainSidebarContent {...props} />}
      </MainSidebar>
      <div className="flex flex-1 pt-14 md:pt-0">
        <ClientSidebar />
        <div className="flex-1 overflow-auto">
          <Routes>
            <Route path="/" element={
              selectedClient ? 
              <Navigate to={`/clients/${selectedClient.id}`} replace /> :
              <div className="flex-1 p-8">Please select a client to continue</div>
            } />
            
            <Route path="/clients/:clientId" element={<ClientDashboard />} />
            
            <Route path="/clients/:clientId/messages" element={<Messages />} />
            
            <Route path="/clients/:clientId/tasks" element={<Tasks />} />
            
            <Route path="/clients/:clientId/documents" element={
              <ProtectedRoute>
                <Documents />
              </ProtectedRoute>
            } />
            
            <Route path="/clients/:clientId/settings" element={<Settings />} />

            {/* Redirect old routes to new client-specific routes */}
            <Route path="/messages" element={
              <Navigate to={selectedClient ? `/clients/${selectedClient.id}/messages` : "/"} replace />
            } />
            <Route path="/tasks" element={
              <Navigate to={selectedClient ? `/clients/${selectedClient.id}/tasks` : "/"} replace />
            } />
            <Route path="/documents" element={
              <Navigate to={selectedClient ? `/clients/${selectedClient.id}/documents` : "/"} replace />
            } />
            <Route path="/settings" element={
              <Navigate to={selectedClient ? `/clients/${selectedClient.id}/settings` : "/"} replace />
            } />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default Index;