import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Upload, Loader2, Image as ImageIcon } from "lucide-react";
import api from "@/lib/api";

export function QuickImageUpload({ 
    itemId, 
    categorySlug, 
    currentImage, 
    onUploadSuccess 
}: { 
    itemId: string, 
    categorySlug: string, 
    currentImage?: string | null, 
    onUploadSuccess: () => void 
}) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();
    const [isUploading, setIsUploading] = useState(false);

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append("images", file);

        try {
            // First upload the image to Cloudinary
            const uploadRes = await api.post("/upload", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            if (uploadRes.data.urls && uploadRes.data.urls.length > 0) {
                const newImageUrl = uploadRes.data.urls[0];
                
                // Then update the item directly
                await api.patch(`/provider/menu-items/${categorySlug}/${itemId}`, {
                    imageUrl: newImageUrl
                });

                toast({ title: "Success", description: "Image updated instantly!" });
                onUploadSuccess();
            }
        } catch (error: any) {
            console.error("Upload error:", error);
            toast({
                title: "Upload Failed",
                description: error.response?.data?.message || "Could not upload image",
                variant: "destructive",
            });
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    return (
        <div className="relative group cursor-pointer w-16 h-16 rounded-md overflow-hidden bg-muted flex items-center justify-center border" onClick={handleClick}>
            <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleFileChange} 
            />
            
            {currentImage ? (
                <img src={currentImage} className="w-full h-full object-cover group-hover:opacity-50 transition-opacity" />
            ) : (
                <ImageIcon className="text-muted-foreground w-6 h-6 group-hover:opacity-50 transition-opacity" />
            )}

            <div className={`absolute inset-0 flex items-center justify-center bg-black/40 transition-opacity ${isUploading ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                {isUploading ? (
                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                ) : (
                    <Upload className="w-5 h-5 text-white drop-shadow-md" />
                )}
            </div>
        </div>
    );
}
