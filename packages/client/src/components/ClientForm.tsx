import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { Service, SERVICE_LABELS, ClientFormData } from "@/types/client";
import { Code2, Paintbrush2, Map, CircuitBoard, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const services = [
  { 
    id: "dev" as Service, 
    label: SERVICE_LABELS.dev,
    icon: Code2
  },
  { 
    id: "design" as Service, 
    label: SERVICE_LABELS.design,
    icon: Paintbrush2
  },
  { 
    id: "strategy" as Service, 
    label: SERVICE_LABELS.strategy,
    icon: Map
  },
  { 
    id: "consulting" as Service, 
    label: SERVICE_LABELS.consulting,
    icon: CircuitBoard
  }
];

type ClientFormProps = {
  onSubmit: (data: ClientFormData) => void;
  submitLabel: string;
  defaultValues?: Partial<ClientFormData>;
};

export const ClientForm = ({ onSubmit, submitLabel, defaultValues }: ClientFormProps) => {
  const form = useForm<ClientFormData>({
    defaultValues: {
      organizationName: "",
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      services: [],
      ...defaultValues,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="organizationName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Organization Name</FormLabel>
              <FormControl>
                <Input placeholder="Acme Corp" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First Name</FormLabel>
                <FormControl>
                  <Input placeholder="John" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last Name</FormLabel>
                <FormControl>
                  <Input placeholder="Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="john.doe@acme.com"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone Number</FormLabel>
              <FormControl>
                <Input placeholder="+1 (555) 000-0000" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="services"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Services</FormLabel>
              <div className="grid grid-cols-2 gap-2">
                {services.map((service) => {
                  const isSelected = field.value?.includes(service.id);
                  const Icon = service.icon;
                  return (
                    <Button
                      key={service.id}
                      type="button"
                      variant={isSelected ? "default" : "outline"}
                      className={cn(
                        "h-20 relative",
                        isSelected && "bg-primary text-primary-foreground"
                      )}
                      onClick={() => {
                        const currentServices = field.value || [];
                        const newServices = currentServices.includes(service.id)
                          ? currentServices.filter((id) => id !== service.id)
                          : [...currentServices, service.id];
                        field.onChange(newServices);
                      }}
                    >
                      {isSelected && (
                        <Check className="h-4 w-4 absolute top-2 right-2" />
                      )}
                      <div className="flex flex-col items-center gap-2">
                        <Icon className="h-8 w-8" />
                        <span className="text-sm">{service.label}</span>
                      </div>
                    </Button>
                  );
                })}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full">
          {submitLabel}
        </Button>
      </form>
    </Form>
  );
};