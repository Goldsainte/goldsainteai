import { Navigate, useParams, useLocation } from "react-router-dom";

/**
 * Legacy path: /itinerary-guides/:id (plural) → /itinerary-guide/:id.
 * The marketplace guide card and affiliate link generator briefly used the
 * plural form, so plural links may live in shared/affiliate URLs forever.
 * Query params (e.g. ?ref= affiliate codes) are preserved.
 */
export default function ItineraryGuideRedirect() {
  const { id } = useParams();
  const { search } = useLocation();
  return <Navigate to={`/itinerary-guide/${id}${search}`} replace />;
}
