export type TaskStatus = 'open' | 'in_progress' | 'completed';
export type TaskUrgency = 'low' | 'medium' | 'high' | 'urgent';
export type TaskType = 'bug' | 'feature_request' | 'documentation';
export type ServiceCategory = 'dev' | 'design' | 'strategy' | 'consulting';

export type Task = {
  id: number;
  clientId: number;
  title: string;
  type: TaskType;
  serviceCategory: ServiceCategory;
  urgency: TaskUrgency;
  status: TaskStatus;
  createdAt: string;
  updatedAt?: string;
};

export type CreateTaskInput = Omit<Task, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateTaskInput = Partial<CreateTaskInput>; 