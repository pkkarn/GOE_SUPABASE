import { useState } from 'react';
import { Trophy, Clock, Star, CheckCircle2, Plus } from 'lucide-react';
import CreateEntryModal from './CreateEntryModal';

const YugaCard = ({ yuga, onAddEntry }) => {
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const progress = (yuga.current_points / yuga.target_points) * 100;

  // Get the most recent entry
  const mostRecentEntry = yuga.daily_entries.length > 0 
    ? yuga.daily_entries[yuga.daily_entries.length - 1] 
    : null;

  console.log(yuga);

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xl font-bold text-gray-800">{yuga.name}</h3>
        <div className="flex items-center space-x-2">
          <Trophy className="w-5 h-5 text-yellow-500" />
          <span className="text-lg font-semibold">{yuga.current_points}/{yuga.target_points}</span>
        </div>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
        <div 
          className="bg-purple-600 h-2.5 rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      
      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-blue-500" />
            <span>Recent Activity</span>
          </div>
          <span>{mostRecentEntry ? `${mostRecentEntry.hours} hours - ${mostRecentEntry.title}` : 'No recent activity'}</span>
        </div>
        
        <button
          onClick={() => setIsEntryModalOpen(true)}
          className="w-full flex items-center justify-center space-x-2 py-2 px-4 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Daily Entry</span>
        </button>
        
        <div className="border-t pt-3">
          <h4 className="text-sm font-semibold mb-2 flex items-center">
            <Star className="w-4 h-4 text-yellow-500 mr-2" />
            Bonus Tasks
          </h4>
          <div className="space-y-2">
            {yuga.bonus_tasks.length > 0 ? (
              yuga.bonus_tasks.map(task => (
                <div key={task.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className={`w-4 h-4 ${task.completed ? 'text-green-500' : 'text-gray-400'}`} />
                    <span className={task.completed ? 'line-through text-gray-500' : ''}>{task.name}</span>
                  </div>
                  <span className="font-medium">+{task.points}pts</span>
                </div>
              ))
            ) : (
              <div className="text-sm text-gray-500">No bonus tasks available</div>
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