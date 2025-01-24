import { FileText, Download, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useClient } from "@/contexts/ClientContext";

const Documents = () => {
  const { selectedClient } = useClient();
  
  const documents = [
    {
      id: 1,
      name: "Product Requirements Document",
      client: "Acme Corp",
      type: "application/pdf",
      uploadedAt: "2024-02-20",
      size: "2.4 MB",
    },
    {
      id: 2,
      name: "Technical Specifications",
      client: "Stark Industries",
      type: "application/pdf",
      uploadedAt: "2024-02-19",
      size: "1.8 MB",
    },
    {
      id: 3,
      name: "Bug Report Analysis",
      client: "Wayne Enterprises",
      type: "application/pdf",
      uploadedAt: "2024-02-18",
      size: "956 KB",
    },
  ].filter(doc => doc.client === selectedClient?.organizationName);

  return (
    <div className="flex-1 p-8 bg-background">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Documents</h1>
        <p className="text-muted-foreground">Manage client documentation</p>
      </div>

      <div className="space-y-4">
        {documents.map((doc) => (
          <div
            key={doc.id}
            className="p-4 rounded-lg border border-border bg-card"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-blue-500" />
                <div>
                  <h3 className="font-medium text-foreground">{doc.name}</h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{doc.client}</span>
                    <span>•</span>
                    <span>{doc.size}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar size={14} />
                  <span>{doc.uploadedAt}</span>
                </div>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Documents;