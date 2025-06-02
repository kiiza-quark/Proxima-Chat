import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaExclamationTriangle, FaEnvelope, FaLock, FaGoogle } from 'react-icons/fa';

const API_URL = 'http://localhost:5000/api';

export default function LoginPage() {
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('token');
    if (token) {
      navigate('/dashboard');
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // Store token and user data
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // Redirect to dashboard
      navigate('/dashboard');
    } catch (error) {
      setError(error.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    setError("Google login functionality not implemented yet");
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and App Name */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white flex items-center justify-center">
            <span className="bg-blue-600 p-2 rounded-lg mr-2">Proxima</span> 
            <span className="text-blue-600">Chat +</span>
          </h1>
        </div>
        
        {/* Login Card */}
        <div className="bg-slate-800 rounded-xl shadow-xl p-6 w-full">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-white">Login</h2>
            <p className="text-slate-400 text-sm">Access your AI chatbot dashboard</p>
          </div>
          
          {error && (
            <div className="bg-red-900/30 text-red-300 p-3 rounded-lg mb-6 flex items-center">
              <FaExclamationTriangle className="mr-2" /> {error}
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-1">Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaEnvelope className="text-slate-400" />
                </div>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  className="bg-slate-700 text-white w-full pl-10 pr-3 py-2 rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="you@example.com"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-1">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaLock className="text-slate-400" />
                </div>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="bg-slate-700 text-white w-full pl-10 pr-3 py-2 rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="••••••••"
                />
              </div>
            </div>
            
            <button 
              onClick={(e) => handleLogin(e)}
              className={`w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
              disabled={isLoading}
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </button>
          </div>
          
          <div className="my-6 flex items-center justify-center">
            <div className="border-t border-slate-600 flex-grow mr-3"></div>
            <span className="text-slate-400 text-sm">or continue with</span>
            <div className="border-t border-slate-600 flex-grow ml-3"></div>
          </div>
          
          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center bg-slate-700 hover:bg-slate-600 text-white font-medium py-2 px-4 rounded-lg transition"
          >
            <FaGoogle className="mr-2" /> Google
          </button>
          
          <div className="mt-6 text-center">
            <p className="text-slate-400">
              Don't have an account? <a href="/register" className="text-blue-400 hover:text-blue-300">Register here</a>
            </p>
          </div>
        </div>
        
        {/* Footer */}
        <div className="mt-8 text-center text-slate-500 text-xs">
          &copy; {new Date().getFullYear()} ProximaChat + | All rights reserved
        </div>
      </div>
    </div>
  );
}