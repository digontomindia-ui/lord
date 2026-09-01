import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { ShieldCheck, Loader2 } from 'lucide-react';

const Login = () => {
  const [mobile, setMobile] = useState('9999999999'); // Default to Admin from seed script
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    const result = await login(mobile, password);
    
    if (result.success) {
      // Route based on role
      switch(result.role) {
        case 'SUPER_ADMIN': navigate('/admin'); break;
        case 'SHOP': navigate('/shop'); break;
        case 'MASTER': navigate('/master'); break;
        case 'TAILOR': navigate('/tailor'); break;
        case 'DELIVERY_BOY': navigate('/delivery'); break;
        default: navigate('/');
      }
    } else {
      setError(result.message);
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div className="card max-w-md w-full p-8 space-y-8">
        <div className="text-center">
          <ShieldCheck className="mx-auto h-12 w-12 text-primary-600 mb-4" />
          <h2 className="text-2xl font-bold text-slate-900">LORD'S BESPOKE</h2>
          <p className="text-sm text-slate-500 mt-2">Sign in to access your portal</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Mobile Number</label>
            <input 
              type="text" 
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              className="input-field" 
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field" 
              required
            />
          </div>

          <div className="bg-slate-50 p-4 rounded-md border border-slate-200 text-sm text-slate-600">
            <p className="font-semibold mb-2">Seed Accounts:</p>
            <ul className="space-y-1">
              <li>Admin: 9999999999</li>
              <li>Shop: 9000000001</li>
              <li>Master: 8000000001</li>
              <li>Tailor: 7000000001</li>
            </ul>
            <p className="mt-2 text-xs text-slate-400">Password for all is 'password123'</p>
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full btn-primary flex justify-center items-center h-10"
          >
            {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
