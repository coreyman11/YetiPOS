import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface LogoSettingsProps {
  locationId: string;
}

interface LogoSettings {
  id?: string;
  logo_url?: string;
  location_id: string;
}

// Auto-compress image function
const compressImage = (file: File, maxWidth: number = 200, quality: number = 0.8): Promise<Blob> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const img = new Image();
    
    img.onload = () => {
      // Calculate new dimensions while maintaining aspect ratio
      const aspectRatio = img.width / img.height;
      let newWidth = maxWidth;
      let newHeight = maxWidth / aspectRatio;
      
      if (newHeight > maxWidth) {
        newHeight = maxWidth;
        newWidth = maxWidth * aspectRatio;
      }
      
      canvas.width = newWidth;
      canvas.height = newHeight;
      
      // Draw and compress
      ctx.drawImage(img, 0, 0, newWidth, newHeight);
      canvas.toBlob(resolve, 'image/jpeg', quality);
    };
    
    img.src = URL.createObjectURL(file);
  });
};

export const LogoSettings = ({ locationId }: LogoSettingsProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  // Fetch current logo settings
  const { data: logoSettings, isLoading } = useQuery({
    queryKey: ['logo-settings', locationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('logo_settings')
        .select('*')
        .eq('location_id', locationId)
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      return data;
    },
  });

  // Upload logo mutation
  const uploadLogoMutation = useMutation({
    mutationFn: async (file: File) => {
      setIsUploading(true);
      
      try {
        // Compress the image
        const compressedBlob = await compressImage(file);
        const compressedFile = new File([compressedBlob!], file.name, {
          type: 'image/jpeg',
        });

        const fileExt = 'jpg';
        const fileName = `logo-${locationId}-${Date.now()}.${fileExt}`;
        const filePath = `logos/${fileName}`;

        // Upload to storage
        const { error: uploadError } = await supabase.storage
          .from('receipt_logos')
          .upload(filePath, compressedFile);

        if (uploadError) {
          throw uploadError;
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('receipt_logos')
          .getPublicUrl(filePath);

        // Save to database
        const { data, error } = await supabase
          .from('logo_settings')
          .upsert({
            location_id: locationId,
            logo_url: publicUrl,
          }, {
            onConflict: 'location_id'
          })
          .select()
          .single();

        if (error) {
          throw error;
        }

        return data;
      } finally {
        setIsUploading(false);
      }
    },
    onSuccess: () => {
      toast.success("Logo uploaded successfully!");
      queryClient.invalidateQueries({ queryKey: ['logo-settings'] });
    },
    onError: (error) => {
      toast.error("Failed to upload logo: " + error.message);
    },
  });

  // Remove logo mutation
  const removeLogoMutation = useMutation({
    mutationFn: async () => {
      if (!logoSettings?.logo_url) return;

      // Extract file path from URL
      const url = new URL(logoSettings.logo_url);
      const filePath = url.pathname.split('/').slice(-2).join('/');

      // Delete from storage
      await supabase.storage
        .from('receipt_logos')
        .remove([filePath]);

      // Remove from database
      const { error } = await supabase
        .from('logo_settings')
        .delete()
        .eq('location_id', locationId);

      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      toast.success("Logo removed successfully!");
      queryClient.invalidateQueries({ queryKey: ['logo-settings'] });
    },
    onError: (error) => {
      toast.error("Failed to remove logo: " + error.message);
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    uploadLogoMutation.mutate(file);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveLogo = () => {
    removeLogoMutation.mutate();
  };

  if (isLoading) {
    return <div>Loading logo settings...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Logo Settings</CardTitle>
        <CardDescription>
          Upload your company logo. It will be displayed on receipts and the employee login screen.
          Images are automatically compressed to optimize file size.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <Label>Current Logo</Label>
          {logoSettings?.logo_url ? (
            <div className="flex items-center gap-4">
              <div className="relative">
                <img
                  src={logoSettings.logo_url}
                  alt="Current logo"
                  className="h-16 w-auto max-w-[200px] object-contain border rounded"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRemoveLogo}
                disabled={removeLogoMutation.isPending}
              >
                <X className="h-4 w-4 mr-2" />
                Remove Logo
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No logo uploaded</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Upload New Logo</Label>
          <div className="flex items-center gap-4">
            <Button
              onClick={handleUploadClick}
              disabled={isUploading}
              variant="outline"
            >
              <Upload className="h-4 w-4 mr-2" />
              {isUploading ? "Uploading..." : "Choose File"}
            </Button>
            <span className="text-sm text-muted-foreground">
              Supports PNG, JPG. Max 5MB. Will be compressed automatically.
            </span>
          </div>
          <Input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      </CardContent>
    </Card>
  );
};