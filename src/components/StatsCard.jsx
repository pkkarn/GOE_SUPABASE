import { TrendingUp, Award, Zap, Calendar, CheckCircle2, ChevronDown } from 'lucide-react';
import { useState } from 'react';

const StatsCard = ({ stats, className = '' }) => {
  const [expandedDays, setExpandedDays] = useState({});

  const toggleDay = (date) => {
    setExpandedDays(prev => ({
      ...prev,
      [date]: !prev[date]
    }));
  };

  return (
    <div className={`bg-white rounded-xl shadow-lg p-6 ${className}`}>
      <h2 className="text-xl font-bold text-gray-800 mb-6">Your Progress</h2>
      
      <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-2 gap-4 mb-6">
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <TrendingUp className="w-5 h-5 text-purple-600" />
            <span className="font-medium text-purple-600">Total Points</span>
          </div>
          <p className="text-2xl font-bold text-purple-700">{stats.totalPoints.toFixed(2)}</p>
        </div>
        
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <Award className="w-5 h-5 text-blue-600" />
            <span className="font-medium text-blue-600">Active Yugas</span>
          </div>
          <p className="text-2xl font-bold text-blue-700">{stats.totalYugas}</p>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <span className="font-medium text-green-600">Bonus Tasks</span>
          </div>
          <p className="text-2xl font-bold text-green-700">{stats.completedBonusTasks}</p>
        </div>
        
        <div className="bg-yellow-50 p-4 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <Zap className="w-5 h-5 text-yellow-600" />
            <span className="font-medium text-yellow-600">Streak</span>
          </div>
          <p className="text-2xl font-bold text-yellow-700">{stats.consistencyStreak} days</p>
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Calendar className="w-5 h-5 mr-2 text-gray-600" />
          Recent Points History
        </h3>
        <div className="space-y-3">
          {stats.pointsHistory.map((day, index) => (
            <div key={index} className="rounded-lg border border-gray-100 p-3 hover:border-gray-200 transition-colors">
              <button 
                onClick={() => toggleDay(day.date)}
                className="w-full text-left"
              >
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <ChevronDown 
                      className={`w-4 h-4 text-gray-500 transition-transform ${expandedDays[day.date] ? 'transform rotate-180' : ''}`}
                    />
                    <span className="text-gray-600">{day.date}</span>
                  </div>
                  <span className={`font-medium ${day.points >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {day.points >= 0 ? '+' : ''}{day.points.toFixed(2)}pts
                  </span>
                </div>
              </button>
              {expandedDays[day.date] && day.titles && day.titles.length > 0 && (
                <div className="mt-2 pl-6 text-sm text-gray-600 border-t pt-2">
                  <ul className="list-disc space-y-1 pl-4">
                    {day.titles.map((title, idx) => (
                      <li key={idx}>{title}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default StatsCard;