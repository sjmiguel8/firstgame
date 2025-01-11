import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './LoginSuccess.css';

const LoginSuccess = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/');
    }, 2000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="login-success">
      <div className="success-content">
        <h2>Login Successful!</h2>
        <p>Redirecting to homepage...</p>
        <div className="loading-spinner"></div>
      </div>
    </div>
  );
};

export default LoginSuccess; 