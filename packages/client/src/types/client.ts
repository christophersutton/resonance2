export type Service = "dev" | "design" | "strategy" | "consulting";

export const SERVICE_LABELS: Record<Service, string> = {
  dev: "Development",
  design: "Design",
  strategy: "Product Strategy",
  consulting: "Consulting",
};

export type Client = {
  id: number;
  organizationName: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  services: Service[];
  createdAt: string;
  unreadMessages?: number;
};

export type ClientFormData = Omit<Client, "id" | "createdAt" | "unreadMessages"> & {
  phone: string; // Make phone required in form
}; 