import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function MarketplaceRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/marketplace', { replace: true });
  }, [navigate]);

  return null;
}
