// client/src/pages/login.tsx

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api"; // Correct API path
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Link, useLocation } from "wouter"; // Import useLocation from wouter
import { useAuth } from "@/hooks/use-auth"; // Import useAuth to get user info after login

const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
});

type LoginFormData = z.infer<typeof loginSchema>;

const Login: React.FC = () => {
  const { toast } = useToast();
  const [, setLocation] = useLocation(); // wouter's setLocation
  const { login: authLogin } = useAuth(); // Get the login function from AuthContext

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      const res = await api.post("/api/auth/login", data);

      // Assuming res.data.user contains the logged-in user object from the backend
      // and it matches the User interface in use-auth.ts
      const loggedInUser = res.data.user;

      if (loggedInUser) {
        authLogin(loggedInUser); // Update AuthContext with user data
        toast({ title: "Success", description: "Logged in successfully!" });

        // Redirect based on user role
        if (loggedInUser.role === 'provider') {
          setLocation("/provider/dashboard"); // Redirect providers to their dashboard
        } else {
          setLocation("/"); // Redirect regular users to home
        }
      } else {
         throw new Error("User data not returned after login.");
      }

    } catch (error: any) {
      console.error("Login error:", error);
      toast({
        title: "Login Failed",
        description: error.response?.data?.message || "Invalid credentials.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-theme(spacing.16))]">
      <div className="w-full max-w-md p-8 space-y-6 bg-card text-card-foreground rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center">Login</h2>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="name@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="********" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? 'Logging in...' : 'Login'}
            </Button>
          </form>
        </Form>
        <div className="text-center text-sm text-muted-foreground">
          Don't have an account?{" "}
          <Link href="/signup" className="text-primary hover:underline">
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;