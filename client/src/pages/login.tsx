// client/src/pages/login.tsx (THE ULTIMATE FINAL FIX)

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
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
import { Link, useLocation } from "wouter";
import { useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';

const loginSchema = z.object({
  username: z.string().min(1, { message: "Username is required." }),
  password: z.string().min(1, { message: "Password is required." }),
});

type LoginFormData = z.infer<typeof loginSchema>;

const Login: React.FC = () => {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      const response = await apiRequest("POST", "/api/auth/login", data);

      if (!response.ok) {
        const errorData = await response.json();
        // Yeh line "Invalid Credentials" ka error toast me dikhayegi
        throw new Error(errorData.message || "Login failed");
      }

      const responseData = await response.json();
      const loggedInUser = responseData.user;

      if (loggedInUser) {
        toast({ title: "Success", description: "Logged in successfully!" });

        // User ki details ko refresh karo
        await queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
        await queryClient.refetchQueries({ queryKey: ['/api/auth/me'] });

        // Aur phir redirect karo
        if (loggedInUser.isDeliveryPartner) {
          setLocation("/delivery-partner/dashboard");
        } else if (loggedInUser.role === 'provider') {
          setLocation("/provider/dashboard");
        } else {
          setLocation("/");
        }
      } else {
        // Yeh case tabhi aayega jab server se 'user' object na mile
        throw new Error("User data not found in login response.");
      }

    } catch (error: any) {
      // Yeh catch block ab har tarah ke error ko pakdega aur jhootha login nahi hone dega
      console.error("Login error caught:", error);
      toast({
        title: "Login Failed",
        description: error.message || "An unknown error occurred.",
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
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your username" {...field} />
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
              {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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