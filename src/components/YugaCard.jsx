import { useState } from 'react';
import { Trophy, Clock, Star, CheckCircle2, Plus, ArrowUpRight } from 'lucide-react';
import CreateEntryModal from './CreateEntryModal';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';

const YugaCard = ({ yuga, onAddEntry, onBonusTaskToggle }) => {
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const progress = (yuga.current_points / yuga.target_points) * 100;
  const progressColor = progress < 30 ? 'from-purple-400 to-indigo-500' : 
                        progress < 70 ? 'from-indigo-500 to-blue-500' : 
                        'from-blue-500 to-emerald-500';

  // Get the most recent entry
  const mostRecentEntry = yuga.daily_entries.length > 0 
    ? yuga.daily_entries[yuga.daily_entries.length - 1] 
    : null;

  // Function to toggle bonus task completion
  const toggleBonusTask = async (taskId, currentStatus) => {
    try {
      // Call the database function to toggle task status
      const { error } = await supabase.rpc('toggle_bonus_task_completion', {
        task_id: taskId,
        new_status: !currentStatus
      });
      
      if (error) throw error;
      
      // Call the callback to update state in parent component
      if (onBonusTaskToggle) {
        onBonusTaskToggle(yuga.id, taskId, !currentStatus);
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
    <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 border border-gray-100 relative overflow-hidden animate-scaleIn">
      {/* Decorative background element */}
      <div className="absolute -right-12 -top-12 w-40 h-40 bg-purple-50 rounded-full opacity-50 animate-float"></div>
      
      <div className="flex justify-between items-start mb-5 relative">
        <h3 className="text-xl font-bold text-gray-800 bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600">
          {yuga.name}
        </h3>
        <div className="flex items-center space-x-2 bg-yellow-50 px-3 py-1.5 rounded-full animate-pulse-custom">
          <Trophy className="w-5 h-5 text-yellow-500" />
          <span className="text-lg font-semibold text-yellow-700">{yuga.current_points.toFixed(1)}/{yuga.target_points}</span>
        </div>
      </div>
      
      <div className="w-full bg-gray-100 rounded-full h-3 mb-5 overflow-hidden">
        <div 
          className={`bg-gradient-to-r ${progressColor} h-3 rounded-full transition-all duration-700 relative`}
          style={{ width: `${Math.min(progress, 100)}%` }}
        >
          {progress >= 20 && (
            <div className="absolute inset-0 overflow-hidden">
              <div className="w-full h-full opacity-30 animate-shimmer"></div>
            </div>
          )}
        </div>
      </div>
      
      <div className="space-y-4 relative">
        <div className="flex items-center justify-between text-sm bg-blue-50 p-3 rounded-xl">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-blue-500" />
            <span className="font-medium text-blue-700">Recent Activity</span>
          </div>
          <span className="text-blue-800 font-medium">
            {mostRecentEntry ? (
              <span className="flex items-center">
                {mostRecentEntry.hours} hours
                <ArrowUpRight className="w-3 h-3 ml-1" />
              </span>
            ) : 'No recent activity'}
          </span>
        </div>
        
        <button
          onClick={() => setIsEntryModalOpen(true)}
          className="w-full flex items-center justify-center space-x-2 py-3 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
        >
          <Plus className="w-4 h-4" />
          <span className="font-medium">Add Daily Entry</span>
        </button>
        
        <div className="border-t border-gray-100 pt-4 mt-4">
          <h4 className="text-sm font-semibold mb-3 flex items-center">
            <Star className="w-4 h-4 text-yellow-500 mr-2" />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-500 to-amber-500">
              Bonus Tasks
            </span>
          </h4>
          <div className="space-y-2.5">
            {yuga.bonus_tasks.length > 0 ? (
              yuga.bonus_tasks.map((task, index) => (
                <div 
                  key={task.id} 
                  className={`flex items-center justify-between text-sm p-2 rounded-lg ${task.completed ? 'bg-green-50' : 'bg-gray-50'} transition-colors duration-300 animate-fadeIn stagger-item cursor-pointer hover:bg-opacity-80`}
                  style={{ animationDelay: `${0.1 * (index + 1)}s` }}
                  onClick={() => toggleBonusTask(task.id, task.completed)}
                >
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className={`w-4 h-4 ${task.completed ? 'text-green-500' : 'text-gray-400'}`} />
                    <span className={task.completed ? 'line-through text-gray-500 font-medium' : 'font-medium text-gray-700'}>
                      {task.name}
                    </span>
                  </div>
                  <span className={`font-medium px-2 py-0.5 rounded-full ${task.completed ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    +{task.points}pts
                  </span>
                </div>
              ))
            ) : (
              <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg text-center italic animate-fadeIn">
                No bonus tasks available
              </div>
            )}
          </div>
        </div>
      </div>

      <CreateEntryModal
        isOpen={isEntryModalOpen}
        onClose={() => setIsEntryModalOpen(false)}
        yugaId={yuga.id}
        yugaName={yuga.name}
        onAddEntry={onAddEntry}
      />
    </div>
  );
};

export default YugaCard;
