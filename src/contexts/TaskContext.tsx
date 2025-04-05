
import React, { createContext, useContext, useState, useEffect } from "react";
import { Task } from "@/types";
import { useAuth } from "./AuthContext";
import { useOrganization } from "./OrganizationContext";
import { toast } from "sonner";

interface TaskContextType {
  tasks: Task[];
  loading: boolean;
  createTask: (data: Omit<Task, "id" | "createdAt" | "updatedAt" | "createdById" | "organizationId">) => Promise<Task>;
  updateTask: (id: string, data: Partial<Task>) => Promise<Task>;
  deleteTask: (id: string) => Promise<void>;
  getTasksByStatus: (status: Task["status"]) => Task[];
  getTasksByAssignee: (assigneeId: string) => Task[];
  getTasksByClient: (clientId: string) => Task[];
}

const TaskContext = createContext<TaskContextType | null>(null);

// Mock task data
const mockTasks: Task[] = [
  {
    id: "task1",
    title: "Design homepage mockup",
    description: "Create modern design for client homepage",
    status: "in_progress",
    priority: "high",
    assigneeId: "user1",
    createdById: "user1",
    organizationId: "org1",
    dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
    createdAt: new Date(),
    updatedAt: new Date(),
    tags: ["design", "website"],
  },
  {
    id: "task2",
    title: "Create content plan",
    description: "Draft content strategy for next quarter",
    status: "todo",
    priority: "medium",
    assigneeId: "user1",
    createdById: "user1",
    organizationId: "org1",
    dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
    createdAt: new Date(),
    updatedAt: new Date(),
    tags: ["content", "strategy"],
  },
];

export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { organization } = useOrganization();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  // Load tasks
  useEffect(() => {
    const loadTasks = async () => {
      if (!user || !organization) {
        setTasks([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // Mock API call
        await new Promise((resolve) => setTimeout(resolve, 500));
        
        // In a real app, we would fetch tasks from an API
        setTasks(mockTasks);
      } catch (error) {
        console.error("Failed to load tasks:", error);
        toast.error("Failed to load tasks");
      } finally {
        setLoading(false);
      }
    };

    loadTasks();
  }, [user, organization]);

  // Create task
  const createTask = async (data: Omit<Task, "id" | "createdAt" | "updatedAt" | "createdById" | "organizationId">): Promise<Task> => {
    if (!user) throw new Error("User not authenticated");
    if (!organization) throw new Error("No organization selected");
    
    setLoading(true);
    try {
      // Mock API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      // Create new task
      const newTask: Task = {
        id: `task${Date.now()}`,
        ...data,
        createdById: user.id,
        organizationId: organization.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      // Save to state
      setTasks([...tasks, newTask]);
      
      toast.success("Task created successfully");
      return newTask;
    } catch (error: any) {
      toast.error(error.message || "Failed to create task");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Update task
  const updateTask = async (id: string, data: Partial<Task>): Promise<Task> => {
    setLoading(true);
    try {
      // Mock API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      // Find and update task
      const taskIndex = tasks.findIndex(t => t.id === id);
      if (taskIndex === -1) {
        throw new Error("Task not found");
      }
      
      const updatedTask = { 
        ...tasks[taskIndex], 
        ...data, 
        updatedAt: new Date() 
      };
      
      // Update tasks array
      const updatedTasks = [...tasks];
      updatedTasks[taskIndex] = updatedTask;
      setTasks(updatedTasks);
      
      toast.success("Task updated successfully");
      return updatedTask;
    } catch (error: any) {
      toast.error(error.message || "Failed to update task");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Delete task
  const deleteTask = async (id: string) => {
    setLoading(true);
    try {
      // Mock API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      // Delete task
      setTasks(tasks.filter(task => task.id !== id));
      
      toast.success("Task deleted successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete task");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Get tasks by status
  const getTasksByStatus = (status: Task["status"]) => {
    return tasks.filter(task => task.status === status);
  };

  // Get tasks by assignee
  const getTasksByAssignee = (assigneeId: string) => {
    return tasks.filter(task => task.assigneeId === assigneeId);
  };

  // Get tasks by client
  const getTasksByClient = (clientId: string) => {
    return tasks.filter(task => task.clientId === clientId);
  };

  return (
    <TaskContext.Provider
      value={{
        tasks,
        loading,
        createTask,
        updateTask,
        deleteTask,
        getTasksByStatus,
        getTasksByAssignee,
        getTasksByClient,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
};

export const useTasks = () => {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error("useTasks must be used within a TaskProvider");
  }
  return context;
};
