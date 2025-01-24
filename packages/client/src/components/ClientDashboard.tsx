import { ClientCard } from "./ClientCard";
import { Clock, FileText, MessageSquare, DollarSign } from "lucide-react";

export const ClientDashboard = () => {
  return (
    <div className="flex-1 p-8 bg-crm-content-bg">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Client Overview</h1>
        <p className="text-gray-500">Welcome back! Here's what's happening.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <ClientCard
          title="Active Projects"
          value="12"
          icon={<Clock size={24} />}
        />
        <ClientCard
          title="Documents"
          value="34"
          icon={<FileText size={24} />}
        />
        <ClientCard
          title="Messages"
          value="27"
          icon={<MessageSquare size={24} />}
        />
        <ClientCard
          title="Revenue"
          value="$45,231"
          icon={<DollarSign size={24} />}
        />
      </div>
    </div>
  );
};