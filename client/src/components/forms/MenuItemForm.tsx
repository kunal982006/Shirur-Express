import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

// API function to upload the image
const uploadImage = async (imageFile: File): Promise<string> => {
  const formData = new FormData();
  formData.append("image", imageFile);

  const response = await fetch("/api/upload-image", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Image upload failed.");
  }
  const data = await response.json();
  return data.imageUrl;
};

// API function to save the menu item data
const saveMenuItem = async ({ itemData, itemId }: { itemData: any, itemId?: string }) => {
  const isEditing = !!itemId;
  const url = isEditing ? `/api/menu-items/${itemId}` : "/api/menu-items";
  const method = isEditing ? "PATCH" : "POST";

  const response = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(itemData),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || `Item ${isEditing ? 'update' : 'create'} nahi ho paaya.`);
  }
  return response.json();
};

interface MenuItemFormProps {
  providerId: string;
  initialData?: any | null;
  onSuccess: () => void;
}

export function MenuItemForm({ providerId, initialData, onSuccess }: MenuItemFormProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);

  const isEditing = !!initialData;

  useEffect(() => {
    if (isEditing) {
      setName(initialData.name || "");
      setPrice(initialData.price || "");
      setDescription(initialData.description || "");
      setExistingImageUrl(initialData.imageUrl || null);
    }
  }, [initialData, isEditing]);

  const mutation = useMutation({
    mutationFn: saveMenuItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myMenu', providerId] });
      toast({ title: "Success!", description: `Menu item successfully ${isEditing ? 'updated' : 'added'}.` });
      onSuccess();
    },
    onError: (error) => {
      toast({ title: "Oh no! Something went wrong.", description: error.message, variant: "destructive" });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let finalImageUrl = existingImageUrl;

    try {
      if (imageFile) {
        // Pehle image upload karo aur URL lo
        finalImageUrl = await uploadImage(imageFile);
      }

      const itemData = {
        name,
        price,
        description,
        imageUrl: finalImageUrl,
      };

      // Fir baaki details ke saath mutation call karo
      mutation.mutate({ itemData, itemId: initialData?.id });

    } catch (error: any) {
        toast({ title: "Error!", description: error.message, variant: "destructive" });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="image">Item Image</Label>
        {existingImageUrl && !imageFile && (
          <div className="mb-2">
            <img src={existingImageUrl} alt="Current item" className="w-24 h-24 object-cover rounded-md" />
          </div>
        )}
        <Input 
          id="image" 
          type="file" 
          accept="image/*" 
          onChange={(e) => e.target.files && setImageFile(e.target.files[0])} 
        />
        <p className="text-xs text-muted-foreground">Best quality photos attract more customers.</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">Item Name</Label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="price">Price (₹)</Label>
        <Input id="price" type="number" value={price} onChange={(e) => setPrice(e.target.value)} required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>

      <Button type="submit" disabled={mutation.isPending}>
        {mutation.isPending ? "Saving..." : (isEditing ? "Update Item" : "Save Item")}
      </Button>
    </form>
  );
}