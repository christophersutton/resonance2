import { CheckCircle2, Circle, Clock, AlertCircle } from "lucide-react";
import { Badge } from "../components/ui/badge";
import { useState, useEffect } from "react";
import { TaskDetail } from "../components/TaskDetail";
import { useClient } from "../contexts/ClientContext";
import type { Task, TaskStatus } from "../types/task";
import { useToast } from "../components/ui/use-toast";

const Tasks = () => {
  const { selectedClient } = useClient();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTasks = async () => {
      if (!selectedClient) return;
      
      try {
        setIsLoading(true);
        const response = await fetch(`http://localhost:3000/api/tasks?clientId=${selectedClient.id}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch tasks');
        }
        
        const data = await response.json();
        setTasks(data);
      } catch (error) {
        console.error('Error fetching tasks:', error);
        toast({
          title: "Error",
          description: "Failed to load tasks",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchTasks();
  }, [selectedClient, toast]);

  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case "in_progress":
        return <Clock className="h-5 w-5 text-blue-500" />;
      case "open":
        return <Circle className="h-5 w-5 text-gray-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-red-500" />;
    }
  };

  const getUrgencyBadge = (urgency: string) => {
    const variants: Record<string, string> = {
      urgent: "bg-red-100 text-red-800",
      high: "bg-orange-100 text-orange-800",
      medium: "bg-yellow-100 text-yellow-800",
      low: "bg-green-100 text-green-800",
    };

    return (
      <Badge variant="outline" className={variants[urgency]}>
        {urgency}
      </Badge>
    );
  };

  if (selectedTask) {
    return (
      <div className="flex-1 p-8 bg-background">
        <TaskDetail
          task={selectedTask}
          onBack={() => setSelectedTask(null)}
          onUpdate={(updatedTask) => {
            setTasks(tasks.map(t => t.id === updatedTask.id ? updatedTask : t));
            setSelectedTask(null);
          }}
        />
      </div>
    );
  }

  return (
    <div className="flex-1 p-8 bg-background">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Tasks</h1>
        <p className="text-muted-foreground">Track and manage client requests</p>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div className="text-muted-foreground">Loading tasks...</div>
        ) : tasks.length === 0 ? (
          <div className="text-muted-foreground">No tasks found</div>
        ) : (
          tasks.map((task) => (
            <button
              key={task.id}
              className="w-full p-4 rounded-lg border border-border bg-card hover:border-blue-300 transition-colors text-left"
              onClick={() => setSelectedTask(task)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  {getStatusIcon(task.status)}
                  <div>
                    <h3 className="font-medium text-foreground">{task.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {task.type.replace('_', ' ')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {getUrgencyBadge(task.urgency)}
                  <span className="text-sm text-muted-foreground">
                    {new Date(task.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
};

export default Tasks;