import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

interface Step6Props {
  formData: any;
  setFormData: (data: any) => void;
}

const luxuryInputClasses = "mt-1.5 min-h-[48px] border-[#E5DFC6] bg-white focus:border-[#C7A962] focus:ring-2 focus:ring-[#C7A962]/20 rounded-lg";

export const Step6OnlinePresence = ({ formData, setFormData }: Step6Props) => {
  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="h-8 w-1 bg-[#C7A962] rounded-full" />
          <h3 className="font-secondary text-xl md:text-2xl text-[#0a2225]">Online Presence & Content Creation</h3>
        </div>
        <p className="text-sm text-[#6B7280] mb-6 ml-4">
          <em className="font-secondary">Goldsainte</em> is a content-driven platform. Your social media presence and content creation abilities are important for success.
        </p>
        
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <Label htmlFor="instagram" className="text-sm font-medium text-[#0a2225]">Instagram Handle *</Label>
            <Input
              id="instagram"
              placeholder="@yourhandle"
              value={formData.instagramHandle || ""}
              onChange={(e) => setFormData({ ...formData, instagramHandle: e.target.value })}
              className={luxuryInputClasses}
            />
          </div>

          <div>
            <Label htmlFor="tiktok" className="text-sm font-medium text-[#0a2225]">TikTok Handle</Label>
            <Input
              id="tiktok"
              placeholder="@yourhandle"
              value={formData.tiktokHandle || ""}
              onChange={(e) => setFormData({ ...formData, tiktokHandle: e.target.value })}
              className={luxuryInputClasses}
            />
          </div>

          <div>
            <Label htmlFor="facebook" className="text-sm font-medium text-[#0a2225]">Facebook Page URL</Label>
            <Input
              id="facebook"
              type="url"
              placeholder="https://facebook.com/..."
              value={formData.facebookPageUrl || ""}
              onChange={(e) => setFormData({ ...formData, facebookPageUrl: e.target.value })}
              className={luxuryInputClasses}
            />
          </div>

          <div>
            <Label htmlFor="linkedin" className="text-sm font-medium text-[#0a2225]">LinkedIn Profile URL</Label>
            <Input
              id="linkedin"
              type="url"
              placeholder="https://linkedin.com/in/..."
              value={formData.linkedinProfileUrl || ""}
              onChange={(e) => setFormData({ ...formData, linkedinProfileUrl: e.target.value })}
              className={luxuryInputClasses}
            />
          </div>

          <div>
            <Label htmlFor="youtube" className="text-sm font-medium text-[#0a2225]">YouTube Channel URL</Label>
            <Input
              id="youtube"
              type="url"
              placeholder="https://youtube.com/..."
              value={formData.youtubeChannelUrl || ""}
              onChange={(e) => setFormData({ ...formData, youtubeChannelUrl: e.target.value })}
              className={luxuryInputClasses}
            />
          </div>

          <div>
            <Label htmlFor="blog" className="text-sm font-medium text-[#0a2225]">Blog URL</Label>
            <Input
              id="blog"
              type="url"
              placeholder="https://yourblog.com"
              value={formData.blogUrl || ""}
              onChange={(e) => setFormData({ ...formData, blogUrl: e.target.value })}
              className={luxuryInputClasses}
            />
          </div>

          <div>
            <Label htmlFor="googleBusiness" className="text-sm font-medium text-[#0a2225]">Google Business Profile</Label>
            <Input
              id="googleBusiness"
              placeholder="Business name on Google"
              value={formData.googleBusinessProfile || ""}
              onChange={(e) => setFormData({ ...formData, googleBusinessProfile: e.target.value })}
              className={luxuryInputClasses}
            />
          </div>

          <div>
            <Label htmlFor="totalFollowers" className="text-sm font-medium text-[#0a2225]">Total Social Media Followers</Label>
            <Input
              id="totalFollowers"
              type="number"
              placeholder="Combined across all platforms"
              value={formData.socialMediaFollowersTotal || ""}
              onChange={(e) => setFormData({ ...formData, socialMediaFollowersTotal: e.target.value })}
              className={luxuryInputClasses}
            />
          </div>

          <div>
            <Label htmlFor="reviewCount" className="text-sm font-medium text-[#0a2225]">Online Reviews Count</Label>
            <Input
              id="reviewCount"
              type="number"
              placeholder="Google, Facebook, TripAdvisor, etc."
              value={formData.onlineReviewsCount || ""}
              onChange={(e) => setFormData({ ...formData, onlineReviewsCount: e.target.value })}
              className={luxuryInputClasses}
            />
          </div>

          <div>
            <Label htmlFor="avgRating" className="text-sm font-medium text-[#0a2225]">Average Review Rating</Label>
            <Input
              id="avgRating"
              type="number"
              step="0.1"
              min="0"
              max="5"
              placeholder="e.g., 4.8"
              value={formData.averageReviewRating || ""}
              onChange={(e) => setFormData({ ...formData, averageReviewRating: e.target.value })}
              className={luxuryInputClasses}
            />
          </div>

          <div className="md:col-span-2 border-t border-[#E5DFC6] pt-6 mt-2 space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-6 w-1 bg-[#C7A962]/60 rounded-full" />
              <h4 className="font-secondary text-lg text-[#0a2225]">Content Creation Experience</h4>
            </div>
            
            <div className="flex items-center space-x-3">
              <Checkbox
                id="contentCreation"
                checked={formData.contentCreationExperience || false}
                onCheckedChange={(checked) => 
                  setFormData({ ...formData, contentCreationExperience: checked })
                }
                className="border-[#E5DFC6] data-[state=checked]:bg-[#0c4d47] data-[state=checked]:border-[#0c4d47]"
              />
              <Label htmlFor="contentCreation" className="text-sm cursor-pointer text-[#0a2225]">
                I have content creation experience (blog posts, articles, social media)
              </Label>
            </div>

            <div className="flex items-center space-x-3">
              <Checkbox
                id="videoCreation"
                checked={formData.videoContentCreation || false}
                onCheckedChange={(checked) => 
                  setFormData({ ...formData, videoContentCreation: checked })
                }
                className="border-[#E5DFC6] data-[state=checked]:bg-[#0c4d47] data-[state=checked]:border-[#0c4d47]"
              />
              <Label htmlFor="videoCreation" className="text-sm cursor-pointer text-[#0a2225]">
                I create video content (YouTube, TikTok, Reels, etc.)
              </Label>
            </div>

            <div className="flex items-center space-x-3">
              <Checkbox
                id="influencerPartnerships"
                checked={formData.influencerPartnerships || false}
                onCheckedChange={(checked) => 
                  setFormData({ ...formData, influencerPartnerships: checked })
                }
                className="border-[#E5DFC6] data-[state=checked]:bg-[#0c4d47] data-[state=checked]:border-[#0c4d47]"
              />
              <Label htmlFor="influencerPartnerships" className="text-sm cursor-pointer text-[#0a2225]">
                I have worked with travel influencers or content creators
              </Label>
            </div>

            <div className="grid gap-5 md:grid-cols-2 mt-5">
              <div>
                <Label htmlFor="emailPlatform" className="text-sm font-medium text-[#0a2225]">Email Marketing Platform</Label>
                <Input
                  id="emailPlatform"
                  placeholder="e.g., Mailchimp, Constant Contact"
                  value={formData.emailMarketingPlatform || ""}
                  onChange={(e) => setFormData({ ...formData, emailMarketingPlatform: e.target.value })}
                  className={luxuryInputClasses}
                />
              </div>

              <div>
                <Label htmlFor="emailListSize" className="text-sm font-medium text-[#0a2225]">Email List Size</Label>
                <Input
                  id="emailListSize"
                  type="number"
                  placeholder="Number of subscribers"
                  value={formData.emailListSize || ""}
                  onChange={(e) => setFormData({ ...formData, emailListSize: e.target.value })}
                  className={luxuryInputClasses}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
