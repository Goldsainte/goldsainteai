import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Home, Search, PlusSquare, ShoppingBag, Video, MessageCircle } from 'lucide-react';
import { JourneysFeed } from './feed/JourneysFeed';
import { SaintesFeed } from './feed/SaintesFeed';
import { MomentsRing } from './MomentsRing';
import { useStreamActivity } from '@/contexts/StreamActivityContext';
import { FeedLayout } from './FeedLayout';

const StreamActivityFeed = () => {
  const navigate = useNavigate();
  const { isReady } = useStreamActivity();
  const [activeTab, setActiveTab] = useState<'journeys' | 'saintes'>('journeys');

  if (!isReady) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <p className="text-muted-foreground">Connecting to Goldsainte...</p>
      </div>
    );
  }

  return (
    <FeedLayout>
      <div className="relative h-screen w-full flex flex-col lg:h-auto lg:min-h-screen">
        {/* Top Navigation Bar */}
        <div className="sticky top-0 z-50 bg-background border-b lg:border-none">
          {/* Moments Ring */}
          <MomentsRing />
          
          {/* Content Type Tabs */}
          <div className="flex items-center justify-center py-2 gap-8">
            <button
              onClick={() => setActiveTab('journeys')}
              className={`text-sm font-semibold pb-2 border-b-2 transition-colors ${
                activeTab === 'journeys'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground'
              }`}
            >
              Journeys
            </button>
            <button
              onClick={() => setActiveTab('saintes')}
              className={`text-sm font-semibold pb-2 border-b-2 transition-colors ${
                activeTab === 'saintes'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground'
              }`}
            >
              Sainte's
            </button>
          </div>
        </div>

        {/* Feed Content */}
        <div className="flex-1 overflow-hidden lg:overflow-visible">
          {activeTab === 'journeys' && <JourneysFeed />}
          {activeTab === 'saintes' && <SaintesFeed />}
        </div>

        {/* Bottom Navigation Bar - Mobile Only */}
        <div className="sticky bottom-0 z-50 bg-background border-t lg:hidden">
          <div className="flex items-center justify-around py-3 px-4 pb-safe">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/')}
            >
              <Home className="h-6 w-6" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/search')}
            >
              <Search className="h-6 w-6" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/create')}
            >
              <PlusSquare className="h-6 w-6" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/goldsainte-live')}
            >
              <Video className="h-6 w-6" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/messages')}
            >
              <MessageCircle className="h-6 w-6" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/shop')}
            >
              <ShoppingBag className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </div>
    </FeedLayout>
  );
};

export default StreamActivityFeed;
