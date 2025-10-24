// client/src/components/forms/MenuItemForm.tsx (poora code, thoda bada hoga)

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox"; // Assuming Checkbox is needed for isVeg

// --- Define Category-Specific Schemas and Options ---
const beautyCategories = [
  { value: "Hair", label: "Hair Services" },
  { value: "Skin", label: "Skin Care" },
  { value: "Nails", label: "Nail Care" },
  { value: "Makeup", label: "Makeup" },
  { value: "Spa", label: "Spa & Massage" },
  { value: "Bridal", label: "Bridal Services" },
];
const beautySubCategories = {
  Hair: [{ value: "Haircut_Men", label: "Haircut (Men)" }, { value: "Haircut_Women", label: "Haircut (Women)" }, { value: "Hair_Spa", label: "Hair Spa" }, { value: "Hair_Color", label: "Hair Color" }],
  Skin: [{ value: "Facial_Gold", label: "Facial (Gold)" }, { value: "Facial_Fruit", label: "Facial (Fruit)" }, { value: "Cleanup", label: "Cleanup" }, { value: "Bleach", label: "Bleach" }],
  Nails: [{ value: "Manicure", label: "Manicure" }, { value: "Pedicure", label: "Pedicure" }],
  // ... add more as needed
};

const foodCategories = [
  { value: "Snacks", label: "Snacks" },
  { value: "Main_Course", label: "Main Course" },
  { value: "Beverages", label: "Beverages" },
  { value: "Desserts", label: "Desserts" },
];
const spicyLevels = [
  { value: "Mild", label: "Mild" },
  { value: "Medium", label: "Medium" },
  { value: "Hot", label: "Hot" },
  { value: "Extra_Hot", label: "Extra Hot" },
];

const cakeCategories = [
  { value: "Birthday", label: "Birthday Cakes" },
  { value: "Anniversary", label: "Anniversary Cakes" },
  { value: "Wedding", label: "Wedding Cakes" },
  { value: "Custom", label: "Custom Cakes" },
];

const restaurantCategories = [
  { value: "Starters", label: "Starters" },
  { value: "Main_Course", label: "Main Course" },
  { value: "Desserts", label: "Desserts" },
  { value: "Beverages", label: "Beverages" },
];


// Base Schema (common fields)
const baseSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  description: z.string().optional(),
  imageUrl: z.string().url({ message: "Invalid URL" }).optional().or(z.literal("")),
  price: z.string().regex(/^\d+(\.\d{1,2})?$/, { message: "Invalid price format" }), // Price as string for flexibility
});

// Category-specific schemas
const beautySchema = baseSchema.extend({
  duration: z.string().regex(/^\d+$/, { message: "Duration must be a number in minutes." }).optional().or(z.literal("")),
  category: z.enum(beautyCategories.map(c => c.value) as [string, ...string[]], { message: "Please select a category." }),
  subCategory: z.string().optional(), // Will be dynamically validated
});

const foodSchema = baseSchema.extend({
  isVeg: z.boolean().default(true).optional(),
  spicyLevel: z.enum(spicyLevels.map(s => s.value) as [string, ...string[]]).optional(),
  category: z.enum(foodCategories.map(c => c.value) as [string, ...string[]], { message: "Please select a category." }),
});

const cakeSchema = baseSchema.extend({
  category: z.enum(cakeCategories.map(c => c.value) as [string, ...string[]], { message: "Please select a category." }),
  // For cakes, basePrice is usually the core price, add weightOptions if needed
  // basePrice: z.string().regex(/^\d+(\.\d{1,2})?$/, { message: "Invalid base price format" }),
  // weightOptions: z.array(z.object({ weight: z.string(), price: z.number() })).optional(),
});

const restaurantSchema = baseSchema.extend({
  isVeg: z.boolean().default(true).optional(),
  category: z.enum(restaurantCategories.map(c => c.value) as [string, ...string[]], { message: "Please select a category." }),
  cuisine: z.string().optional(), // e.g., Indian, Chinese
});


type MenuItemFormProps = {
  providerId: string;
  categorySlug: string; // Add this prop
  initialData?: any; // Type this better later
  onSuccess: () => void;
};

