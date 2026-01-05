import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Auth page has been consolidated into the Landing page.
 * Redirecting for backward compatibility.
 */
const Auth: React.FC = () => {
  const navigate = useNavigate();
  useEffect(() => {
    navigate('/', { replace: true });
  }, [navigate]);

  return null;
};

export default Auth;