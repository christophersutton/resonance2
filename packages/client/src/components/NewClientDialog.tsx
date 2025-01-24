import { Button } from "../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { PlusCircle } from "lucide-react";
import { ClientForm } from "./ClientForm";
import type { ClientFormData } from "../types/client";
import { useClient } from "../contexts/ClientContext";
import { useToast } from "../components/ui/use-toast";
import { useState } from "react";

export const NewClientDialog = () => {
  const { refreshClients } = useClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  const onSubmit = async (data: ClientFormData) => {
    try {
      const response = await fetch('http://localhost:3000/api/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to create client');
      }

      await refreshClients();
      toast({
        title: "Success",
        description: "New client created successfully",
        variant: "success"
      });
      setOpen(false); // Close the dialog on success
    } catch (error) {
      console.error('Error creating client:', error);
      toast({
        title: "Error",
        description: "Failed to create client",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          className="w-full flex items-center p-2 rounded-lg hover:bg-crm-sidebar-hover transition-colors justify-start text-white"
        >
          <PlusCircle className="mr-2 h-5 w-5" />
          New Client
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Client</DialogTitle>
        </DialogHeader>
        <ClientForm onSubmit={onSubmit} submitLabel="Add Client" />
      </DialogContent>
    </Dialog>
  );
};