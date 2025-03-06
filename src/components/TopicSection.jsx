import { useState, useEffect } from 'react';
import { Search, BookOpen, CheckCircle, PlusCircle, Clock, X, Filter, Sparkles, Award, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabase';

const TopicsToExplore = ({ yugaId }) => {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all'); // 'all', 'completed', 'pending'
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTopic, setNewTopic] = useState({ name: '', description: '', points: 5 });
  const [userYugas, setUserYugas] = useState([]);
  const [selectedYugaId, setSelectedYugaId] = useState(yugaId || null);

  // Fetch user's Yugas
  useEffect(() => {
    const fetchUserYugas = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const { data, error } = await supabase
          .from('yugas')
          .select('id, name, current_points, target_points')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        
        setUserYugas(data);
        if (!selectedYugaId && data.length > 0) {
          setSelectedYugaId(data[0].id);
        }
      } catch (error) {
        toast.error('Failed to load yugas');
        console.error('Error:', error);
      }
    };

    fetchUserYugas();
  }, [selectedYugaId]);

  // Fetch topics
  useEffect(() => {
    const fetchTopics = async () => {
      if (!selectedYugaId) return;

      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const { data, error } = await supabase
          .from('explore_topics')
          .select('*')
          .eq('user_id', user.id)
          .eq('yuga_id', selectedYugaId)
          .order('created_at', { ascending: false });

        if (error) throw error;

        setTopics(data || []);
      } catch (error) {
        toast.error('Failed to load topics');
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTopics();
  }, [selectedYugaId]);

  const handleAddTopic = async (e) => {
    e.preventDefault();
    
    if (!newTopic.name.trim()) {
      toast.error('Topic name is required');
      return;
    }

    if (newTopic.points <= 0) {
      toast.error('Points must be a positive number');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('explore_topics')
        .insert({
          user_id: user.id,
          yuga_id: selectedYugaId,
          topic_name: newTopic.name.trim(),
          description: newTopic.description.trim(),
          points: parseInt(newTopic.points),
          is_completed: false
        })
        .select()
        .single();

      if (error) throw error;

      setTopics([data, ...topics]);
      setNewTopic({ name: '', description: '', points: 5 });
      setShowAddForm(false);
      toast.success('Topic added successfully');
    } catch (error) {
      toast.error('Failed to add topic');
      console.error('Error:', error);
    }
  };

  const toggleCompletion = async (id, currentStatus) => {
    try {
      // Get the topic being toggled
      const topic = topics.find(t => t.id === id);
      if (!topic) throw new Error('Topic not found');
      
      // Start a Supabase transaction
      const { error } = await supabase.rpc('toggle_topic_completion', {
        topic_id: id,
        new_status: !currentStatus,
        completed_time: !currentStatus ? new Date().toISOString() : null
      });
      
      if (error) throw error;
      
      // Update local state for topics
      setTopics(topics.map(t => 
        t.id === id 
          ? { 
              ...t, 
              is_completed: !currentStatus, 
              completed_at: !currentStatus ? new Date().toISOString() : null 
            } 
          : t
      ));
      
      // Update local state for Yuga points
      const pointsChange = !currentStatus ? topic.points : -topic.points;
      setUserYugas(yugas => 
        yugas.map(yuga => 
          yuga.id === topic.yuga_id 
            ? { ...yuga, current_points: (yuga.current_points || 0) + pointsChange } 
            : yuga
        )
      );
      
      // Show success message
      if (!currentStatus) {
        toast.success(`Topic completed! +${topic.points} points`);
      } else {
        toast.success(`Topic marked as pending. ${topic.points} points removed.`);
      }
    } catch (error) {
      toast.error('Failed to update topic');
      console.error('Error:', error);
    }
  };

  // Filter topics
  const filteredTopics = topics.filter(topic => {
    const matchesSearch = 
      topic.topic_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (topic.description && topic.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (filter === 'all') return matchesSearch;
    if (filter === 'completed') return matchesSearch && topic.is_completed;
    if (filter === 'pending') return matchesSearch && !topic.is_completed;
    
    return matchesSearch;
  });

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  // Get current yuga name
  const currentYuga = userYugas.find(yuga => yuga.id === selectedYugaId);
  const yugaName = currentYuga ? currentYuga.name : 'Select a Yuga';

  return (
    <div className="bg-white rounded-2xl shadow-md p-6 border border-purple-100">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="flex items-center">
          <BookOpen className="w-5 h-5 mr-2 text-purple-600" />
          <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600">
            Topics to Explore
          </h2>
        </div>

        {/* Yuga Selector */}
        <div className="relative min-w-[180px]">
          <select
            value={selectedYugaId || ''}
            onChange={(e) => setSelectedYugaId(e.target.value)}
            className="appearance-none w-full bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl py-2 px-4 pr-8 shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="" disabled>Select a Yuga</option>
            {userYugas.map(yuga => (
              <option key={yuga.id} value={yuga.id}>
                {yuga.name} ({yuga.current_points}/{yuga.target_points})
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-purple-600">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
            </svg>
          </div>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-grow">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search topics..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
        
        <div className="flex-shrink-0 relative">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="appearance-none bg-gray-50 border border-gray-200 text-gray-700 py-2 px-4 pr-8 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">All Topics</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
            <Filter className="h-4 w-4" />
          </div>
        </div>
      </div>

      {/* Add New Topic Form/Button */}
      {showAddForm ? (
        <div className="mb-6 p-5 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border border-purple-100 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-purple-800 flex items-center">
              <Sparkles className="w-4 h-4 mr-2 text-purple-600" />
              Add New Topic to Explore
            </h3>
            <button 
              onClick={() => setShowAddForm(false)} 
              className="text-gray-500 hover:text-gray-700 bg-white p-1.5 rounded-full hover:bg-gray-50 transition-colors border border-gray-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <form onSubmit={handleAddTopic}>
            <div className="mb-3">
              <input
                type="text"
                placeholder="Topic name"
                value={newTopic.name}
                onChange={(e) => setNewTopic({...newTopic, name: e.target.value})}
                className="w-full px-4 py-2 border border-purple-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent shadow-sm"
                required
              />
            </div>
            <div className="mb-3">
              <textarea
                placeholder="Description (optional)"
                value={newTopic.description}
                onChange={(e) => setNewTopic({...newTopic, description: e.target.value})}
                className="w-full px-4 py-2 border border-purple-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent shadow-sm"
                rows="3"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-purple-600 mb-2 flex items-center">
                <Award className="w-4 h-4 mr-2" />
                Points to Earn
              </label>
              <input
                type="number"
                min="1"
                placeholder="Points"
                value={newTopic.points}
                onChange={(e) => setNewTopic({...newTopic, points: e.target.value})}
                className="w-full px-4 py-2 border border-purple-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent shadow-sm"
                required
              />
              <p className="text-xs text-purple-500 mt-1 italic">
                These points will be added to your Yuga when completed
              </p>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
              >
                Add Topic
              </button>
            </div>
          </form>
        </div>
      ) : (
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center justify-center w-full mb-6 py-3 px-4 bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-700 rounded-xl hover:from-purple-200 hover:to-indigo-200 transition-colors shadow-sm"
        >
          <PlusCircle className="w-5 h-5 mr-2" />
          Add New Topic to Explore
        </button>
      )}

      {/* Loading State */}
      {loading && (
        <div className="py-10 flex justify-center items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredTopics.length === 0 && (
        <div className="py-10 text-center border border-dashed border-gray-300 rounded-xl">
          <BookOpen className="w-12 h-12 mx-auto text-gray-300 mb-3" />
          <h3 className="text-lg font-medium text-gray-500 mb-1">No topics found</h3>
          <p className="text-gray-400 text-sm">
            {searchTerm || filter !== 'all' 
              ? "Try adjusting your search or filters" 
              : "Add your first topic to explore for this Yuga"}
          </p>
        </div>
      )}

      {/* Topics List */}
      {!loading && filteredTopics.length > 0 && (
        <ul className="space-y-3">
          {filteredTopics.map(topic => (
            <li 
              key={topic.id} 
              className={`relative overflow-hidden rounded-xl border transition-all ${
                topic.is_completed 
                  ? 'border-green-200 bg-gradient-to-r from-green-50 to-emerald-50' 
                  : 'border-purple-100 bg-white hover:border-purple-200'
              }`}
            >
              <div className="p-4">
                <div className="flex">
                  <div 
                    className={`flex-shrink-0 cursor-pointer mr-3 ${
                      topic.is_completed ? 'text-green-500' : 'text-gray-300 hover:text-purple-500'
                    }`}
                    onClick={() => toggleCompletion(topic.id, topic.is_completed)}
                  >
                    <CheckCircle 
                      className={`w-6 h-6 ${topic.is_completed ? 'fill-current' : ''}`} 
                    />
                  </div>
                  
                  <div className="flex-grow">
                    <div className="flex items-center justify-between">
                      <h3 className={`font-medium ${
                        topic.is_completed ? 'text-green-700 line-through' : 'text-purple-800'
                      }`}>
                        {topic.topic_name}
                      </h3>
                      <div className="ml-2 bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full text-xs font-medium flex items-center">
                        <Award className="w-3 h-3 mr-1" />
                        {topic.points} pts
                      </div>
                    </div>
                    
                    {topic.description && (
                      <p className={`mt-1 text-sm ${
                        topic.is_completed ? 'text-green-600' : 'text-gray-600'
                      }`}>
                        {topic.description}
                      </p>
                    )}
                    
                    <div className="mt-2 flex items-center text-xs text-gray-500">
                      <Clock className="w-3 h-3 mr-1" />
                      {topic.is_completed 
                        ? `Completed on ${formatDate(topic.completed_at)}` 
                        : `Added on ${formatDate(topic.created_at)}`
                      }
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Background decoration */}
              <div className="absolute -right-6 -bottom-6 w-12 h-12 rounded-full bg-opacity-30 bg-indigo-100"></div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default TopicsToExplore;