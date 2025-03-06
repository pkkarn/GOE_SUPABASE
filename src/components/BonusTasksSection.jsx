import { useState } from 'react';
import { Star, CheckCircle2, Award, Filter, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';

const BonusTasksSection = ({ yugas, onBonusTaskToggle }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all'); // 'all', 'completed', 'pending'

  // Combine all bonus tasks from all yugas
  const allBonusTasks = yugas.flatMap(yuga => 
    yuga.bonus_tasks.map(task => ({
      ...task,
      yugaName: yuga.name,
      yugaId: yuga.id
    }))
  );

  // Apply filters
  const filteredTasks = allBonusTasks.filter(task => {
    // Apply search filter
    const matchesSearch = 
      task.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.yugaName.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Apply status filter
    const matchesFilter = 
      filter === 'all' || 
      (filter === 'completed' && task.completed) || 
      (filter === 'pending' && !task.completed);
    
    return matchesSearch && matchesFilter;
  });

  // Toggle task completion
  const toggleBonusTask = async (yugaId, taskId, currentStatus) => {
    try {
      // Call the database function to toggle task status
      const { error } = await supabase.rpc('toggle_bonus_task_completion', {
        task_id: taskId,
        new_status: !currentStatus
      });
      
      if (error) throw error;
      
      // Call the callback to update state in parent component
      if (onBonusTaskToggle) {
        onBonusTaskToggle(yugaId, taskId, !currentStatus);
      }
      
      // Show success message
      if (!currentStatus) {
        toast.success(`Bonus task completed! Points added to your Yuga.`);
      } else {
        toast.success(`Bonus task marked as pending. Points removed.`);
      }
    } catch (error) {
      toast.error('Failed to update bonus task');
      console.error('Error:', error);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute -left-16 -top-16 w-48 h-48 bg-amber-50 rounded-full opacity-50"></div>
      <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-yellow-50 rounded-full opacity-50"></div>
      
      <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-500 to-yellow-500 mb-6 relative flex items-center">
        <Star className="w-5 h-5 mr-2 text-amber-500" />
        Bonus Tasks
      </h2>

      {/* Search and filter controls */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search bonus tasks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-2 rounded-xl text-sm font-medium flex items-center ${
              filter === 'all' 
              ? 'bg-amber-100 text-amber-800' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Filter className="w-4 h-4 mr-1" />
            All
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-3 py-2 rounded-xl text-sm font-medium flex items-center ${
              filter === 'completed' 
              ? 'bg-green-100 text-green-800' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 mr-1" />
            Completed
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-3 py-2 rounded-xl text-sm font-medium flex items-center ${
              filter === 'pending' 
              ? 'bg-amber-100 text-amber-800' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Star className="w-4 h-4 mr-1" />
            Pending
          </button>
        </div>
      </div>

      {/* Bonus tasks list */}
      {filteredTasks.length > 0 ? (
        <div className="space-y-3">
          {filteredTasks.map((task) => (
            <div 
              key={task.id} 
              className={`flex items-center justify-between p-4 rounded-xl border ${
                task.completed 
                ? 'bg-green-50 border-green-100' 
                : 'bg-amber-50 border-amber-100'
              } transition-all duration-300 hover:shadow-md cursor-pointer`}
              onClick={() => toggleBonusTask(task.yugaId, task.id, task.completed)}
            >
              <div className="flex-grow">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 
                    className={`w-5 h-5 ${
                      task.completed 
                      ? 'text-green-500 fill-current' 
                      : 'text-amber-400'
                    }`} 
                  />
                  <div>
                    <h3 className={`font-medium ${
                      task.completed ? 'line-through text-gray-600' : 'text-gray-800'
                    }`}>
                      {task.name}
                    </h3>
                    <p className="text-xs text-gray-500">
                      From <span className="font-medium text-purple-600">{task.yugaName}</span>
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center">
                <span className={`font-medium px-3 py-1 rounded-full text-sm flex items-center ${
                  task.completed 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-amber-100 text-amber-700'
                }`}>
                  <Award className="w-3.5 h-3.5 mr-1" />
                  {task.points} points
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 bg-amber-50 rounded-xl border border-amber-100">
          {searchTerm || filter !== 'all' ? (
            <>
              <Star className="w-12 h-12 text-amber-300 mx-auto mb-3 opacity-50" />
              <p className="text-gray-600 font-medium">No matching bonus tasks found</p>
              <p className="text-sm text-gray-500 mt-1">Try adjusting your search or filters</p>
            </>
          ) : (
            <>
              <Star className="w-12 h-12 text-amber-300 mx-auto mb-3 opacity-50" />
              <p className="text-gray-600 font-medium">No bonus tasks available</p>
              <p className="text-sm text-gray-500 mt-1">Create a new Yuga with bonus tasks to get started</p>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default BonusTasksSection; 