import { useState } from "react";
import Sidebar from "@/components/layout/sidebar";
import MobileSidebar from "@/components/layout/mobile-sidebar";
import Header from "@/components/layout/header";
import { 
  Card, 
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader,
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertUserSchema, User } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";

// Create a new form schema for user creation
const createUserSchema = insertUserSchema
  .extend({
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type CreateUserForm = z.infer<typeof createUserSchema>;

type UserManagementProps = {
  user: User;
  onLogout: () => Promise<void>;
};

export default function UserManagementPage({ user, onLogout }: UserManagementProps) {
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const [createUserOpen, setCreateUserOpen] = useState(false);
  
  // Get all users
  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  // Form setup
  const form = useForm<CreateUserForm>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
      name: "",
      email: "",
      role: "associate",
    },
  });

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (data: CreateUserForm) => {
      // Remove confirmPassword as it's not part of the API schema
      const { confirmPassword, ...userData } = data;
      const res = await apiRequest("POST", "/api/register", userData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "User created successfully",
        description: "The new user can now log in to the system",
      });
      form.reset();
      setCreateUserOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Failed to create user",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Form submission handler
  const onSubmit = (data: CreateUserForm) => {
    createUserMutation.mutate(data);
  };

  // Role badge colors
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-[#F44336] text-white";
      case "manager":
        return "bg-[#1565C0] text-white";
      case "associate":
        return "bg-[#26A69A] text-white";
      default:
        return "bg-neutral-medium text-neutral-dark";
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar user={user} />
      <MobileSidebar user={user} />
      
      <div className="flex-1 overflow-auto md:pt-0 pt-16">
        <Header 
          title="User Management" 
          subtitle="Manage user accounts and permissions"
          showAddButton
          addButtonLabel="Add User"
          onAddClick={() => setCreateUserOpen(true)}
          user={user}
          onLogout={onLogout}
        />
        
        <div className="p-4 md:p-6">
          {/* Role Counts */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="bg-white p-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-500">Administrators</p>
                  <h3 className="text-2xl font-bold">
                    {users?.filter(u => u.role === "admin").length || 0}
                  </h3>
                </div>
                <div className="bg-[#F44336] bg-opacity-10 p-2 rounded-full">
                  <span className="material-icons text-[#F44336]">admin_panel_settings</span>
                </div>
              </div>
            </Card>
            
            <Card className="bg-white p-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-500">Store Managers</p>
                  <h3 className="text-2xl font-bold">
                    {users?.filter(u => u.role === "manager").length || 0}
                  </h3>
                </div>
                <div className="bg-[#1565C0] bg-opacity-10 p-2 rounded-full">
                  <span className="material-icons text-[#1565C0]">supervisor_account</span>
                </div>
              </div>
            </Card>
            
            <Card className="bg-white p-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-500">Stock Associates</p>
                  <h3 className="text-2xl font-bold">
                    {users?.filter(u => u.role === "associate").length || 0}
                  </h3>
                </div>
                <div className="bg-[#26A69A] bg-opacity-10 p-2 rounded-full">
                  <span className="material-icons text-[#26A69A]">person</span>
                </div>
              </div>
            </Card>
          </div>
          
          {/* Users Table */}
          <Card>
            <CardHeader>
              <CardTitle>System Users</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="animate-pulse space-y-4">
                  <div className="h-10 bg-gray-200 rounded"></div>
                  <div className="h-10 bg-gray-200 rounded"></div>
                  <div className="h-10 bg-gray-200 rounded"></div>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Username</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users?.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.username}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge className={getRoleBadgeColor(user.role)}>
                            {user.role === "admin" 
                              ? "Administrator" 
                              : user.role === "manager" 
                                ? "Store Manager" 
                                : "Stock Associate"
                            }
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" className="h-8 w-8">
                            <span className="material-icons">edit</span>
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 text-destructive"
                            disabled={user.id === currentUser?.id} // Can't delete yourself
                          >
                            <span className="material-icons">delete</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    
                    {(!users || users.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-4">
                          No users found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Create User Dialog */}
      <Dialog open={createUserOpen} onOpenChange={setCreateUserOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="john@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="johndoe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="admin">Administrator</SelectItem>
                        <SelectItem value="manager">Store Manager</SelectItem>
                        <SelectItem value="associate">Stock Associate</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter className="mt-6">
                <Button type="button" variant="outline" onClick={() => setCreateUserOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={createUserMutation.isPending}
                >
                  {createUserMutation.isPending ? "Creating..." : "Create User"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
