import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { SimpleHeader } from "@/components/SimpleHeader";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Briefcase } from "lucide-react";

export default function AgentOnboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;

    const formData = new FormData(e.currentTarget);
    setLoading(true);

    try {
      const specializations = (formData.get('specializations') as string).split(',').map(s => s.trim());
      const languages = (formData.get('languages') as string).split(',').map(l => l.trim());

      const { error } = await supabase
        .from('travel_agents')
        .insert({
          user_id: user.id,
          agency_name: formData.get('agency_name') as string,
          bio: formData.get('bio') as string,
          experience_years: parseInt(formData.get('experience_years') as string),
          specializations,
          languages,
          license_number: formData.get('license_number') as string
        } as any);

      if (error) throw error;

      toast.success('Agent profile created! Pending verification.');
      navigate('/marketplace');
    } catch (error: any) {
      console.error('Error creating agent profile:', error);
      toast.error(error.message || 'Failed to create agent profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SimpleHeader />
      
      <main className="flex-1 container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <Briefcase className="h-8 w-8 text-primary" />
              <CardTitle className="text-3xl font-chiffon">Become a Travel Agent</CardTitle>
            </div>
            <CardDescription>
              Join our marketplace and help travelers plan their perfect trips
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="agency_name">Agency Name *</Label>
                <Input id="agency_name" name="agency_name" required placeholder="Your Travel Agency" />
              </div>

              <div>
                <Label htmlFor="bio">Professional Bio *</Label>
                <Textarea id="bio" name="bio" required placeholder="Tell us about your experience and expertise..." rows={4} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="experience_years">Years of Experience *</Label>
                  <Input id="experience_years" name="experience_years" type="number" required min="0" />
                </div>
                
                <div>
                  <Label htmlFor="license_number">License Number</Label>
                  <Input id="license_number" name="license_number" placeholder="Optional" />
                </div>
              </div>

              <div>
                <Label htmlFor="specializations">Specializations *</Label>
                <Input 
                  id="specializations" 
                  name="specializations" 
                  required 
                  placeholder="Luxury, Adventure, Family, Business (comma-separated)" 
                />
                <p className="text-sm text-muted-foreground mt-1">Separate with commas</p>
              </div>

              <div>
                <Label htmlFor="languages">Languages *</Label>
                <Input 
                  id="languages" 
                  name="languages" 
                  required 
                  placeholder="English, Spanish, French (comma-separated)" 
                />
                <p className="text-sm text-muted-foreground mt-1">Separate with commas</p>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Creating Profile...' : 'Submit Application'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}
