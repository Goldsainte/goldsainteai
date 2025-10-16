import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function BookingPreferencesRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/dashboard?tab=preferences', { replace: true });
  }, [navigate]);

  return null;
}
