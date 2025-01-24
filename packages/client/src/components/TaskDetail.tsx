import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import { useState } from "react";
import { ArrowLeft, Save } from "lucide-react";
import { useToast } from "../components/ui/use-toast";
import type { Task, TaskStatus, TaskType, TaskUrgency, ServiceCategory } from "../types/task";

type TaskDetailProps = {
  task: Task;
  onBack: () => void;
  onUpdate: (task: Task) => void;
};

export const TaskDetail = ({ task, onBack, onUpdate }: TaskDetailProps) => {
  const [editedTask, setEditedTask] = useState(task);
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsSubmitting(true);
      const response = await fetch(`http://localhost:3000/api/tasks/${task.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editedTask),
      });

      if (!response.ok) {
        throw new Error('Failed to update task');
      }

      const updatedTask = await response.json();
      onUpdate(updatedTask);
      toast({
        title: "Success",
        description: "Task updated successfully",
        variant: "success"
      });
    } catch (error) {
      console.error('Error updating task:', error);
      toast({
        title: "Error",
        description: "Failed to update task",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        className="gap-2"
        onClick={onBack}
      >
        <ArrowLeft className="h-4 w-4" />
        Back to tasks
      </Button>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-lg border p-6 space-y-4">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Title</label>
              <Textarea
                value={editedTask.title}
                onChange={(e) => setEditedTask({ ...editedTask, title: e.target.value })}
                className="min-h-[60px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Status</label>
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2"
                  value={editedTask.status}
                  onChange={(e) => setEditedTask({ ...editedTask, status: e.target.value as TaskStatus })}
                >
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Priority</label>
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2"
                  value={editedTask.urgency}
                  onChange={(e) => setEditedTask({ ...editedTask, urgency: e.target.value as TaskUrgency })}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Type</label>
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2"
                  value={editedTask.type}
                  onChange={(e) => setEditedTask({ ...editedTask, type: e.target.value as TaskType })}
                >
                  <option value="bug">Bug</option>
                  <option value="feature_request">Feature Request</option>
                  <option value="documentation">Documentation</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Service Category</label>
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2"
                  value={editedTask.serviceCategory}
                  onChange={(e) => setEditedTask({ ...editedTask, serviceCategory: e.target.value as ServiceCategory })}
                >
                  <option value="dev">Development</option>
                  <option value="design">Design</option>
                  <option value="strategy">Strategy</option>
                  <option value="consulting">Consulting</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Created</label>
              <p className="text-sm text-muted-foreground">
                {new Date(editedTask.createdAt).toLocaleString()}
              </p>
            </div>

            {editedTask.updatedAt && (
              <div>
                <label className="text-sm font-medium mb-1 block">Last Updated</label>
                <p className="text-sm text-muted-foreground">
                  {new Date(editedTask.updatedAt).toLocaleString()}
                </p>
              </div>
            )}
          </div>
        </div>

        <Button type="submit" className="gap-2" disabled={isSubmitting}>
          <Save className="h-4 w-4" />
          {isSubmitting ? "Saving..." : "Save Changes"}
        </Button>
      </form>
    </div>
  );
};