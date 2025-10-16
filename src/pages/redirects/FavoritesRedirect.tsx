import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function FavoritesRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/dashboard?tab=favorites', { replace: true });
  }, [navigate]);

  return null;
}
