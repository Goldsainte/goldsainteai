import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { InstagramProfile } from "@/components/InstagramProfile";
import { useEffect } from "react";

interface Profile {
  id: string;
  username: string | null;
  avatar_url: string | null;
  first_name: string | null;
  last_name: string | null;
  bio: string | null;
  phone: string | null;
  website: string | null;
  location: string | null;
  instagram_username: string | null;
}

export default function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <InstagramProfile />
    </div>
  );
}
