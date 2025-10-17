import { supabase } from "@/integrations/supabase/client";

export interface AgentPackage {
  id: string;
  package_name: string;
  destination: string;
  cover_image_url?: string;
  images?: any;
  base_price_per_person?: number;
  retail_price: number;
  currency: string;
  duration_days: number;
  trip_type?: string;
  highlights?: any;
  agent_id: string;
  status: string;
  is_active: boolean;
  travel_agents?: {
    agency_name: string;
    rating?: number;
    total_reviews?: number;
  };
}

export interface TransformedAgentPackage {
  id: string;
  packageName: string;
  destination: string;
  coverImage: string;
  retailPrice: number;
  currency: string;
  durationDays: number;
  rating?: number;
  totalReviews?: number;
  agencyName: string;
  source: 'agent';
  highlights?: any[];
  maxParticipants?: number;
}

export const transformAgentPackageToDisplay = (pkg: AgentPackage): TransformedAgentPackage => {
  let firstImage = pkg.cover_image_url;
  
  if (!firstImage && pkg.images) {
    if (Array.isArray(pkg.images) && pkg.images.length > 0) {
      firstImage = pkg.images[0];
    }
  }
  
  if (!firstImage) {
    firstImage = `https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&q=80`;
  }

  const highlights = Array.isArray(pkg.highlights) ? pkg.highlights : [];

  return {
    id: pkg.id,
    packageName: pkg.package_name,
    destination: pkg.destination,
    coverImage: firstImage,
    retailPrice: pkg.retail_price,
    currency: pkg.currency,
    durationDays: pkg.duration_days,
    rating: pkg.travel_agents?.rating,
    totalReviews: pkg.travel_agents?.total_reviews,
    agencyName: pkg.travel_agents?.agency_name || 'Travel Agent',
    source: 'agent',
    highlights,
  };
};

export const fetchAgentPackages = async (): Promise<TransformedAgentPackage[]> => {
  const { data, error } = await supabase
    .from('agent_packages')
    .select(`
      *,
      travel_agents (
        agency_name,
        rating,
        total_reviews
      )
    `)
    .eq('is_active', true)
    .eq('status', 'published')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching agent packages:', error);
    return [];
  }

  return (data || []).map(transformAgentPackageToDisplay);
};

export const groupAgentPackagesByDestination = (packages: TransformedAgentPackage[]) => {
  const grouped = packages.reduce((acc, pkg) => {
    const dest = pkg.destination;
    if (!acc[dest]) {
      acc[dest] = {
        destination: dest,
        packageCount: 0,
        startingPrice: Infinity,
        imageUrl: pkg.coverImage,
      };
    }
    acc[dest].packageCount++;
    acc[dest].startingPrice = Math.min(acc[dest].startingPrice, pkg.retailPrice);
    return acc;
  }, {} as Record<string, any>);

  return Object.values(grouped);
};

export const groupAgentPackagesByType = (packages: TransformedAgentPackage[]) => {
  const grouped = packages.reduce((acc, pkg) => {
    const type = pkg.highlights?.[0] || 'Tour';
    if (!acc[type]) {
      acc[type] = {
        destination: type,
        packageCount: 0,
        imageUrl: pkg.coverImage,
      };
    }
    acc[type].packageCount++;
    return acc;
  }, {} as Record<string, any>);

  return Object.values(grouped);
};
