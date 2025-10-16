import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function MyBookingsRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/dashboard?tab=bookings', { replace: true });
  }, [navigate]);

  return null;
}
