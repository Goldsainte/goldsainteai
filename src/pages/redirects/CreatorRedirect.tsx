import { Navigate, useParams } from "react-router-dom";

export default function CreatorRedirect() {
  const { id } = useParams();
  return <Navigate to={`/creators/${id}`} replace />;
}
