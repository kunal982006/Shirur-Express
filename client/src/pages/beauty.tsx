import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Star, MapPin, Sparkles, Crown } from "lucide-react";
import api from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";
import api from "@/lib/api";

export default function Beauty() {
  const [, setLocation] = useLocation();

  const { data: beautyParlors, isLoading } = useQuery({
    queryKey: ["/api/service-providers", { category: "beauty" }],
    queryFn: async () => {
      const res = await api.get("/service-providers?category=beauty");
      return res.data;
    },
  });

  useEffect(() => {
    if (beautyParlors) {
      if (beautyParlors.length > 0) {
        // Look specifically for Sneh Hair & Beauty, fallback to the first one available
        const snehParlor = beautyParlors.find((p: any) => 
          p.businessName.toLowerCase().includes("sneh")
        ) || beautyParlors[0];
        
        setLocation(`/beauty/${snehParlor.id}`);
      }
    }
  }, [beautyParlors, setLocation]);

  if (beautyParlors && beautyParlors.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <p className="text-gray-500 text-lg font-medium">No beauty parlor found.</p>
          <button onClick={() => setLocation("/")} className="text-pink-500 hover:underline">
            Go Back Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 text-pink-500 animate-spin" />
        <p className="text-gray-500 text-sm font-medium animate-pulse">Opening Beauty Parlor...</p>
      </div>
    </div>
  );
}