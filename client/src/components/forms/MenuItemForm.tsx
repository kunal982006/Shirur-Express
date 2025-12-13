// client/src/components/forms/MenuItemForm.tsx (FIXED API CALLS)

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
import { Loader2 } from "lucide-react";

// --- Schemas and Options (Yeh sab waise hi rahenge) ---
const beautyCategories = [{ value: "Hair", label: "Hair Services" }, { value: "Skin", label: "Skin Care" }, { value: "Nails", label: "Nail Care" }, { value: "Makeup", label: "Makeup" }, { value: "Spa", label: "Spa & Massage" }, { value: "Bridal", label: "Bridal Services" },];
const beautySubCategories = { Hair: [{ value: "Haircut_Men", label: "Haircut (Men)" }, { value: "Haircut_Women", label: "Haircut (Women)" }, { value: "Hair_Spa", label: "Hair Spa" }, { value: "Hair_Color", label: "Hair Color" }], Skin: [{ value: "Facial_Gold", label: "Facial (Gold)" }, { value: "Facial_Fruit", label: "Facial (Fruit)" }, { value: "Cleanup", label: "Cleanup" }, { value: "Bleach", label: "Bleach" }], Nails: [{ value: "Manicure", label: "Manicure" }, { value: "Pedicure", label: "Pedicure" }], };
const foodCategories = [{ value: "Snacks", label: "Snacks" }, { value: "Main_Course", label: "Main Course" }, { value: "Beverages", label: "Beverages" }, { value: "Desserts", label: "Desserts" },];
const spicyLevels = [{ value: "Mild", label: "Mild" }, { value: "Medium", label: "Medium" }, { value: "Hot", label: "Hot" }, { value: "Extra_Hot", label: "Extra Hot" },];
const cakeCategories = [{ value: "Birthday", label: "Birthday Cakes" }, { value: "Anniversary", label: "Anniversary Cakes" }, { value: "Wedding", label: "Wedding Cakes" }, { value: "Custom", label: "Custom Cakes" }, { value: "Cupcakes", label: "Cupcakes & Pastries" },];
const restaurantCategories = [{ value: "Starters", label: "Starters" }, { value: "Main_Course", label: "Main Course" }, { value: "Desserts", label: "Desserts" }, { value: "Beverages", label: "Beverages" }, { value: "Soups", label: "Soups" },];

// --- YEH NAYA SCHEMA HAI 'GROCERY' KE LIYE ---
const groceryCategories = [{ value: "fruits", label: "Fruits" }, { value: "vegetables", label: "Vegetables" }, { value: "dairy", label: "Dairy" }, { value: "bakery", label: "Bakery" }, { value: "snacks", label: "Snacks" }, { value: "beverages", label: "Beverages" }, { value: "staples", label: "Staples" }, { value: "toiletries", label: "Toiletries" }, { value: "personal-care", label: "Personal Care" },];

const baseSchema = z.object({ name: z.string().min(2, { message: "Name must be at least 2 characters." }), description: z.string().optional(), imageUrl: z.string().url({ message: "Invalid URL" }).optional().or(z.literal("")), price: z.string().regex(/^\d+(\.\d{1,2})?$/, { message: "Invalid price format" }), });
const beautySchema = baseSchema.extend({ duration: z.string().regex(/^\d+$/, { message: "Duration must be a number in minutes." }).optional().or(z.literal("")), category: z.enum(beautyCategories.map(c => c.value) as [string, ...string[]], { message: "Please select a category." }), subCategory: z.string().optional(), });
const foodSchema = baseSchema.extend({ isVeg: z.boolean().default(true).optional(), spicyLevel: z.enum(spicyLevels.map(s => s.value) as [string, ...string[]]).optional(), category: z.enum(foodCategories.map(c => c.value) as [string, ...string[]], { message: "Please select a category." }), });
const cakeSchema = baseSchema.extend({
  category: z.enum(cakeCategories.map(c => c.value) as [string, ...string[]], { message: "Please select a category." }),
  weight: z.string().optional(), // Added weight to schema
});
const restaurantSchema = baseSchema.extend({ isVeg: z.boolean().default(true).optional(), category: z.enum(restaurantCategories.map(c => c.value) as [string, ...string[]], { message: "Please select a category." }), cuisine: z.string().optional(), });

// --- YEH NAYA SCHEMA HAI 'GROCERY' KE LIYE ---
const grocerySchema = baseSchema.extend({
  category: z.string().min(2, { message: "Category name is required" }), // Changed from enum to string
  weight: z.string().optional(),
  unit: z.string().optional(),
  inStock: z.boolean().default(true).optional(),
  stockQuantity: z.string().regex(/^\d+$/, { message: "Stock must be a number." }).optional().or(z.literal("")),
});

type FormValues = z.infer<typeof baseSchema> & z.infer<typeof beautySchema> & z.infer<typeof foodSchema> & z.infer<typeof cakeSchema> & z.infer<typeof restaurantSchema> & z.infer<typeof grocerySchema>;
type MenuItemFormProps = { providerId: string; categorySlug: string; initialData?: any; onSuccess: () => void; };

