import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { insertUserSchema } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

// Login form schema
const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

// Registration form schema (based on insertUserSchema)
const registerSchema = insertUserSchema
  .extend({
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type LoginForm = z.infer<typeof loginSchema>;
type RegisterForm = z.infer<typeof registerSchema>;

type LoginPageProps = {
  onLogin: (username: string, password: string) => Promise<boolean>;
  onRegister: (data: any) => Promise<boolean>;
};

export default function LoginPage({ onLogin, onRegister }: LoginPageProps) {
  const { toast } = useToast();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  // Login form setup
  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Register form setup
  const registerForm = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
      name: "",
      email: "",
      role: "associate",
    },
  });

  // Form submission handlers
  const onLoginSubmit = async (data: LoginForm) => {
    setIsLoggingIn(true);
    try {
      const success = await onLogin(data.username, data.password);
      if (!success) {
        toast({
          title: "Login failed",
          description: "Invalid username or password",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Login failed",
        description: "An error occurred during login",
        variant: "destructive",
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  const onRegisterSubmit = async (data: RegisterForm) => {
    setIsRegistering(true);
    try {
      // Remove confirmPassword as it's not part of the API schema
      const { confirmPassword, ...registerData } = data;
      const success = await onRegister(registerData);
      if (!success) {
        toast({
          title: "Registration failed",
          description: "Username may already exist",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Registration failed",
        description: "An error occurred during registration",
        variant: "destructive",
      });
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="flex flex-col md:flex-row max-w-6xl w-full bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Left side: Auth forms */}
        <div className="w-full md:w-1/2 p-6">
          <div className="mb-6">
            <div className="flex items-center mb-4">
              <span className="material-icons text-primary mr-2">inventory_2</span>
              <h1 className="text-2xl font-bold">GroceryStock</h1>
            </div>
            <p className="text-gray-600">
              Complete inventory management and automated replenishment for grocery stores
            </p>
          </div>
          
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <Card>
                <CardHeader>
                  <CardTitle>Login to Your Account</CardTitle>
                  <CardDescription>
                    Enter your credentials to access the dashboard
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...loginForm}>
                    <form id="login-form" onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                      <FormField
                        control={loginForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input placeholder="username" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={loginForm.control}
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
                    </form>
                  </Form>
                </CardContent>
                <CardFooter>
                  <Button 
                    type="submit" 
                    form="login-form" 
                    className="w-full"
                    disabled={isLoggingIn}
                  >
                    {isLoggingIn ? "Logging in..." : "Login"}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            <TabsContent value="register">
              <Card>
                <CardHeader>
                  <CardTitle>Create an Account</CardTitle>
                  <CardDescription>
                    Register to start managing your inventory
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...registerForm}>
                    <form id="register-form" onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                      <FormField
                        control={registerForm.control}
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
                        control={registerForm.control}
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
                        control={registerForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input placeholder="johnD" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={registerForm.control}
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
                          control={registerForm.control}
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
                    </form>
                  </Form>
                </CardContent>
                <CardFooter>
                  <Button 
                    type="submit" 
                    form="register-form" 
                    className="w-full"
                    disabled={isRegistering}
                  >
                    {isRegistering ? "Creating account..." : "Register"}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
        
        {/* Right side: Hero */}
        <div className="hidden md:block md:w-1/2 bg-primary p-10 text-white">
          <div className="h-full flex flex-col justify-center">
            <h2 className="text-3xl font-bold mb-6">Inventory Management Simplified</h2>
            <ul className="space-y-4">
              <li className="flex items-start">
                <span className="material-icons mr-2 mt-0.5">check_circle</span>
                <span>Real-time inventory tracking with barcode scanning</span>
              </li>
              <li className="flex items-start">
                <span className="material-icons mr-2 mt-0.5">check_circle</span>
                <span>AI-powered demand forecasting to prevent stockouts</span>
              </li>
              <li className="flex items-start">
                <span className="material-icons mr-2 mt-0.5">check_circle</span>
                <span>Automated replenishment and purchase orders</span>
              </li>
              <li className="flex items-start">
                <span className="material-icons mr-2 mt-0.5">check_circle</span>
                <span>ERP integration for streamlined operations</span>
              </li>
              <li className="flex items-start">
                <span className="material-icons mr-2 mt-0.5">check_circle</span>
                <span>Comprehensive analytics and reporting</span>
              </li>
            </ul>
            <div className="mt-8 pt-8 border-t border-primary-light">
              <p className="text-sm opacity-80">
                Trusted by grocery stores worldwide to optimize inventory and reduce waste.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