const MenuItemForm: React.FC<MenuItemFormProps> = ({ providerId, categorySlug, initialData, onSuccess }) => {
  const { toast } = useToast();
  const [currentSubCategories, setCurrentSubCategories] = useState([]);

  // Dynamically select schema based on categorySlug
  const getSchema = () => {
    switch (categorySlug) {
      case "beauty": return beautySchema;
      case "street-food": return foodSchema;
      case "cake-shop": return cakeSchema;
      case "restaurants": return restaurantSchema;
      default: return baseSchema; // Fallback
    }
  };

  const form = useForm<z.infer<typeof beautySchema | typeof foodSchema | typeof cakeSchema | typeof restaurantSchema>>({
    resolver: zodResolver(getSchema()),
    defaultValues: {
      name: initialData?.name || "",
      description: initialData?.description || "",
      imageUrl: initialData?.imageUrl || "",
      price: initialData?.price?.toString() || "",
      // Category specific defaults
      duration: initialData?.duration_minutes?.toString() || "", // Beauty
      category: initialData?.category || "",
      subCategory: initialData?.subCategory || "", // Beauty
      isVeg: initialData?.isVeg ?? true, // Food/Restaurant
      spicyLevel: initialData?.spicyLevel || "", // Food
      cuisine: initialData?.cuisine || "", // Restaurant
    },
  });

  useEffect(() => {
    if (initialData) {
      // Reset form with initialData, especially useful for category-specific fields
      form.reset({
        name: initialData.name || "",
        description: initialData.description || "",
        imageUrl: initialData.imageUrl || "",
        price: initialData.price?.toString() || "",
        duration: initialData.duration_minutes?.toString() || "", // Beauty
        category: initialData.category || "",
        subCategory: initialData.subCategory || "", // Beauty
        isVeg: initialData.isVeg ?? true, // Food/Restaurant
        spicyLevel: initialData.spicyLevel || "", // Food
        cuisine: initialData.cuisine || "", // Restaurant
      });
      // Set sub-categories if editing
      if (categorySlug === "beauty" && initialData.category) {
        setCurrentSubCategories(beautySubCategories[initialData.category] || []);
      }
    } else {
      form.reset({
        name: "", description: "", imageUrl: "", price: "",
        duration: "", category: "", subCategory: "", isVeg: true, spicyLevel: "", cuisine: ""
      });
      setCurrentSubCategories([]); // Clear subcategories on new item
    }
    // Update resolver when categorySlug changes (e.g., if provider type changes, although unlikely in single session)
    form.setResolver(zodResolver(getSchema()));
  }, [initialData, categorySlug, form, getSchema]);

  const selectedCategory = form.watch("category");
  useEffect(() => {
    if (categorySlug === "beauty" && selectedCategory) {
      setCurrentSubCategories(beautySubCategories[selectedCategory] || []);
    } else {
      setCurrentSubCategories([]);
    }
    form.setValue("subCategory", ""); // Clear subCategory when category changes
  }, [selectedCategory, categorySlug, form]);

  const onSubmit = async (values: any) => { // Type as any for now, refine later based on actual schema
    try {
      const payload: any = {
        providerId,
        name: values.name,
        description: values.description,
        imageUrl: values.imageUrl || null, // Ensure empty string becomes null for optional fields
        price: parseFloat(values.price),
        category: values.category,
      };

      // Category-specific fields for payload
      if (categorySlug === "beauty") {
        payload.duration_minutes = values.duration ? parseInt(values.duration) : null;
        payload.subCategory = values.subCategory || null;
      } else if (categorySlug === "street-food" || categorySlug === "restaurants") {
        payload.isVeg = values.isVeg;
        if (categorySlug === "street-food") {
          payload.spicyLevel = values.spicyLevel || null;
        }
        if (categorySlug === "restaurants") {
          payload.cuisine = values.cuisine || null;
        }
      }
      // Cake shop might have basePrice, weightOptions etc.

      let res;
      if (initialData) {
        // Update existing item
        res = await api.patch(`/api/menu-items/${initialData.id}`, { categorySlug, ...payload });
        toast({ title: "Success", description: "Menu item updated successfully." });
      } else {
        // Create new item
        res = await api.post(`/api/menu-items`, { categorySlug, ...payload });
        toast({ title: "Success", description: "Menu item added successfully." });
      }
      onSuccess();
    } catch (error) {
      console.error("Error saving menu item:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to save menu item.",
        variant: "destructive",
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Service or Item Name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea placeholder="Describe the service/item" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="imageUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Image URL</FormLabel>
              <FormControl>
                <Input placeholder="http://example.com/image.jpg" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="price"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Price (₹)</FormLabel>
              <FormControl>
                <Input type="text" placeholder="e.g., 500 or 500.00" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* --- Category Specific Fields --- */}

        {/* Beauty Specific Fields */}
        {categorySlug === "beauty" && (
          <>
            <FormField
              control={form.control}
              name="duration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Duration (minutes)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="e.g., 60" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {beautyCategories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            {selectedCategory && currentSubCategories.length > 0 && (
              <FormField
                control={form.control}
                name="subCategory"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sub-Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a sub-category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {currentSubCategories.map((subCat) => (
                          <SelectItem key={subCat.value} value={subCat.value}>
                            {subCat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </>
        )}

        {/* Street Food & Restaurant Specific Fields */}
        {(categorySlug === "street-food" || categorySlug === "restaurants") && (
          <>
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(categorySlug === "street-food" ? foodCategories : restaurantCategories).map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="isVeg"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Vegetarian?</FormLabel>
                    <FormDescription>Is this item vegetarian?</FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </>
        )}

        {/* Street Food Specific Spicy Level */}
        {categorySlug === "street-food" && (
          <FormField
            control={form.control}
            name="spicyLevel"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Spicy Level</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select spicy level" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {spicyLevels.map((level) => (
                      <SelectItem key={level.value} value={level.value}>
                        {level.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Restaurant Specific Cuisine */}
        {categorySlug === "restaurants" && (
          <FormField
            control={form.control}
            name="cuisine"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cuisine</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Indian, Chinese" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Cake Shop Specific Fields */}
        {categorySlug === "cake-shop" && (
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a cake category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {cakeCategories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <Button type="submit">
          {initialData ? "Update Item" : "Add Item"}
        </Button>
      </form>
    </Form>
  );
};

export default MenuItemForm;