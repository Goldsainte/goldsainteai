import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

interface Step6Props {
  formData: any;
  setFormData: (data: any) => void;
}

export const Step6OnlinePresence = ({ formData, setFormData }: Step6Props) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-4 text-lg font-semibold">Online Presence & Content Creation</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Goldsainte is a content-driven platform. Your social media presence and content creation abilities are important for success.
        </p>
        
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="instagram">Instagram Handle *</Label>
            <Input
              id="instagram"
              placeholder="@yourhandle"
              value={formData.instagramHandle || ""}
              onChange={(e) => setFormData({ ...formData, instagramHandle: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="tiktok">TikTok Handle</Label>
            <Input
              id="tiktok"
              placeholder="@yourhandle"
              value={formData.tiktokHandle || ""}
              onChange={(e) => setFormData({ ...formData, tiktokHandle: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="facebook">Facebook Page URL</Label>
            <Input
              id="facebook"
              type="url"
              placeholder="https://facebook.com/..."
              value={formData.facebookPageUrl || ""}
              onChange={(e) => setFormData({ ...formData, facebookPageUrl: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="linkedin">LinkedIn Profile URL</Label>
            <Input
              id="linkedin"
              type="url"
              placeholder="https://linkedin.com/in/..."
              value={formData.linkedinProfileUrl || ""}
              onChange={(e) => setFormData({ ...formData, linkedinProfileUrl: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="youtube">YouTube Channel URL</Label>
            <Input
              id="youtube"
              type="url"
              placeholder="https://youtube.com/..."
              value={formData.youtubeChannelUrl || ""}
              onChange={(e) => setFormData({ ...formData, youtubeChannelUrl: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="blog">Blog URL</Label>
            <Input
              id="blog"
              type="url"
              placeholder="https://yourblog.com"
              value={formData.blogUrl || ""}
              onChange={(e) => setFormData({ ...formData, blogUrl: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="googleBusiness">Google Business Profile</Label>
            <Input
              id="googleBusiness"
              placeholder="Business name on Google"
              value={formData.googleBusinessProfile || ""}
              onChange={(e) => setFormData({ ...formData, googleBusinessProfile: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="totalFollowers">Total Social Media Followers</Label>
            <Input
              id="totalFollowers"
              type="number"
              placeholder="Combined across all platforms"
              value={formData.socialMediaFollowersTotal || ""}
              onChange={(e) => setFormData({ ...formData, socialMediaFollowersTotal: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="reviewCount">Online Reviews Count</Label>
            <Input
              id="reviewCount"
              type="number"
              placeholder="Google, Facebook, TripAdvisor, etc."
              value={formData.onlineReviewsCount || ""}
              onChange={(e) => setFormData({ ...formData, onlineReviewsCount: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="avgRating">Average Review Rating</Label>
            <Input
              id="avgRating"
              type="number"
              step="0.1"
              min="0"
              max="5"
              placeholder="e.g., 4.8"
              value={formData.averageReviewRating || ""}
              onChange={(e) => setFormData({ ...formData, averageReviewRating: e.target.value })}
            />
          </div>

          <div className="md:col-span-2 border-t pt-4 space-y-3">
            <h4 className="mb-3 text-base font-semibold">Content Creation Experience</h4>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="contentCreation"
                checked={formData.contentCreationExperience || false}
                onCheckedChange={(checked) => 
                  setFormData({ ...formData, contentCreationExperience: checked })
                }
              />
              <Label htmlFor="contentCreation" className="text-sm cursor-pointer">
                I have content creation experience (blog posts, articles, social media)
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="videoCreation"
                checked={formData.videoContentCreation || false}
                onCheckedChange={(checked) => 
                  setFormData({ ...formData, videoContentCreation: checked })
                }
              />
              <Label htmlFor="videoCreation" className="text-sm cursor-pointer">
                I create video content (YouTube, TikTok, Reels, etc.)
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="influencerPartnerships"
                checked={formData.influencerPartnerships || false}
                onCheckedChange={(checked) => 
                  setFormData({ ...formData, influencerPartnerships: checked })
                }
              />
              <Label htmlFor="influencerPartnerships" className="text-sm cursor-pointer">
                I have worked with travel influencers or content creators
              </Label>
            </div>

            <div className="grid gap-4 md:grid-cols-2 mt-4">
              <div>
                <Label htmlFor="emailPlatform">Email Marketing Platform</Label>
                <Input
                  id="emailPlatform"
                  placeholder="e.g., Mailchimp, Constant Contact"
                  value={formData.emailMarketingPlatform || ""}
                  onChange={(e) => setFormData({ ...formData, emailMarketingPlatform: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="emailListSize">Email List Size</Label>
                <Input
                  id="emailListSize"
                  type="number"
                  placeholder="Number of subscribers"
                  value={formData.emailListSize || ""}
                  onChange={(e) => setFormData({ ...formData, emailListSize: e.target.value })}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};