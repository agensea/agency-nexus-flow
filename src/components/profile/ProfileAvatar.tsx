
import React, { useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface ProfileAvatarProps {
  url: string | null | undefined;
  onUpload: (url: string) => void;
  userId: string;
  name: string;
}

const ProfileAvatar: React.FC<ProfileAvatarProps> = ({ url, onUpload, userId, name }) => {
  const [uploading, setUploading] = useState(false);

  // Get user's initials for the avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error("You must select an image to upload.");
      }

      const file = event.target.files[0];
      const fileExt = file.name.split(".").pop();
      const filePath = `${userId}/${Math.random().toString(36).substring(2)}.${fileExt}`;

      // Upload file to Supabase storage
      const { error: uploadError, data } = await supabase.storage
        .from("profile-pictures")
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("profile-pictures")
        .getPublicUrl(filePath);

      onUpload(publicUrl);
      toast.success("Profile picture updated successfully");
    } catch (error: any) {
      toast.error(error.message || "Error uploading avatar");
      console.error("Error uploading avatar:", error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <Avatar className="h-24 w-24">
        <AvatarImage src={url || ""} alt="Profile" />
        <AvatarFallback className="text-lg">{getInitials(name)}</AvatarFallback>
      </Avatar>
      
      <div className="flex flex-col gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => document.getElementById("single-avatar-upload")?.click()} 
          disabled={uploading}
          className="relative"
        >
          {uploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Camera className="mr-2 h-4 w-4" />
              Change Profile Picture
            </>
          )}
          <input
            id="single-avatar-upload"
            type="file"
            accept="image/*"
            onChange={uploadAvatar}
            className="sr-only"
          />
        </Button>
        <p className="text-xs text-muted-foreground">
          JPG, PNG or GIF. Max size 2MB.
        </p>
      </div>
    </div>
  );
};

export default ProfileAvatar;
