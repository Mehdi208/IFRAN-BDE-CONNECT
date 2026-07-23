
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User, AlertCircle, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import Navbar from '../components/Navbar';
import { auth } from '../firebaseConfig';
import { signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword } from 'firebase/auth';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    // PRIORITÉ ABSOLUE : Contournement local pour le développement et la démo
    if (email === 'admin' && password === 'admin') {
        try {
          // On force la déconnexion de Firebase pour être sûr qu'aucune règle de sécurité 
          // cloud ne vienne bloquer les futures actions locales
          if (auth) {
              await signOut(auth);
          }
        } catch (e) {
            console.warn("Échec de la déconnexion Firebase silencieuse", e);
        }
        localStorage.setItem('isAuthenticated', 'true');
        navigate('/admin/dashboard');
        setLoading(false);
        return;
    }

    // Vérification si Firebase Auth est configuré pour les vrais comptes
    if (!auth) {
        setError("Firebase non configuré. Utilisez admin/admin pour la démo.");
        setLoading(false);
        return;
    }

    const emailToTry = email.includes('@') ? email : `${email}@ifran.ci`;

    if (isSignUp) {
      // Tentative d'inscription via Firebase
      try {
          await createUserWithEmailAndPassword(auth, emailToTry, password);
          localStorage.setItem('isAuthenticated', 'true');
          setSuccessMsg('Compte créé avec succès ! Redirection en cours...');
          setTimeout(() => {
              navigate('/admin/dashboard');
          }, 1500);
      } catch (err: any) {
          console.error("Erreur d'inscription:", err);
          if (err.code === 'auth/email-already-in-use') {
              setError("Cet e-mail est déjà associé à un compte. Veuillez vous connecter.");
          } else if (err.code === 'auth/weak-password') {
              setError("Le mot de passe doit contenir au moins 6 caractères.");
          } else if (err.code === 'auth/invalid-email') {
              setError("Format d'e-mail ou d'identifiant invalide.");
          } else {
              setError(err.message || "Impossible de créer le compte.");
          }
      } finally {
          setLoading(false);
      }
    } else {
      // Tentative de connexion via Firebase
      try {
          await signInWithEmailAndPassword(auth, emailToTry, password);
          
          localStorage.setItem('isAuthenticated', 'true');
          navigate('/admin/dashboard');
      } catch (err: any) {
          console.error("Erreur login:", err);
          if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
              setError('Identifiants incorrects ou compte inexistant. Si vous n\'avez pas encore créé de compte, cliquez sur "Créer un compte" ci-dessous.');
          } else {
              setError('Erreur système ou problème de connexion.');
          }
      } finally {
          setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="mx-auto mb-6 flex justify-center items-center">
               <div className="w-24 h-24 bg-white rounded-full shadow-lg flex items-center justify-center overflow-hidden border-4 border-bde-navy/10 p-1">
                 {!logoError ? (
                    <img 
                        src="/logo.png?v=4" 
                        alt="Logo BDE" 
                        className="w-full h-full object-cover rounded-full"
                        onError={() => setLogoError(true)}
                    />
                 ) : (
                    <div className="bg-bde-navy w-full h-full flex items-center justify-center">
                        <span className="text-white font-bold text-2xl">BDE</span>
                    </div>
                 )}
               </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-800">
              {isSignUp ? "Créer un Compte Admin" : "Espace Administrateur"}
            </h2>
            <p className="text-gray-500 text-sm mt-2">
              {isSignUp ? "Enregistrez vos identifiants d'accès" : "Accès restreint aux membres du bureau"}
            </p>
          </div>

          {/* Tab Selector */}
          <div className="flex border-b border-gray-100 mb-6">
            <button
              type="button"
              className={`flex-1 pb-3 text-sm font-semibold border-b-2 transition-colors ${
                !isSignUp
                  ? 'border-bde-rose text-bde-rose'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
              onClick={() => {
                setIsSignUp(false);
                setError('');
                setSuccessMsg('');
              }}
            >
              Connexion
            </button>
            <button
              type="button"
              className={`flex-1 pb-3 text-sm font-semibold border-b-2 transition-colors ${
                isSignUp
                  ? 'border-bde-rose text-bde-rose'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
              onClick={() => {
                setIsSignUp(true);
                setError('');
                setSuccessMsg('');
              }}
            >
              Créer un compte
            </button>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center border border-red-100 flex items-center justify-center gap-2">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            {successMsg && (
              <div className="bg-emerald-50 text-emerald-600 p-3 rounded-lg text-sm text-center border border-emerald-100 flex items-center justify-center gap-2">
                <CheckCircle2 size={16} />
                {successMsg}
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                E-mail ou Identifiant
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User size={18} className="text-gray-400" />
                </div>
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-bde-rose focus:border-transparent outline-none transition"
                  placeholder={isSignUp ? "votre.email@gmail.com" : "admin"}
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
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-bde-rose focus:border-transparent outline-none transition"
                  placeholder="••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-bde-navy hover:bg-blue-900 text-white font-bold py-3 rounded-lg transition-colors shadow-lg shadow-blue-900/20 disabled:opacity-70 disabled:cursor-not-allowed flex justify-center text-sm"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                isSignUp ? 'Créer le compte et accéder' : 'Se connecter'
              )}
            </button>
          </form>

          <div className="mt-4 text-center">
             <button 
               type="button" 
               onClick={() => {
                 setIsSignUp(!isSignUp);
                 setError('');
                 setSuccessMsg('');
               }} 
               className="text-xs font-semibold text-bde-rose hover:underline"
             >
               {isSignUp ? "Déjà un compte ? Connectez-vous" : "Pas encore de compte ? Enregistrez cet e-mail"}
             </button>
          </div>
          
          <div className="mt-6 text-center border-t border-gray-100 pt-4">
             <button onClick={() => navigate('/')} className="text-sm text-gray-500 hover:text-bde-rose transition-colors">
               Retour au site public
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
