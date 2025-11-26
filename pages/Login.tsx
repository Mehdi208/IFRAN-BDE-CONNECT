import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User, ShieldCheck } from 'lucide-react';
import Navbar from '../components/Navbar';
import { auth } from '../firebaseConfig';
import { signInWithEmailAndPassword } from 'firebase/auth';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
        if (auth) {
            // Firebase Auth
            await signInWithEmailAndPassword(auth, email, password);
            navigate('/admin/dashboard');
        } else {
            // Fallback Mock Auth
            if (email === 'admin' && password === 'admin') {
                localStorage.setItem('isAuthenticated', 'true');
                navigate('/admin/dashboard');
                // Force reload to update context in mock mode
                window.location.reload(); 
            } else {
                throw new Error('Identifiants incorrects (Mode Mock: admin / admin)');
            }
        }
    } catch (err: any) {
        setError(err.message || 'Échec de la connexion');
        if (err.code === 'auth/invalid-credential') {
            setError('Email ou mot de passe incorrect.');
        }
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="mx-auto mb-6 flex justify-center items-center">
               <div className="bg-bde-navy p-5 rounded-full shadow-lg">
                 <ShieldCheck size={48} className="text-bde-rose" />
               </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Espace Administrateur</h2>
            <p className="text-gray-500 text-sm mt-2">Veuillez vous authentifier</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center border border-red-100">
                {error}
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email / Identifiant</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User size={18} className="text-gray-400" />
                </div>
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-bde-rose outline-none transition"
                  placeholder="admin@ifran.ci"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock size={18} className="text-gray-400" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-bde-rose outline-none transition"
                  placeholder="••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-bde-navy hover:bg-blue-900 text-white font-bold py-3 rounded-lg transition-colors shadow-lg shadow-blue-900/20 disabled:opacity-70"
            >
              {isLoading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>
          
          <div className="mt-6 text-center">
             <button onClick={() => navigate('/')} className="text-sm text-gray-500 hover:text-bde-rose">
               Retour au site public
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;