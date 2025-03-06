import { TrendingUp, Award, Zap, Calendar, CheckCircle2, ChevronDown, BarChart3, Star, BookOpen, Clock } from 'lucide-react';
import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';

const StatsCard = ({ stats, className = '', yugas, onBonusTaskToggle }) => {
  const [expandedDays, setExpandedDays] = useState({});

  const toggleDay = (date) => {
    setExpandedDays(prev => ({
      ...prev,
      [date]: !prev[date]
    }));
  };

  // Combine all bonus tasks from all yugas
  const allBonusTasks = yugas ? yugas.flatMap(yuga => 
    yuga.bonus_tasks.map(task => ({
      ...task,
      yugaName: yuga.name,
      yugaId: yuga.id
    }))
  ) : [];

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
    <div className={`bg-white rounded-2xl shadow-lg p-6 border border-gray-100 relative overflow-hidden ${className}`}>
      {/* Decorative elements */}
      <div className="absolute -left-16 -top-16 w-48 h-48 bg-indigo-50 rounded-full opacity-50"></div>
      <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-purple-50 rounded-full opacity-50"></div>
      
      <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 mb-6 relative">
        Your Progress
      </h2>
      
      <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-2 gap-4 mb-8 relative">
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-5 rounded-2xl shadow-sm border border-purple-100 transform transition-transform hover:scale-105 duration-300">
          <div className="flex items-center space-x-2 mb-2">
            <div className="p-1.5 bg-purple-200 rounded-lg">
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
            <span className="font-medium text-purple-700">Total Points</span>
          </div>
          <p className="text-2xl font-bold text-purple-800">{stats.totalPoints.toFixed(2)}</p>
        </div>
        
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-5 rounded-2xl shadow-sm border border-blue-100 transform transition-transform hover:scale-105 duration-300">
          <div className="flex items-center space-x-2 mb-2">
            <div className="p-1.5 bg-blue-200 rounded-lg">
              <Award className="w-5 h-5 text-blue-600" />
            </div>
            <span className="font-medium text-blue-700">Active Yugas</span>
          </div>
          <p className="text-2xl font-bold text-blue-800">{stats.totalYugas}</p>
        </div>
        
        <div className="bg-gradient-to-br from-green-50 to-green-100 p-5 rounded-2xl shadow-sm border border-green-100 transform transition-transform hover:scale-105 duration-300">
          <div className="flex items-center space-x-2 mb-2">
            <div className="p-1.5 bg-green-200 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
            <span className="font-medium text-green-700">Bonus Tasks</span>
          </div>
          <p className="text-2xl font-bold text-green-800">{stats.completedBonusTasks}</p>
        </div>
        
        <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-5 rounded-2xl shadow-sm border border-amber-100 transform transition-transform hover:scale-105 duration-300">
          <div className="flex items-center space-x-2 mb-2">
            <div className="p-1.5 bg-amber-200 rounded-lg">
              <Zap className="w-5 h-5 text-amber-600" />
            </div>
            <span className="font-medium text-amber-700">Streak</span>
          </div>
          <p className="text-2xl font-bold text-amber-800">{stats.consistencyStreak} days</p>
        </div>
      </div>
      
      {/* Bonus Tasks Section */}
      <div className="space-y-3 mb-8">
        <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
          <Star className="w-5 h-5 mr-2 text-amber-500" />
          Bonus Tasks
        </h3>
        
        {allBonusTasks.length > 0 ? (
          <div className="space-y-2">
            {allBonusTasks.map((task) => (
              <div 
                key={task.id} 
                className={`flex items-center justify-between p-3 rounded-xl border ${
                  task.completed 
                  ? 'bg-green-50 border-green-100' 
                  : 'bg-amber-50 border-amber-100'
                } transition-all duration-300 hover:shadow-md cursor-pointer`}
                onClick={() => toggleBonusTask(task.yugaId, task.id, task.completed)}
              >
                <div className="flex-grow">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 
                      className={`w-4 h-4 ${
                        task.completed 
                        ? 'text-green-500 fill-current' 
                        : 'text-amber-400'
                      }`} 
                    />
                    <div>
                      <h3 className={`text-sm font-medium ${
                        task.completed ? 'line-through text-gray-600' : 'text-gray-800'
                      }`}>
                        {task.name}
                      </h3>
                      <p className="text-xs text-gray-500">
                        {task.yugaName}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center">
                  <span className={`font-medium px-2 py-1 rounded-full text-xs flex items-center ${
                    task.completed 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-amber-100 text-amber-700'
                  }`}>
                    <Award className="w-3 h-3 mr-1" />
                    {task.points}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4 bg-amber-50 rounded-xl border border-amber-100">
            <Star className="w-8 h-8 text-amber-300 mx-auto mb-2 opacity-50" />
            <p className="text-sm text-gray-600 font-medium">No bonus tasks available</p>
            <p className="text-xs text-gray-500 mt-1">Create a Yuga with bonus tasks to get started</p>
          </div>
        )}
      </div>
      
      <div className="space-y-3">
        {/* Points history section */}
        <h3 className="text-lg font-medium text-gray-800 mt-8 mb-4 flex items-center">
          <Calendar className="w-5 h-5 mr-2 text-indigo-500" />
          Recent Points History
        </h3>
        
        {stats.pointsHistory.map((day, index) => (
          <div key={index} className="rounded-xl border border-gray-100 hover:border-indigo-200 transition-all duration-300 overflow-hidden shadow-sm">
            <button 
              onClick={() => toggleDay(day.date)}
              className="w-full text-left p-3 bg-gradient-to-r from-white to-gray-50"
            >
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2">
                  <ChevronDown 
                    className={`w-4 h-4 text-indigo-500 transition-transform duration-300 ${expandedDays[day.date] ? 'transform rotate-180' : ''}`}
                  />
                  <span className="font-medium text-gray-700">{day.date}</span>
                </div>
                <span className="font-bold text-indigo-600">+{day.points} points</span>
              </div>
            </button>
            
            {expandedDays[day.date] && (
              <div className="px-4 py-3 bg-indigo-50 border-t border-indigo-100">
                <h4 className="text-xs font-semibold text-indigo-700 uppercase mb-2">Activity Details</h4>
                <ul className="space-y-1.5">
                  {day.descriptions.map((desc, idx) => {
                    // Determine icon and color based on description content
                    let icon = <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 mr-2 flex-shrink-0"></div>;
                    let textColor = "text-gray-700";
                    
                    if (desc.includes('bonus task')) {
                      icon = <Star className="w-3 h-3 text-amber-500 mr-1.5 flex-shrink-0" />;
                      textColor = "text-amber-700";
                    } else if (desc.includes('topic')) {
                      icon = <BookOpen className="w-3 h-3 text-purple-500 mr-1.5 flex-shrink-0" />;
                      textColor = "text-purple-700";
                    } else if (desc.includes('Daily entry')) {
                      icon = <Clock className="w-3 h-3 text-blue-500 mr-1.5 flex-shrink-0" />;
                      textColor = "text-blue-700";
                    }
                    
                    return (
                      <li key={idx} className={`text-sm ${textColor} flex items-start`}>
                        {icon}
                        <span>{desc}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default StatsCard;
