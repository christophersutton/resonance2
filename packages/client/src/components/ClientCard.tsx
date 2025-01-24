import { Card } from "../components/ui/card";

interface ClientCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
}

export const ClientCard = ({ title, value, icon }: ClientCardProps) => {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-semibold mt-1">{value}</p>
        </div>
        <div className="text-blue-500">{icon}</div>
      </div>
    </Card>
  );
};