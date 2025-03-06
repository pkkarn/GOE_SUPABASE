import { useState, useEffect } from 'react';
import { Plus, LogOut, Sparkles, Rocket, ChevronRight, User, Mail, Lock, ArrowLeft } from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';
import YugaCard from './components/YugaCard';
import StatsCard from './components/StatsCard';
import CreateYugaModal from './components/CreateYugaModal';
import GameOfEvolutionLanding from './components/LandingPage';
import TopicSection from './components/TopicSection';
import { supabase } from './lib/supabase';

function App() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [yugas, setYugas] = useState([]);
  const [stats, setStats] = useState({
    totalPoints: 0,
    totalYugas: 0,
    completedBonusTasks: 0,
    consistencyStreak: 0,
    pointsHistory: []
  });
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showLanding, setShowLanding] = useState(true);
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [showSignupForm, setShowSignupForm] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '', confirmPassword: '', fullName: '' });
  const [loginError, setLoginError] = useState('');
  const [signupError, setSignupError] = useState('');

  useEffect(() => {
    // Check current auth session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      fetchYugas();
      calculateStats();
    }
  }, [user]);

  const fetchYugas = async () => {
    try {
      const { data: yugasData, error: yugasError } = await supabase
        .from('yugas')
        .select(`
          *,
          bonus_tasks (*),
          daily_entries (*)
        `)
        .order('created_at', { ascending: false });

      if (yugasError) throw yugasError;
      setYugas(yugasData);
    } catch (error) {
      toast.error('Failed to fetch yugas');
      console.error('Error:', error);
    }
  };

  const calculateStats = async () => {
    try {
      // Fetch all points history for the last 5 days
      const fiveDaysAgo = new Date();
      fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

      const { data: pointsData, error: pointsError } = await supabase
        .from('points_history')
        .select('points, created_at, description, source_type')
        .gte('created_at', fiveDaysAgo.toISOString())
        .order('created_at', { ascending: false });

      if (pointsError) throw pointsError;

      // Group points by date and sum points
      const pointsByDate = pointsData.reduce((acc, entry) => {
        const date = new Date(entry.created_at).toISOString().split('T')[0];
        if (!acc[date]) {
          acc[date] = {
            points: 0,
            descriptions: []
          };
        }
        acc[date].points += entry.points;
        acc[date].descriptions.push(entry.description);
        return acc;
      }, {});

      // Convert to array format
      const pointsHistory = Object.entries(pointsByDate)
        .map(([date, data]) => ({
          date,
          points: data.points,
          descriptions: data.descriptions
        }))
        .slice(0, 5);

      // Calculate total points from all sources
      const totalPoints = pointsData.reduce((sum, entry) => sum + entry.points, 0);

      // Count completed bonus tasks
      const { data: bonusTasks, error: bonusError } = await supabase
        .from('bonus_tasks')
        .select('completed')
        .eq('completed', true);

      if (bonusError) throw bonusError;

      setStats({
        totalPoints,
        totalYugas: yugas.length,
        completedBonusTasks: bonusTasks.length,
        consistencyStreak: calculateStreak(pointsHistory),
        pointsHistory
      });
    } catch (error) {
      toast.error('Failed to calculate stats');
      console.error('Error:', error);
    }
  };

  const calculateStreak = (history) => {
    let streak = 0;
    for (const entry of history) {
      if (entry.points > 0) streak++;
      else break;
    }
    return streak;
  };

  const calculatePoints = (hours) => {
    if (hours < 1) return -1;
    if (hours <= 2.5) return 0;
    return hours * 0.2;
  };

  const handleAddEntry = async (yugaId, entry) => {
    try {
      const points = calculatePoints(parseFloat(entry.hours));
      
      // Get current points first
      const { data: currentYuga, error: fetchError } = await supabase
        .from('yugas')
        .select('current_points')
        .eq('id', yugaId)
        .single();

      if (fetchError) throw fetchError;

      // Insert new entry
      const { data: newEntry, error: entryError } = await supabase
        .from('daily_entries')
        .insert({
          yuga_id: yugaId,
          title: entry.title,
          description: entry.description,
          hours: parseFloat(entry.hours),
          points
        })
        .select()
        .single();

      if (entryError) throw entryError;

      // Update yuga points by adding new points to current points
      const { error: yugaError } = await supabase
        .from('yugas')
        .update({ current_points: (currentYuga.current_points || 0) + points })
        .eq('id', yugaId);

      if (yugaError) throw yugaError;

      // Refresh data
      await Promise.all([fetchYugas(), calculateStats()]);
      toast.success('Entry added successfully');
    } catch (error) {
      toast.error('Failed to add entry');
      console.error('Error:', error);
    }
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    try {
      setLoginError('');
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      });

      if (error) throw error;
      // On successful sign in, show the main app
      setShowLanding(false);
    } catch (error) {
      setLoginError(error.message || 'Failed to sign in');
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    try {
      setSignupError('');
      // Validate passwords match
      if (formData.password !== formData.confirmPassword) {
        setSignupError('Passwords do not match');
        return;
      }

      // Validate password length
      if (formData.password.length < 6) {
        setSignupError('Password must be at least 6 characters');
        return;
      }

      // Register with Supabase
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName || '',
          },
        },
      });

      if (error) throw error;

      toast.success('Sign up successful! Please check your email to confirm your account.');
      // Return to sign in form after successful signup
      setShowSignupForm(false);
      setShowLoginForm(true);
      
      // Clear form
      setFormData({ email: '', password: '', confirmPassword: '', fullName: '' });
    } catch (error) {
      setSignupError(error.message || 'Failed to sign up');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleCreateYugaClick = () => {
    // If user is already logged in, show the create modal
    if (user) {
      setShowLanding(false); // Hide landing page
      setIsCreateModalOpen(true); // Open create modal
    } else {
      // If not logged in, show the login form
      setShowLanding(false); // Hide landing page
      setShowLoginForm(true); // Show login form
    }
  };

  const goToSignUp = () => {
    setShowLoginForm(false);
    setShowSignupForm(true);
    setLoginError('');
    setSignupError('');
  };

  const goToSignIn = () => {
    setShowSignupForm(false);
    setShowLoginForm(true);
    setLoginError('');
    setSignupError('');
  };

  // Show Landing Page
  if (showLanding) {
    return (
      <>
        <GameOfEvolutionLanding />
        <div className="fixed bottom-6 right-6 z-50 flex space-x-4">
          {user && (
            <button 
              onClick={() => setShowLanding(false)}
              className="bg-white/80 backdrop-blur-md text-purple-900 px-4 py-2 rounded-full font-medium hover:bg-white transition-all shadow-lg flex items-center"
            >
              <Rocket className="w-4 h-4 mr-2" />
              Go to Dashboard
            </button>
          )}
          <button 
            onClick={handleCreateYugaClick}
            className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-4 py-2 rounded-full font-medium hover:shadow-lg hover:shadow-purple-500/30 transition-all flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Yuga
          </button>
        </div>
      </>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-white animate-spin" />
          </div>
          <p className="mt-4 text-indigo-700 font-medium">Loading your journey...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-900 via-indigo-900 to-black text-white flex items-center justify-center p-4">
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: 30 }).map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white opacity-70"
              style={{
                width: Math.random() * 3 + 'px',
                height: Math.random() * 3 + 'px',
                top: Math.random() * 100 + '%',
                left: Math.random() * 100 + '%',
                animation: `twinkle ${Math.random() * 5 + 5}s linear infinite`,
              }}
            />
          ))}
        </div>
        
        <div className="bg-gradient-to-br from-purple-800/90 to-indigo-900/90 backdrop-blur-xl rounded-2xl p-8 max-w-md w-full border border-white/10 shadow-2xl">
          <div className="flex items-center justify-center mb-6">
            <div className="relative h-10 w-10 mr-2">
              <div className="absolute inset-0 bg-purple-500 rounded-md rotate-45" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-300 bg-clip-text text-transparent">
              Game of Evolution
            </h1>
          </div>
          
          {showSignupForm ? (
            <>
              <div className="flex items-center mb-6">
                <button
                  onClick={goToSignIn}
                  className="text-purple-300 hover:text-purple-200 p-1 -ml-1 rounded-full transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <h2 className="text-xl font-semibold text-center flex-1 pr-6">Create Your Account</h2>
              </div>
              
              {signupError && (
                <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-2 rounded-lg mb-4">
                  {signupError}
                </div>
              )}
              
              <form onSubmit={handleSignUp} className="space-y-4">
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-purple-200 mb-1">
                    Full Name (Optional)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-purple-400" />
                    </div>
                    <input
                      type="text"
                      id="fullName"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      className="w-full bg-purple-900/50 border border-purple-500/30 rounded-lg pl-10 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                      placeholder="Your Name"
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="signupEmail" className="block text-sm font-medium text-purple-200 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-purple-400" />
                    </div>
                    <input
                      type="email"
                      id="signupEmail"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full bg-purple-900/50 border border-purple-500/30 rounded-lg pl-10 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                      placeholder="your@email.com"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="signupPassword" className="block text-sm font-medium text-purple-200 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-purple-400" />
                    </div>
                    <input
                      type="password"
                      id="signupPassword"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className="w-full bg-purple-900/50 border border-purple-500/30 rounded-lg pl-10 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                  <p className="text-xs text-purple-300 mt-1">Min. 6 characters</p>
                </div>
                
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-purple-200 mb-1">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-purple-400" />
                    </div>
                    <input
                      type="password"
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className="w-full bg-purple-900/50 border border-purple-500/30 rounded-lg pl-10 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>
                
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 px-4 py-2 rounded-lg font-medium hover:shadow-lg hover:shadow-purple-500/30 transition-all mt-6"
                >
                  Create Account
                </button>
              </form>
              
              <div className="mt-6 text-center">
                <p className="text-purple-200 text-sm">
                  Already have an account?{' '}
                  <button
                    onClick={goToSignIn}
                    className="text-purple-300 hover:text-purple-200 underline"
                  >
                    Sign In
                  </button>
                </p>
              </div>
            </>
          ) : showLoginForm ? (
            <>
              <h2 className="text-xl font-semibold mb-6 text-center">Sign In to Create Your Yuga</h2>
              
              {loginError && (
                <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-2 rounded-lg mb-4">
                  {loginError}
                </div>
              )}
              
              <form onSubmit={handleSignIn} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-purple-200 mb-1">
                    Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-purple-400" />
                    </div>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full bg-purple-900/50 border border-purple-500/30 rounded-lg pl-10 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                      placeholder="your@email.com"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-purple-200 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-purple-400" />
                    </div>
                    <input
                      type="password"
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className="w-full bg-purple-900/50 border border-purple-500/30 rounded-lg pl-10 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>
                
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 px-4 py-2 rounded-lg font-medium hover:shadow-lg hover:shadow-purple-500/30 transition-all"
                >
                  Sign In
                </button>
              </form>
              
              <div className="mt-6 text-center space-y-4">
                <p className="text-purple-200 text-sm">
                  Don't have an account?{' '}
                  <button
                    onClick={goToSignUp}
                    className="text-purple-300 hover:text-purple-200 underline"
                  >
                    Sign Up
                  </button>
                </p>
                
                <button
                  onClick={() => {
                    setShowLoginForm(false);
                  }}
                  className="text-purple-300 hover:text-purple-200 text-sm underline"
                >
                  Back to Options
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="text-center mb-8">
                <p className="text-purple-200 mb-4">
                  Track your personal development journey through the ancient wisdom of Yugas, 
                  turning consistent efforts into measurable evolution.
                </p>
              </div>
              
              <div className="space-y-4">
                <button
                  onClick={() => setShowLoginForm(true)}
                  className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 px-4 py-2 rounded-lg font-medium hover:shadow-lg hover:shadow-purple-500/30 transition-all flex items-center justify-center"
                >
                  Sign In
                </button>
                
                <button
                  onClick={goToSignUp}
                  className="w-full bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-2 rounded-lg font-medium hover:bg-white/20 transition-all"
                >
                  Create Account
                </button>
                
                <button
                  onClick={() => supabase.auth.signInWithPassword({
                    email: 'demo@example.com',
                    password: 'demo123'
                  })}
                  className="w-full bg-gradient-to-r from-indigo-500/30 to-purple-500/30 px-4 py-2 rounded-lg font-medium hover:from-indigo-500/40 hover:to-purple-500/40 transition-all"
                >
                  Try Demo Account
                </button>
              </div>
              
              <div className="mt-8 text-center">
                <button
                  onClick={() => setShowLanding(true)}
                  className="text-purple-300 hover:text-purple-200 text-sm flex items-center justify-center mx-auto"
                >
                  Back to Landing Page <ChevronRight className="w-4 h-4 ml-1" />
                </button>
              </div>
            </>
          )}
        </div>
        
        <style>{`
          @keyframes twinkle {
            0%, 100% { opacity: 0.2; }
            50% { opacity: 0.8; }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50">
      <Toaster 
        position="top-right" 
        toastOptions={{
          style: {
            background: 'white',
            color: '#4B5563',
            borderRadius: '0.75rem',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            border: '1px solid #E9D5FF',
            padding: '16px',
          },
          success: {
            iconTheme: {
              primary: '#8B5CF6',
              secondary: 'white',
            },
          },
          error: {
            iconTheme: {
              primary: '#EF4444',
              secondary: 'white',
            },
          },
        }}
      />
      
      <nav className="bg-white shadow-md border-b border-purple-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600 flex items-center">
              <Sparkles className="w-6 h-6 mr-2 text-purple-600" />
              Game of Evolution
            </h1>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowLanding(true)}
                className="text-purple-600 hover:text-purple-800 flex items-center"
              >
                View Landing Page
              </button>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create Yuga
              </button>
              <button
                onClick={() => supabase.auth.signOut()}
                className="text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 p-2 rounded-full transition-colors"
                aria-label="Sign Out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {yugas.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-white rounded-2xl shadow-lg p-8 max-w-3xl mx-auto border border-purple-100">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Rocket className="w-8 h-8 text-purple-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Begin Your Evolution Journey</h2>
              <p className="text-gray-600 mb-8">
                Create your first Yuga to start tracking your progress and building consistency.
              </p>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create Your First Yuga
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            <div className="xl:col-span-2">
              <div className={`grid ${yugas.length > 1 ? 'sm:grid-cols-2' : 'grid-cols-1'} gap-6`}>
                {yugas.map(yuga => (
                  <YugaCard 
                    key={yuga.id} 
                    yuga={yuga}
                    onAddEntry={handleAddEntry}
                  />
                ))}
              </div>
              <div className="xl:col-span-1 mt-4 mb-4">
                <TopicSection yugaId={yugas[0].id} />
              </div>
            </div>
            <div className="xl:col-span-1">
              <StatsCard stats={stats} />
            </div>
          </div>
        )}
      </main>

      <CreateYugaModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={fetchYugas}
      />
    </div>
  );
}

export default App;
