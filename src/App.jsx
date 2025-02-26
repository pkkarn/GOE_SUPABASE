import { useState, useEffect } from 'react';
import { Plus, LogOut, Sparkles, Rocket } from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';
import YugaCard from './components/YugaCard';
import StatsCard from './components/StatsCard';
import CreateYugaModal from './components/CreateYugaModal';
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
      // Fetch all daily entries for the last 5 days
      const fiveDaysAgo = new Date();
      fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

      const { data: entries, error: entriesError } = await supabase
        .from('daily_entries')
        .select('points, created_at, title')
        .gte('created_at', fiveDaysAgo.toISOString())
        .order('created_at', { ascending: false });

      if (entriesError) throw entriesError;

      // Group entries by date and sum points
      const pointsByDate = entries.reduce((acc, entry) => {
        const date = new Date(entry.created_at).toISOString().split('T')[0];
        if (!acc[date]) {
          acc[date] = {
            points: 0,
            titles: []
          };
        }
        acc[date].points += entry.points;
        acc[date].titles.push(entry.title);
        return acc;
      }, {});

      // Convert to array format
      const pointsHistory = Object.entries(pointsByDate)
        .map(([date, data]) => ({
          date,
          points: data.points,
          titles: data.titles
        }))
        .slice(0, 5);

      // Calculate total points
      const totalPoints = entries.reduce((sum, entry) => sum + entry.points, 0);

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
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full border border-purple-100 relative overflow-hidden">
          <div className="absolute -right-16 -top-16 w-48 h-48 bg-purple-50 rounded-full opacity-50"></div>
          <div className="absolute -left-12 -bottom-12 w-40 h-40 bg-indigo-50 rounded-full opacity-50"></div>
          
          <div className="relative">
            <div className="flex justify-center mb-2">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full flex items-center justify-center">
                <Rocket className="w-8 h-8 text-white" />
              </div>
            </div>
            
            <h1 className="text-2xl font-bold text-center mb-8 bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600">
              Game of Evolution
            </h1>
            
            <p className="text-gray-600 text-center mb-6">
              Track your progress, build consistency, and evolve your skills
            </p>
            
            <button
              onClick={() => supabase.auth.signInWithPassword({
                email: 'demo@example.com',
                password: 'demo123'
              })}
              className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 font-medium"
            >
              Sign In to Demo
            </button>
          </div>
        </div>
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
