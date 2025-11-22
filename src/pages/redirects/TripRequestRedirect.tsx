import { Navigate, useParams } from "react-router-dom";

export default function TripRequestRedirect() {
  const { id } = useParams<{ id: string }>();
  return <Navigate to={`/marketplace/request/${id}`} replace />;
}
