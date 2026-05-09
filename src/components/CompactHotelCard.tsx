import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Star, Heart, ChevronDown, ChevronUp, Image as ImageIcon, Video, Phone, Mail, Globe, Loader2, RefreshCw, AlertCircle } from "lucide-react";
import { DateSelectionModal } from "./DateSelectionModal";
import { HotelImageGallery } from "./HotelImageGallery";
import { VirtualTour360 } from "./VirtualTour360";
import { useFavorites } from "@/hooks/useFavorites";
import { getHotelImage } from "@/lib/imageHelpers";
import { format, addDays } from "date-fns";
import { supabase } from "@/integrations/supabase/client";

interface CompactHotelCardProps {
  property: any;
  searchDates?: { checkIn: string; checkOut: string };
}

export const CompactHotelCard = ({ property, searchDates }: CompactHotelCardProps) => {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(true); // Always expanded by default
  const [showDateModal, setShowDateModal] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [showVirtualTour, setShowVirtualTour] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [hotelDetails, setHotelDetails] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const { addFavorite, removeFavorite, isFavorite } = useFavorites();
  
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Auto-fetch hotel details on mount
  useEffect(() => {
    fetchHotelDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  const title = property.property?.name || property.name || property.title || "Hotel";
  
  // Image handling - prioritize available image sources, NO FALLBACKS
  // Filter out empty strings and invalid values from images array
  const rawImages = property.images || property.photos || property.property?.photoUrls || (property.image ? [property.image] : []);
  const allImages = rawImages.filter((img: any) => img && typeof img === 'string' && img.trim().length > 0);
  const imageUrl = property.image_url || allImages[0];
  const image = getHotelImage(imageUrl, property.hotel_id || property.hotelId || title);
  
  // No fallback - if no image, show placeholder indicator
  const hasValidImage = image && image.trim().length > 0;
  const hasMultipleImages = allImages && allImages.length > 1;
  
  // Check for 360 virtual tour images
  const images360 = property.images360 || property.virtualTour || [];
  const hasVirtualTour = images360.length > 0;
  
  const getCityCode = () => {
    return property.cityCode || "PAR";
  };
  
  const getCleanLocation = () => {
    if (property.location) {
      // HotelBeds location format
      if (typeof property.location === 'object') {
        const { city, country, address } = property.location;
        return [city, country].filter(Boolean).join(', ') || address || "Location";
      }
      return property.location;
    }
    if (property.address) return property.address;
    if (property.city || property.country) {
      return [property.city, property.country].filter(Boolean).join(', ');
    }
    return property.region || "Location";
  };
  
  const location = getCleanLocation();
  // Prioritize Google Places rating (scale 1-5, display as-is)
  const hasGoogleData = property.__hasGoogleData || property.hasGoogleData;
  const googleRating = property.__googleRating || property.googleRating;
  const googleReviews = property.__googleReviews || property.googleReviews || [];
  const googleReviewCount = property.__googleRatingCount || property.googleRatingCount || 0;
  
  // Use Google rating if available, otherwise fall back to other sources
  const rating = googleRating 
    ? googleRating 
    : (property.property?.reviewScore ?? 
      (property.reviewScore ? Number(property.reviewScore) : 
      (property.rating ? Number(property.rating) * 2 : 0)));
  const reviews = googleRating ? googleReviewCount : Number(property.property?.reviewCount ?? property.num_reviews ?? 0);
  
  const getCleanPrice = () => {
    // Priority to priceBreakdown (most reliable from tool results)
    if (property.priceBreakdown?.grossPrice?.value) {
      return property.priceBreakdown.grossPrice.value;
    }
    // HotelBeds format
    if (property.price) return property.price;
    if (property.estimated_price) return property.estimated_price;
    const label = property.accessibilityLabel || "";
    const priceMatch = label.match(/(\d+) USD/);
    return priceMatch ? parseInt(priceMatch[1]) : 0;
  };
  
  const displayPrice = getCleanPrice();
  const currency = property.currency || "USD";

  const getRatingText = (score: number, isGoogle: boolean = false) => {
    // Google ratings are on 1-5 scale
    if (isGoogle) {
      if (score >= 4.5) return "Exceptional";
      if (score >= 4.0) return "Excellent";
      if (score >= 3.5) return "Very Good";
      if (score >= 3.0) return "Good";
      return "Pleasant";
    }
    // Other ratings on 1-10 scale
    if (score >= 9) return "Superb";
    if (score >= 8.5) return "Excellent";
    if (score >= 8) return "Very Good";
    if (score >= 7) return "Good";
    return "Pleasant";
  };

  const getCurrencySymbol = (curr: string) => {
    const symbols: { [key: string]: string } = {
      'USD': '$', 'EUR': '€', 'GBP': '£', 'JPY': '¥',
    };
    return symbols[curr] || curr + ' ';
  };

  const handleAvailabilityConfirmed = ({ checkIn, checkOut, adults }: { checkIn: string; checkOut: string; adults: number }) => {
    // Navigate to the new hotel details page with search params
    const finalCheckIn = checkIn || searchDates?.checkIn || format(addDays(new Date(), 1), 'yyyy-MM-dd');
    const finalCheckOut = checkOut || searchDates?.checkOut || format(addDays(new Date(), 3), 'yyyy-MM-dd');
    
    const hotelId = property.hotel_id || property.hotelId || property.property?.id || property.id;
    navigate(`/hotel/${hotelId}?checkIn=${finalCheckIn}&checkOut=${finalCheckOut}&guests=${adults}&currency=${currency}`);
  };

  const favoriteId = isFavorite('hotel', property);
  
  const handleToggleFavorite = async () => {
    if (favoriteId) {
      await removeFavorite(favoriteId);
    } else {
      await addFavorite('hotel', property);
    }
  };

  const fetchHotelDetails = async () => {
    console.log('🔍 [FETCH] Starting fetchHotelDetails');
    console.log('📋 [FETCH] Current state:', { 
      hasDetails: !!hotelDetails, 
      isLoading: loadingDetails,
      propertyKeys: Object.keys(property)
    });
    
    if (hotelDetails) {
      console.log('⏭️ [FETCH] Already have details, skipping');
      return;
    }
    
    if (loadingDetails) {
      console.log('⏭️ [FETCH] Already loading, skipping');
      return;
    }
    
    // Try ALL possible ID fields
    const possibleIds = [
      property.hotel_id,
      property.hotelId,
      property.id,
      property.property?.hotelId,
      property.property?.id,
      property.hotel?.hotelId,
      property.hotel?.id
    ];
    
    const hotelId = possibleIds.find(id => id);
    
    console.log('🏨 [FETCH] Hotel ID candidates:', possibleIds);
    console.log('🎯 [FETCH] Selected hotel ID:', hotelId);
    
    if (!hotelId) {
      console.error('❌ [FETCH] NO HOTEL ID FOUND IN ANY FIELD');
      console.log('📦 [FETCH] Full property object:', property);
      setDetailsError('Cannot load details: Hotel ID missing');
      return;
    }
    
    setLoadingDetails(true);
    setDetailsError(null);
    
    try {
      console.log('📡 [FETCH] Calling edge function with:', {
        hotelId,
        arrival_date: searchDates?.checkIn,
        departure_date: searchDates?.checkOut,
        currency
      });
      
      const { data, error } = await supabase.functions.invoke('get-hotel-details', {
        body: {
          hotelId: hotelId,
          arrival_date: searchDates?.checkIn,
          departure_date: searchDates?.checkOut,
          currency: currency || 'USD'
        }
      });
      
      console.log('📥 [FETCH] Edge function response:', { hasData: !!data, hasError: !!error });
      
      if (error) {
        console.error('❌ [FETCH] Edge function error:', error);
        throw error;
      }
      
      console.log('✅ [FETCH] Raw data received:', data);
      console.log('🔍 [FETCH] Data structure:', {
        keys: Object.keys(data || {}),
        hasDataField: !!data?.data,
        dataKeys: data?.data ? Object.keys(data.data) : []
      });
      
      const detailsData = data?.data || data;
      console.log('💾 [FETCH] Saving to state:', {
        hasData: !!detailsData,
        keys: Object.keys(detailsData || {})
      });
      
      setHotelDetails(detailsData);
      console.log('🏁 [FETCH] fetchHotelDetails complete');
    } catch (error) {
      console.error('❌ [FETCH] Exception:', error);
      setDetailsError(`Failed to load details: ${error.message || 'Unknown error'}`);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleExpand = () => {
    const newExpanded = !expanded;
    setExpanded(newExpanded);
  };
  
  // Generate Booking.com affiliate link
  const getBookingLink = () => {
    const hotelId = property.hotel_id || property.hotelId || property.property?.id || property.id;
    const checkIn = searchDates?.checkIn || format(addDays(new Date(), 1), 'yyyy-MM-dd');
    const checkOut = searchDates?.checkOut || format(addDays(new Date(), 3), 'yyyy-MM-dd');
    
    // Booking.com affiliate link structure
    const affiliateId = 'goldsainte001'; // Your Booking.com affiliate ID
    
    if (!hotelId) {
      // Fallback to search by destination if no hotel ID
      return `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(location)}&checkin=${checkIn}&checkout=${checkOut}&group_adults=2&aid=${affiliateId}`;
    }
    
    // Direct hotel link with affiliate tracking
    return `https://www.booking.com/hotel/xx/xx-${hotelId}.html?checkin=${checkIn}&checkout=${checkOut}&group_adults=2&aid=${affiliateId}`;
  };

  // Build detail page URL with search params
  const hotelId = property.hotel_id || property.hotelId || property.property?.id || property.id;
  const detailsUrl = `/hotel/${hotelId}?checkIn=${searchDates?.checkIn || ''}&checkOut=${searchDates?.checkOut || ''}&guests=2&currency=${currency}`;

  return (
    <>
      <Card className="group hover:shadow-md transition-all overflow-hidden max-w-full">
        <div className="flex gap-2 sm:gap-3 p-2 sm:p-3 max-w-full">
          {/* Image with locked 4:3 aspect ratio - Link to details */}
          <Link 
            to={detailsUrl}
            className="relative w-20 sm:w-28 md:w-32 aspect-[4/3] flex-shrink-0 rounded-md overflow-hidden bg-gradient-to-br from-muted/80 to-muted/50 group/img"
          >
            {hasValidImage ? (
              <img
                src={image}
                alt={title}
                loading="lazy"
                className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-300"
                onError={(e) => {
                  console.error('Hotel image failed to load:', image);
                  const target = e.currentTarget as HTMLImageElement;
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent) {
                    const placeholder = parent.querySelector('.image-placeholder');
                    if (placeholder) {
                      placeholder.classList.remove('hidden');
                    }
                  }
                }}
              />
            ) : null}
            <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/10 transition-colors" />
            <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded opacity-0 group-hover/img:opacity-100 transition-opacity">
              View Details
            </div>
            <div className={`image-placeholder w-full h-full flex items-center justify-center bg-gradient-to-br from-muted/80 to-muted/50 ${hasValidImage ? 'hidden' : ''}`}>
              <ImageIcon className="h-12 w-12 text-muted-foreground/70" />
            </div>
            {hasMultipleImages && (
              <div className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1 backdrop-blur-sm">
                <ImageIcon className="h-3 w-3" />
                {allImages.length}
              </div>
            )}
            {hasVirtualTour && (
              <div className="absolute top-1 left-1 bg-primary/90 text-primary-foreground text-xs px-2 py-0.5 rounded-full flex items-center gap-1 backdrop-blur-sm">
                <Video className="h-3 w-3" />
                360°
              </div>
            )}
          </Link>

          {/* Content */}
          <div className="flex-1 min-w-0 flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between gap-2 mb-1">
                <Link to={detailsUrl} className="flex-1 min-w-0">
                  <h3 className="font-secondary font-semibold text-sm leading-tight whitespace-normal break-words line-clamp-4 sm:line-clamp-3 md:line-clamp-2 lg:line-clamp-1 group-hover:text-primary transition-colors">
                    {title}
                  </h3>
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 flex-shrink-0 hidden sm:inline-flex"
                  onClick={handleToggleFavorite}
                >
                  <Heart className={`h-4 w-4 ${favoriteId ? 'fill-primary text-primary' : 'text-muted-foreground'}`} />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mb-2">
                <MapPin className="h-3 w-3" />
                <span className="line-clamp-1">{location}</span>
              </p>
              
              {rating > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  {hasGoogleData && (
                    <Badge variant="default" className="text-xs px-2 py-0.5 font-semibold bg-primary/90">
                      <Star className="h-3 w-3 mr-1 fill-current" />
                      Google Places
                    </Badge>
                  )}
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs px-2 py-0.5 font-bold">
                      {rating.toFixed(1)}{hasGoogleData ? '/5' : '/10'}
                    </Badge>
                    <span className="text-xs font-medium">{getRatingText(rating, hasGoogleData)}</span>
                    {reviews > 0 && (
                      <span className="text-xs text-muted-foreground">({reviews.toLocaleString()})</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Price & Actions */}
          <div className="flex flex-col items-end justify-between w-[100px] sm:w-[120px] md:w-[140px] flex-shrink-0">
            {displayPrice > 0 && (
              <div className="text-right w-full">
                <div className="text-base sm:text-lg md:text-xl font-bold truncate">
                  {getCurrencySymbol(currency)}{Math.round(displayPrice)}
                </div>
                <div className="text-[10px] sm:text-xs text-muted-foreground">per night</div>
                <div className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block">+taxes & fees</div>
              </div>
            )}
            <div className="flex flex-col gap-1 justify-end w-full">
              <div className="flex flex-wrap gap-1 justify-end">
                {hasVirtualTour && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-6 sm:h-7 px-1.5 sm:px-2 text-[10px] sm:text-xs gap-0.5 sm:gap-1"
                    onClick={() => setShowVirtualTour(true)}
                  >
                    <Video className="h-2.5 sm:h-3 w-2.5 sm:w-3" />
                    <span className="hidden sm:inline">360°</span>
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  className="hidden md:flex h-7 px-2 text-xs"
                  onClick={handleExpand}
                >
                  {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  {expanded ? 'Less' : 'More'}
                </Button>
              </div>
              <div className="flex flex-col gap-1 w-full">
                <Button
                  size="sm"
                  className="h-7 px-2 sm:px-3 text-[10px] sm:text-xs whitespace-nowrap w-full"
                  onClick={() => window.open(getBookingLink(), '_blank')}
                >
                  Book Now
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-6 sm:h-7 px-2 sm:px-3 text-[10px] sm:text-xs whitespace-nowrap w-full"
                  onClick={() => setShowDateModal(true)}
                >
                  Check Dates
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Expanded Details - Always show on mobile, conditional on desktop */}
        {(isMobile || expanded) && (
          <div className="border-t border-border bg-muted/30 animate-accordion-down">
            {loadingDetails && (
              <div className="p-6 text-center">
                <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
                <p className="text-sm text-muted-foreground">Loading complete hotel details...</p>
              </div>
            )}
            
            {detailsError && (
              <div className="p-4 space-y-3 bg-destructive/10 border-l-4 border-destructive">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-destructive">Could not load full details</p>
                    <p className="text-xs text-destructive/80 mt-1">{detailsError}</p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full sm:w-auto"
                  onClick={() => {
                    console.log('🔄 [RETRY] User clicked retry');
                    setDetailsError(null);
                    fetchHotelDetails();
                  }}
                >
                  <RefreshCw className="h-3 w-3 mr-2" />
                  Try Again
                </Button>
              </div>
            )}
            
            {hotelDetails && (
              <div className="p-4 space-y-6 max-h-[600px] overflow-y-auto">
                {/* SECTION 1: Full Description */}
                {hotelDetails.description && (
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm flex items-center gap-2 text-foreground">
                      📖 About This Property
                    </h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {hotelDetails.description}
                    </p>
                  </div>
                )}
                
                {/* SECTION 2: Full Address & Location */}
                {(hotelDetails.address || hotelDetails.distance_from_center) && (
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm flex items-center gap-2 text-foreground">
                      <MapPin className="h-4 w-4" />
                      Location & Address
                    </h4>
                    {hotelDetails.address && (
                      <div className="text-xs text-muted-foreground space-y-1">
                        {hotelDetails.address.street && <p>{hotelDetails.address.street}</p>}
                        {(hotelDetails.address.city || hotelDetails.address.postal_code) && (
                          <p>{hotelDetails.address.city}{hotelDetails.address.postal_code ? `, ${hotelDetails.address.postal_code}` : ''}</p>
                        )}
                        {hotelDetails.address.country && <p>{hotelDetails.address.country}</p>}
                      </div>
                    )}
                    {hotelDetails.distance_from_center && (
                      <p className="text-xs text-muted-foreground">
                        📍 {hotelDetails.distance_from_center} from city center
                      </p>
                    )}
                  </div>
                )}
                
                {/* SECTION 3: ALL Amenities */}
                {((hotelDetails?.amenities?.length > 0) || (hotelDetails?.facilities?.length > 0) || (property.amenities?.length > 0)) && (
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm text-foreground">✨ All Amenities & Facilities</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        ...(hotelDetails?.amenities || []),
                        ...(hotelDetails?.facilities || []),
                        ...(property.amenities || [])
                      ].map((amenity: any, idx: number) => (
                        <div key={idx} className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="text-primary">✓</span>
                          <span>{typeof amenity === 'string' ? amenity : amenity.name || amenity.facility_name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* SECTION 4: Room Types */}
                {(hotelDetails?.room_types?.length > 0 || hotelDetails?.rooms?.length > 0) && (
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm text-foreground">🛏️ Available Room Types</h4>
                    <div className="space-y-2">
                      {(hotelDetails.room_types || hotelDetails.rooms || []).map((room: any, idx: number) => (
                        <div key={idx} className="bg-background rounded-md p-3 border border-border">
                          <p className="font-medium text-xs text-foreground">{room.name || room.room_name}</p>
                          {(room.bed_type || room.bed_configuration) && (
                            <p className="text-xs text-muted-foreground">{room.bed_type || room.bed_configuration}</p>
                          )}
                          {(room.max_occupancy || room.max_persons) && (
                            <p className="text-xs text-muted-foreground">
                              Max: {room.max_occupancy || room.max_persons} guests
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* SECTION 5: Facilities */}
                {hotelDetails.facilities?.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm text-foreground">🏢 Facilities & Services</h4>
                    <div className="flex flex-wrap gap-2">
                      {hotelDetails.facilities.map((facility: any, idx: number) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {typeof facility === 'string' ? facility : facility.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* SECTION 6: Policies */}
                {(hotelDetails.check_in_time || hotelDetails.check_out_time || hotelDetails.cancellation_policy || 
                  hotelDetails.pet_policy || hotelDetails.parking_info) && (
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm text-foreground">📋 Hotel Policies</h4>
                    <div className="space-y-1.5 text-xs text-muted-foreground">
                      {hotelDetails.check_in_time && <p>🕐 Check-in: {hotelDetails.check_in_time}</p>}
                      {hotelDetails.check_out_time && <p>🕐 Check-out: {hotelDetails.check_out_time}</p>}
                      {hotelDetails.cancellation_policy && <p>📋 Cancellation: {hotelDetails.cancellation_policy}</p>}
                      {hotelDetails.pet_policy && <p>🐕 Pets: {hotelDetails.pet_policy}</p>}
                      {hotelDetails.parking_info && <p>🚗 Parking: {hotelDetails.parking_info}</p>}
                    </div>
                  </div>
                )}
                
                {/* SECTION 7: ALL Guest Reviews - Check multiple field names */}
                {(() => {
                  const allReviews = [
                    ...(hotelDetails?.reviews || []),
                    ...(hotelDetails?.guest_reviews || []),
                    ...(hotelDetails?.property?.reviews || []),
                    ...(hotelDetails?.user_reviews || []),
                    ...(googleReviews || [])
                  ].filter(Boolean);
                  
                  console.log('📊 [REVIEWS] Found reviews:', {
                    total: allReviews.length,
                    sources: {
                      reviews: hotelDetails?.reviews?.length || 0,
                      guest_reviews: hotelDetails?.guest_reviews?.length || 0,
                      property_reviews: hotelDetails?.property?.reviews?.length || 0,
                      user_reviews: hotelDetails?.user_reviews?.length || 0,
                      google: googleReviews?.length || 0
                    }
                  });
                  
                  return allReviews.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm text-foreground">
                        ⭐ Guest Reviews ({allReviews.length})
                      </h4>
                      <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                        {allReviews.map((review: any, idx: number) => (
                        <div key={idx} className="bg-background rounded-md p-3 border border-border space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="flex">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`h-3 w-3 ${
                                      i < (review.rating || 0)
                                        ? 'fill-primary text-primary'
                                        : 'fill-muted text-muted'
                                    }`}
                                  />
                                ))}
                              </div>
                              <span className="font-medium text-xs">{review.author || review.author_name || 'Guest'}</span>
                            </div>
                            {(review.date || review.time) && (
                              <span className="text-xs text-muted-foreground">{review.date || review.time}</span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {review.text || review.review_text}
                          </p>
                          {review.pros && (
                            <p className="text-xs text-green-600">👍 {review.pros}</p>
                          )}
                          {review.cons && (
                            <p className="text-xs text-red-600">👎 {review.cons}</p>
                          )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
                
                {/* SECTION 8: Property Highlights */}
                {hotelDetails.highlights?.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm text-foreground">💡 Property Highlights</h4>
                    <ul className="space-y-1">
                      {hotelDetails.highlights.map((highlight: string, idx: number) => (
                        <li key={idx} className="text-xs text-muted-foreground flex items-start gap-2">
                          <span className="text-primary mt-0.5">•</span>
                          <span>{highlight}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {/* SECTION 9: Spoken Languages */}
                {hotelDetails.spoken_languages?.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm text-foreground">🗣️ Languages Spoken</h4>
                    <div className="flex flex-wrap gap-2">
                      {hotelDetails.spoken_languages.map((lang: string, idx: number) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {lang}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* SECTION 10: Contact Information */}
                {(hotelDetails.phone || hotelDetails.email || hotelDetails.website) && (
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm text-foreground">📞 Contact Information</h4>
                    <div className="space-y-1.5 text-xs">
                      {hotelDetails.phone && (
                        <p className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="h-3 w-3" /> {hotelDetails.phone}
                        </p>
                      )}
                      {hotelDetails.email && (
                        <p className="flex items-center gap-2 text-muted-foreground">
                          <Mail className="h-3 w-3" /> {hotelDetails.email}
                        </p>
                      )}
                      {hotelDetails.website && (
                        <p className="flex items-center gap-2">
                          <Globe className="h-3 w-3 text-muted-foreground" />
                          <a 
                            href={hotelDetails.website} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-primary hover:underline"
                          >
                            Visit Website
                          </a>
                        </p>
                      )}
                    </div>
                  </div>
                )}
                
                {/* SECTION 11: ALL Photos - Check multiple field names */}
                {(() => {
                  const detailsPhotos = hotelDetails?.photos || hotelDetails?.images || hotelDetails?.property?.photoUrls || hotelDetails?.photo_urls || [];
                  const allPhotosForGallery = [...allImages, ...detailsPhotos].filter(Boolean);
                  
                  console.log('📸 [PHOTOS] Found photos:', {
                    fromProperty: allImages.length,
                    fromDetails: detailsPhotos.length,
                    total: allPhotosForGallery.length,
                    sources: {
                      photos: !!hotelDetails?.photos,
                      images: !!hotelDetails?.images,
                      property_photoUrls: !!hotelDetails?.property?.photoUrls,
                      photo_urls: !!hotelDetails?.photo_urls
                    }
                  });
                  
                  return allPhotosForGallery.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-semibold text-sm text-foreground">
                        📸 All Photos ({allPhotosForGallery.length})
                      </h4>
                      <div className="grid grid-cols-3 gap-2">
                        {allPhotosForGallery.slice(0, 6).map((photo, idx) => (
                          <img 
                            key={idx} 
                            src={typeof photo === 'string' ? photo : photo.url_max300 || photo.url || photo} 
                            alt={`Hotel photo ${idx + 1}`}
                            className="aspect-[4/3] object-cover rounded-md cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => setShowGallery(true)}
                          />
                        ))}
                      </div>
                      {allPhotosForGallery.length > 6 && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => setShowGallery(true)}
                        >
                          <ImageIcon className="h-4 w-4 mr-2" />
                          View All {allPhotosForGallery.length} Photos
                        </Button>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}
            
            {/* Fallback: Show basic info if details haven't loaded yet */}
            {!hotelDetails && !loadingDetails && (
              <div className="p-4 space-y-3">
                <div className="text-xs space-y-2">
                  {property.isCurated && (
                    <Badge variant="default" className="mb-2 bg-accent text-accent-foreground">
                      ⭐ Curated Recommendation
                    </Badge>
                  )}
                  <p className="text-muted-foreground line-clamp-3">
                    {property.description || "Enjoy a comfortable stay with modern amenities."}
                  </p>
                  {property.amenities?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {property.amenities.slice(0, 6).map((amenity: string, index: number) => (
                        <Badge key={index} variant="outline" className="text-xs px-2 py-0.5">
                          {amenity}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <Button
                    variant="link"
                    size="sm"
                    className="text-xs p-0 h-auto text-primary hover:text-primary/80"
                    onClick={fetchHotelDetails}
                  >
                    Load Full Details →
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      <DateSelectionModal
        open={showDateModal}
        onClose={() => setShowDateModal(false)}
        onAvailabilityConfirmed={handleAvailabilityConfirmed}
        cityCode={getCityCode()}
        hotelName={title}
        currency={currency}
        initialCheckIn={searchDates?.checkIn}
        initialCheckOut={searchDates?.checkOut}
      />

      <HotelImageGallery
        images={allImages}
        hotelName={title}
        open={showGallery}
        onOpenChange={setShowGallery}
      />

      {hasVirtualTour && (
        <VirtualTour360
          images360={images360}
          hotelName={title}
          open={showVirtualTour}
          onOpenChange={setShowVirtualTour}
        />
      )}
    </>
  );
};
