import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, CheckCircle2, Loader2, Shield, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AccountTypeSelector } from "@/components/AccountTypeSelector";
import { BusinessVerificationUpload } from "@/components/BusinessVerificationUpload";
import { BusinessVerifiedBadge } from "@/components/badges/BusinessVerifiedBadge";
import { BackButton } from "@/components/ui/BackButton";
import { UsernameField } from "@/components/profile/UsernameField";
import { FeaturedTikTokManager } from "@/components/profile/FeaturedTikTokManager";

interface Profile {
  username: string | null;
  avatar_url: string | null;
  first_name: string | null;
  last_name: string | null;
  bio: string | null;
  is_verified: boolean;
  account_type?: 'personal' | 'creator' | 'business';
  show_account_type?: boolean;
  is_business_verified?: boolean;
}

const TravelSettings = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile>({
    username: '',
    avatar_url: null,
    first_name: '',
    last_name: '',
    bio: '',
    is_verified: false,
    account_type: 'personal',
    show_account_type: false,
    is_business_verified: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [checkingVerification, setCheckingVerification] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [clearingCache, setClearingCache] = useState(false);

  useEffect(() => {
    if (user) {
      fetchProfile();
      checkVerificationStatus();
    }
  }, [user]);

  // Check for verification success from redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('verification') === 'success') {
      toast.success('Payment successful! Checking verification status...');
      // Wait a moment for Stripe webhook to process, then check
      setTimeout(() => {
        checkVerificationStatus();
      }, 2000);
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
    } else if (params.get('verification') === 'cancelled') {
      toast.info('Verification cancelled');
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*, full_name')
        .eq('id', user?.id)
        .single();

      if (error) throw error;
      if (data) {
        const accountType = (data.account_type as 'personal' | 'creator' | 'business') || 'personal';
        setProfile({
          username: data.username,
          avatar_url: data.avatar_url,
          first_name: data.first_name,
          last_name: data.last_name,
          bio: data.bio,
          is_verified: data.is_verified || false,
          account_type: accountType,
          show_account_type: data.show_account_type || false,
          is_business_verified: data.is_business_verified || false,
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const checkVerificationStatus = async () => {
    setCheckingVerification(true);
    try {
      // Get auth token for Edge Function calls
      const { data: sessionData } = await supabase.auth.getSession();
      const headers = { Authorization: `Bearer ${sessionData.session?.access_token}` };

      const { data, error } = await supabase.functions.invoke('check-verification', { headers });
      
      if (error) throw error;
      
      if (data?.is_verified) {
        // Update local profile state
        setProfile(prev => ({ ...prev, is_verified: true }));
      }
    } catch (error) {
      console.error('Error checking verification:', error);
    } finally {
      setCheckingVerification(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          username: profile.username,
          first_name: profile.first_name,
          last_name: profile.last_name,
          bio: profile.bio,
          account_type: profile.account_type,
          show_account_type: profile.show_account_type,
        })
        .eq('id', user?.id);

      if (error) throw error;
      
      toast.success('Profile updated successfully!');
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser) navigate(`/creator/${currentUser.id}`);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setUploadingPhoto(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('travel-videos')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('travel-videos')
        .getPublicUrl(filePath);

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user?.id);

      if (updateError) throw updateError;

      setProfile({ ...profile, avatar_url: publicUrl });
      toast.success('Profile photo updated!');
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast.error('Failed to upload photo');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleGetVerified = async () => {
    try {
      toast.loading('Opening checkout...');
      
      // Get auth token for Edge Function calls
      const { data: sessionData } = await supabase.auth.getSession();
      const headers = { Authorization: `Bearer ${sessionData.session?.access_token}` };
      
      const { data, error } = await supabase.functions.invoke('create-verification-checkout', {
        body: { returnUrl: window.location.origin + window.location.pathname },
        headers
      });

      if (error) throw error;
      
      if (data?.url) {
        window.open(data.url, '_blank');
        toast.success('Checkout opened in new tab');
      }
    } catch (error: any) {
      console.error('Error creating checkout:', error);
      toast.error(error.message || 'Failed to start verification process');
    }
  };

  const handleClearCache = async () => {
    setClearingCache(true);
    try {
      const { data, error } = await supabase.functions.invoke('clear-search-cache');

      if (error) throw error;

      if (data?.success) {
        toast.success(`Cache cleared! Removed ${data.cleared_entries || 0} cached searches`);
      } else {
        throw new Error('Failed to clear cache');
      }
    } catch (error: any) {
      console.error('Error clearing cache:', error);
      toast.error(error.message || 'Failed to clear search cache');
    } finally {
      setClearingCache(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">Sign in required</h2>
          <Button onClick={() => navigate('/auth')}>Sign In</Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-lg border-b">
        <div className="flex items-center gap-4 p-4">
          <BackButton />
          <Avatar className="h-9 w-9">
            <AvatarImage src={profile.avatar_url || undefined} />
            <AvatarFallback className="bg-primary text-primary-foreground text-sm">
              {profile.username?.[0]?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <h1 className="text-xl font-bold">Settings</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-6 space-y-6">
        {/* Profile Picture */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Picture</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={profile.avatar_url || undefined} />
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                {profile.username?.[0]?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <input
                type="file"
                id="avatar-upload"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoUpload}
                disabled={uploadingPhoto}
              />
              <Button 
                variant="outline" 
                className="gap-2"
                onClick={() => document.getElementById('avatar-upload')?.click()}
                disabled={uploadingPhoto}
              >
                {uploadingPhoto ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Camera className="h-4 w-4" />
                    Change Photo
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Public Handle */}
        {user?.id && (
          <Card>
            <CardHeader>
              <CardTitle>Public Handle</CardTitle>
              <CardDescription>
                Pick the handle for your shareable shop link.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UsernameField userId={user.id} initialValue={profile.username || null} />
            </CardContent>
          </Card>
        )}

        {/* Featured TikTok Videos */}
        {user?.id && (
          <Card>
            <CardHeader>
              <CardTitle>Featured TikTok Videos</CardTitle>
              <CardDescription>
                Embed up to 6 TikTok videos on your public profile.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FeaturedTikTokManager userId={user.id} />
            </CardContent>
          </Card>
        )}

        {/* Account Type */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Account Type
            </CardTitle>
            <CardDescription>
              Choose the account type that best fits your needs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AccountTypeSelector
              currentType={profile.account_type || 'personal'}
              onTypeChange={(type) => setProfile({ ...profile, account_type: type })}
              showBadgeToggle={profile.show_account_type || false}
              onShowBadgeChange={(show) => setProfile({ ...profile, show_account_type: show })}
            />
          </CardContent>
        </Card>

        {/* Business Verification */}
        {profile.account_type === 'business' && !profile.is_business_verified && (
          <BusinessVerificationUpload onSuccess={fetchProfile} />
        )}

        {profile.account_type === 'business' && profile.is_business_verified && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Business Verification
                <BusinessVerifiedBadge />
              </CardTitle>
              <CardDescription>
                Your business has been verified! You now have the gold verification badge.
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        {/* Individual Verification Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Individual Verification
              {profile.is_verified && (
                <CheckCircle2 className="h-5 w-5 text-blue-500 fill-blue-500" />
              )}
            </CardTitle>
            <CardDescription>
              Get a blue verified badge on your profile for $8/month
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {profile.is_verified ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-blue-500" />
                <span>Your account is verified</span>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Benefits of verification:
                </p>
                <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                  <li>Blue verified badge on your profile</li>
                  <li>Increased visibility in the feed</li>
                  <li>Priority support</li>
                  <li>Exclusive features access</li>
                </ul>
                <Button onClick={handleGetVerified} className="w-full gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Get Verified - $8/month
                </Button>
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={checkVerificationStatus}
              disabled={checkingVerification}
              className="w-full"
            >
              {checkingVerification ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Checking...
                </>
              ) : (
                'Refresh Verification Status'
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Profile Information */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={profile.username || ''}
                onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                placeholder="your_username"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">First Name</Label>
                <Input
                  id="first_name"
                  value={profile.first_name || ''}
                  onChange={(e) => setProfile({ ...profile, first_name: e.target.value })}
                  placeholder="John"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Last Name</Label>
                <Input
                  id="last_name"
                  value={profile.last_name || ''}
                  onChange={(e) => setProfile({ ...profile, last_name: e.target.value })}
                  placeholder="Doe"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={profile.bio || ''}
                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                placeholder="Tell us about yourself..."
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* Developer Tools */}
        <Card>
          <CardHeader>
            <CardTitle>Troubleshooting</CardTitle>
            <CardDescription>
              Tools to help resolve search and performance issues
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Clear Search Cache</Label>
              <p className="text-sm text-muted-foreground">
                If you're experiencing issues with search results (like seeing outdated or no results), 
                clearing the cache will force fresh searches from the APIs.
              </p>
              <Button
                variant="outline"
                onClick={handleClearCache}
                disabled={clearingCache}
                className="w-full gap-2"
              >
                {clearingCache ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Clearing Cache...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    Clear Search Cache
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <Button
          onClick={handleSave}
          disabled={saving}
          className="w-full"
          size="lg"
        >
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Changes'
          )}
        </Button>
      </div>
    </div>
  );
};

export default TravelSettings;
