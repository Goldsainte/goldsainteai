import { Link } from "react-router-dom";
import { ArrowRight, MapPin, Calendar, Bookmark, MessageCircle } from "lucide-react";
import { ProfilePhotoUploader } from "./ProfilePhotoUploader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface TravelerOverviewTabProps {
  profile: {
    id: string;
    display_name?: string | null;
    avatar_url?: string | null;
    created_at?: string | null;
  } | null;
  stats: {
    tripRequests: number;
    bookings: number;
    storyboards: number;
  };
  onAvatarUpdate: (url: string) => void;
}

export function TravelerOverviewTab({ profile, stats, onAvatarUpdate }: TravelerOverviewTabProps) {
  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })
    : "Recently";

  return (
    <div className="space-y-8">
      {/* Hero Profile Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 bg-white border-[#E5DFC6] rounded-2xl">
          <CardContent className="p-8 flex flex-col items-center text-center">
            <ProfilePhotoUploader
              userId={profile?.id || ""}
              currentAvatarUrl={profile?.avatar_url}
              displayName={profile?.display_name || "Traveler"}
              onUploadComplete={onAvatarUpdate}
              size="lg"
            />
            <h2 className="mt-4 font-secondary text-2xl text-[#0a2225]">
              {profile?.display_name || "Traveler"}
            </h2>
            <p className="text-sm text-[#6B7280] mt-1">Member since {memberSince}</p>
            
            <div className="mt-6 w-full pt-6 border-t border-[#E5DFC6]">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-semibold text-[#0a2225]">{stats.tripRequests}</p>
                  <p className="text-xs text-[#6B7280] mt-1">Requests</p>
                </div>
                <div>
                  <p className="text-2xl font-semibold text-[#0a2225]">{stats.bookings}</p>
                  <p className="text-xs text-[#6B7280] mt-1">Bookings</p>
                </div>
                <div>
                  <p className="text-2xl font-semibold text-[#0a2225]">{stats.storyboards}</p>
                  <p className="text-xs text-[#6B7280] mt-1">Storyboards</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="lg:col-span-2 grid grid-cols-2 gap-4">
          <Card className="bg-white border-[#E5DFC6] rounded-2xl hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-[#C7A962] font-medium tracking-wider uppercase">Active Requests</p>
                  <p className="text-3xl font-secondary text-[#0a2225] mt-2">{stats.tripRequests}</p>
                  <p className="text-sm text-[#6B7280] mt-1">Awaiting proposals</p>
                </div>
                <div className="p-3 bg-[#F6F0E4] rounded-xl">
                  <MapPin className="h-5 w-5 text-[#C7A962]" />
                </div>
              </div>
              <Link to="/my-trips?tab=requests" className="mt-4 inline-flex items-center text-sm text-[#0a2225] hover:text-[#C7A962] transition-colors">
                View all requests <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </CardContent>
          </Card>

          <Card className="bg-white border-[#E5DFC6] rounded-2xl hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-[#C7A962] font-medium tracking-wider uppercase">Upcoming Trips</p>
                  <p className="text-3xl font-secondary text-[#0a2225] mt-2">{stats.bookings}</p>
                  <p className="text-sm text-[#6B7280] mt-1">Confirmed bookings</p>
                </div>
                <div className="p-3 bg-[#F6F0E4] rounded-xl">
                  <Calendar className="h-5 w-5 text-[#C7A962]" />
                </div>
              </div>
              <Link to="/my-trips?tab=bookings" className="mt-4 inline-flex items-center text-sm text-[#0a2225] hover:text-[#C7A962] transition-colors">
                View bookings <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </CardContent>
          </Card>

          <Card className="bg-white border-[#E5DFC6] rounded-2xl hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-[#C7A962] font-medium tracking-wider uppercase">Storyboards</p>
                  <p className="text-3xl font-secondary text-[#0a2225] mt-2">{stats.storyboards}</p>
                  <p className="text-sm text-[#6B7280] mt-1">Saved inspiration</p>
                </div>
                <div className="p-3 bg-[#F6F0E4] rounded-xl">
                  <Bookmark className="h-5 w-5 text-[#C7A962]" />
                </div>
              </div>
              <Link to="/storyboards" className="mt-4 inline-flex items-center text-sm text-[#0a2225] hover:text-[#C7A962] transition-colors">
                View storyboards <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-[#0a2225] to-[#1a3a3f] border-none rounded-2xl hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-[#C7A962] font-medium tracking-wider uppercase">Ask Madison</p>
                  <p className="text-lg font-secondary text-white mt-2">Your AI Concierge</p>
                  <p className="text-sm text-white/70 mt-1">Plan your next adventure</p>
                </div>
                <div className="p-3 bg-white/10 rounded-xl">
                  <MessageCircle className="h-5 w-5 text-[#C7A962]" />
                </div>
              </div>
              <Link to="/concierge" className="mt-4 inline-flex items-center text-sm text-white hover:text-[#C7A962] transition-colors">
                Start chatting <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Actions */}
      <Card className="bg-[#FDFBF5] border-[#E5DFC6] rounded-2xl">
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="space-y-2">
              <p className="text-xs text-[#C7A962] font-medium tracking-wider uppercase">Start Planning</p>
              <h3 className="font-secondary text-2xl text-[#0a2225]">
                Ready to turn inspiration into a real journey?
              </h3>
              <p className="text-base text-[#6B7280]">
                Create a storyboard, post a trip request, or chat with Madison to start planning.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild className="bg-[#0a2225] hover:bg-[#0a2225]/90 text-white rounded-full px-6">
                <Link to="/post-trip">
                  Post Trip Request
                </Link>
              </Button>
              <Button asChild variant="outline" className="border-[#E5DFC6] text-[#0a2225] hover:bg-[#F6F0E4] rounded-full px-6">
                <Link to="/storyboards/new">
                  Create Storyboard
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
