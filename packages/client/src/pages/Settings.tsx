import { useClient } from "../contexts/ClientContext";
import { ClientForm } from "../components/ClientForm";
import { useToast } from "../components/ui/use-toast";
import type { ClientFormData } from "../types/client";
import { Button } from "../components/ui/button";
import { Trash2 } from "lucide-react";

const Settings = () => {
  const { selectedClient, refreshClients } = useClient();
  const { toast } = useToast();

  const handleDelete = async () => {
    try {
      const response = await fetch(`http://localhost:3000/api/clients/${selectedClient?.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete client');
      }

      await refreshClients();
      toast({
        title: "Success",
        description: "Client deleted successfully",
        variant: "success"
      });
    } catch (error) {
      console.error('Error deleting client:', error);
      toast({
        title: "Error",
        description: "Failed to delete client",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (data: ClientFormData) => {
    try {
      const response = await fetch(`http://localhost:3000/api/clients/${selectedClient?.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to update client');
      }

      await refreshClients();
      toast({
        title: "Success",
        description: "Client information updated successfully",
        variant: "success"
      });
    } catch (error) {
      console.error('Error updating client:', error);
      toast({
        title: "Error",
        description: "Failed to update client information",
        variant: "destructive",
      });
    }
  };

  if (!selectedClient) {
    return null;
  }

  return (
    <div className="flex-1 p-8 bg-background">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Client Settings</h1>
        <p className="text-muted-foreground">Update client information and preferences</p>
      </div>

      <div className="max-w-2xl space-y-8">
        <ClientForm
          key={selectedClient.id}
          onSubmit={handleSubmit}
          submitLabel="Save Changes"
          defaultValues={{
            organizationName: selectedClient.organizationName,
            firstName: selectedClient.firstName,
            lastName: selectedClient.lastName,
            email: selectedClient.email,
            phone: selectedClient.phone || "",
            services: selectedClient.services,
          }}
        />

        <Button
          variant="destructive"
          className="w-full"
          onClick={handleDelete}
        >
          <div className="flex items-center justify-center gap-2">
            <Trash2 className="h-4 w-4" />
            Delete Client
          </div>
        </Button>
      </div>
    </div>
  );
};

export default Settings;