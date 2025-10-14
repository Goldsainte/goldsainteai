import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Upload, CheckCircle2, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const UploadAppleMusicKey = () => {
  const [p8File, setP8File] = useState<File | null>(null);
  const [p8Content, setP8Content] = useState<string>('');
  const [keyId, setKeyId] = useState('');
  const [teamId, setTeamId] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [allUploaded, setAllUploaded] = useState(false);

  const handleP8FileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.name.endsWith('.p8')) {
      setP8File(file);
      const content = await file.text();
      setP8Content(content);
    } else {
      toast.error('Please select a valid .p8 file');
    }
  };

  const handleUploadAll = async () => {
    if (!p8Content || !keyId.trim() || !teamId.trim()) {
      toast.error('Please provide all credentials');
      return;
    }

    setIsUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('apple_music_credentials')
        .upsert({
          user_id: user.id,
          p8_key: p8Content,
          key_id: keyId,
          team_id: teamId,
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      setAllUploaded(true);
      toast.success('All credentials saved successfully!');
    } catch (error) {
      console.error('Error saving credentials:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save credentials');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Upload Apple Music Credentials</h1>
          <p className="text-muted-foreground">
            Configure your Apple Music API credentials to enable music search functionality.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Upload Apple Music Credentials</CardTitle>
            <CardDescription>
              Provide all three credentials to enable Apple Music search
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="p8-file">P8 Private Key File (.p8)</Label>
              <Input
                id="p8-file"
                type="file"
                accept=".p8"
                onChange={handleP8FileChange}
                disabled={isUploading || allUploaded}
                className="mt-2"
              />
            </div>
            
            <div>
              <Label htmlFor="key-id">Key ID (10 characters)</Label>
              <Input
                id="key-id"
                type="text"
                placeholder="ABC123DEFG"
                value={keyId}
                onChange={(e) => setKeyId(e.target.value)}
                disabled={isUploading || allUploaded}
                className="mt-2"
                maxLength={10}
              />
            </div>
            
            <div>
              <Label htmlFor="team-id">Team ID (10 characters)</Label>
              <Input
                id="team-id"
                type="text"
                placeholder="XYZ987WXYZ"
                value={teamId}
                onChange={(e) => setTeamId(e.target.value)}
                disabled={isUploading || allUploaded}
                className="mt-2"
                maxLength={10}
              />
            </div>

            <Button
              onClick={handleUploadAll}
              disabled={!p8Content || !keyId.trim() || !teamId.trim() || isUploading || allUploaded}
              className="w-full"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving Credentials...
                </>
              ) : allUploaded ? (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  All Credentials Saved
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Save All Credentials
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {allUploaded && (
          <Card className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950">
            <CardHeader>
              <CardTitle className="text-green-700 dark:text-green-300 flex items-center">
                <CheckCircle2 className="w-5 h-5 mr-2" />
                Configuration Complete
              </CardTitle>
              <CardDescription className="text-green-600 dark:text-green-400">
                All Apple Music credentials have been securely saved. Music search is now enabled.
              </CardDescription>
            </CardHeader>
          </Card>
        )}
      </div>
    </div>
  );
};

export default UploadAppleMusicKey;