const MenuItemForm: React.FC<MenuItemFormProps> = ({ providerId, categorySlug, initialData, onSuccess }) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentSubCategories, setCurrentSubCategories] = useState<{ value: string; label: string; }[]>([]);

  const getSchema = () => {
    switch (categorySlug) {
      case "beauty": return beautySchema;
      case "street-food": return foodSchema;
      case "cake-shop": return cakeSchema;
      case "restaurants": return restaurantSchema;
      case "grocery": return grocerySchema; // --- 'GROCERY' ADD KIYA ---
      default: return baseSchema;
    }
  };

  // Default values ko bhi update kiya
  const form = useForm<FormValues>({
    resolver: zodResolver(getSchema()),
    defaultValues: initialData ? {
      ...initialData,
      price: initialData.price?.toString(),
      duration: initialData.duration_minutes?.toString(),
      stockQuantity: initialData.stockQuantity?.toString(),
      isVeg: initialData.isVeg ?? true,
      inStock: initialData.inStock ?? true,
    } : { isVeg: true, inStock: true },
  });

  useEffect(() => {
    form.reset(initialData ? {
      ...initialData,
      price: initialData.price?.toString(),
      duration: initialData.duration_minutes?.toString(),
      stockQuantity: initialData.stockQuantity?.toString(),
      isVeg: initialData.isVeg ?? true,
      inStock: initialData.inStock ?? true,
    } : { isVeg: true, inStock: true });

    if (categorySlug === "beauty" && initialData?.category) {
      setCurrentSubCategories(beautySubCategories[initialData.category as keyof typeof beautySubCategories] || []);
    }
  }, [initialData, categorySlug, form]);

  const selectedCategory = form.watch("category");
  useEffect(() => {
    if (categorySlug === "beauty" && selectedCategory) {
      setCurrentSubCategories(beautySubCategories[selectedCategory as keyof typeof beautySubCategories] || []);
      if (!initialData || selectedCategory !== initialData.category) {
        form.setValue("subCategory", "");
      }
    } else {
      setCurrentSubCategories([]);
    }
  }, [selectedCategory, categorySlug, form, initialData]);

  // --- BUG FIX 3: onSubmit FUNCTION POORA FIX KAR DIYA ---
  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      // Common payload banaya
      const payload: any = {
        name: values.name,
        description: values.description || null,
        imageUrl: values.imageUrl || null,
        price: parseFloat(values.price),
        category: values.category || null,
      };

      // Category-specific payload add kiya
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
      } else if (categorySlug === "grocery") {
        payload.weight = values.weight || null;
        payload.unit = values.unit || null;
        payload.inStock = values.inStock;
        payload.stockQuantity = values.stockQuantity ? parseInt(values.stockQuantity) : 0;
      } else if (categorySlug === "cake-shop") {
        payload.weight = values.weight || null;
      }

      // API call ko theek kiya
      if (initialData) {
        // --- YEH HAI FIX (Update) ---
        await api.patch(`/provider/menu-items/${categorySlug}/${initialData.id}`, payload);
        toast({ title: "Success", description: "Menu item updated." });
      } else {
        // --- YEH HAI FIX (Create) ---
        await api.post(`/provider/menu-items/${categorySlug}`, payload);
        toast({ title: "Success", description: "Menu item added." });
      }
      onSuccess(); // Yeh function Dialog ko band karega aur list refresh karega
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to save.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    // Form JSX poora copy paste kiya hai (sirf 'grocery' ke fields add kiye hain)
    <div className="max-h-[70vh] overflow-y-auto pr-6 pl-2 -ml-2">
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
                <FormLabel>Image URL (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="https://..." {...field} />
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
                  <Input type="text" placeholder="e.g., 500.00" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* --- Category Specific Fields --- */}

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
              {currentSubCategories.length > 0 && (
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

          {/* --- YEH NAYA BLOCK HAI 'GROCERY' KE LIYE --- */}
          {categorySlug === "grocery" && (
            <>
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., BISCUITS, SPICES" {...field} />
                    </FormControl>
                    <FormDescription>
                      Enter the category name (e.g., BISCUITS, SPICES). Try to match existing categories.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="weight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Weight (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., 500g" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="unit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unit (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., kg, pack" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="stockQuantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stock Quantity</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g., 100" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="inStock"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>In Stock?</FormLabel>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </>
          )}
          {/* --- NAYA BLOCK KHATAM --- */}


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
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </>
          )}

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

          {categorySlug === "cake-shop" && (
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
              <FormField
                control={form.control}
                name="weight"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Weight (e.g., 1kg, 500g)</FormLabel>
                    <FormControl>
                      <Input placeholder="1kg" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </>
          )}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {initialData ? "Update Item" : "Add Item"}
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default MenuItemForm;