import { useState } from 'react';
import { X, Plus, Minus, Target, Award, Star, Sparkles } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabase';

const CreateYugaModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    targetPoints: '',
    bonusTasks: [{ name: '', points: '' }]
  });

  if (!isOpen) return null;

  const addBonusTask = () => {
    setFormData(prev => ({
      ...prev,
      bonusTasks: [...prev.bonusTasks, { name: '', points: '' }]
    }));
  };

  const removeBonusTask = (index) => {
    setFormData(prev => ({
      ...prev,
      bonusTasks: prev.bonusTasks.filter((_, i) => i !== index)
    }));
  };

  const updateBonusTask = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      bonusTasks: prev.bonusTasks.map((task, i) => 
        i === index ? { ...task, [field]: value } : task
      )
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Get the current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
  
      // Create yuga with user_id
      const { data: yuga, error: yugaError } = await supabase
        .from('yugas')
        .insert({
          name: formData.name,
          target_points: parseFloat(formData.targetPoints),
          current_points: 0,
          user_id: user.id // Add the user_id here
        })
        .select()
        .single();

        await supabase.from('bonus_tasks').insert({
          yuga_id: yuga.id,
          name: formData.bonusTasks[0].name,
          points: parseFloat(formData.bonusTasks[0].points)
        })
  
      if (yugaError) throw yugaError;
  
      // ... (rest of your code for creating bonus tasks)
    } catch (error) {
      toast.error('Failed to create yuga');
      console.error('Error:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-purple-100 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute -right-16 -top-16 w-48 h-48 bg-purple-50 rounded-full opacity-50"></div>
        <div className="absolute -left-12 -bottom-12 w-40 h-40 bg-indigo-50 rounded-full opacity-50"></div>
        
        <div className="flex justify-between items-center mb-8 relative">
          <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600">
            Create New Yuga
          </h2>
          <button 
            onClick={onClose} 
            className="text-gray-500 hover:text-gray-700 bg-gray-100 p-1.5 rounded-full hover:bg-gray-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6 relative">
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-4 rounded-xl border border-purple-100">
            <label className="block text-sm font-medium text-indigo-700 mb-2 flex items-center">
              <Sparkles className="w-4 h-4 mr-2 text-purple-600" />
              Yuga Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 border border-purple-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent shadow-sm"
              placeholder="What do you want to master?"
              required
            />
          </div>
          
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-100">
            <label className="block text-sm font-medium text-blue-700 mb-2 flex items-center">
              <Target className="w-4 h-4 mr-2 text-blue-600" />
              Target Points
            </label>
            <input
              type="number"
              value={formData.targetPoints}
              onChange={(e) => setFormData({ ...formData, targetPoints: e.target.value })}
              className="w-full px-4 py-3 border border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
              placeholder="Set your goal (e.g. 1000)"
              required
            />
            <p className="text-xs text-blue-600 mt-2 italic">
              This represents your mastery goal for this Yuga
            </p>
          </div>
          
          <div className="bg-gradient-to-r from-amber-50 to-yellow-50 p-4 rounded-xl border border-amber-100">
            <label className="block text-sm font-medium text-amber-700 mb-3 flex items-center">
              <Star className="w-4 h-4 mr-2 text-amber-500" />
              Bonus Tasks
            </label>
            <div className="space-y-3">
              {formData.bonusTasks.map((task, index) => (
                <div 
                  key={index} 
                  className="flex gap-2 items-center bg-white p-3 rounded-lg shadow-sm border border-amber-100 transition-all duration-300 hover:shadow-md"
                >
                  <div className="flex-1">
                    <input
                      type="text"
                      value={task.name}
                      onChange={(e) => updateBonusTask(index, 'name', e.target.value)}
                      className="w-full px-3 py-2 border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                      placeholder="Task name"
                    />
                  </div>
                  <div className="w-24 flex items-center">
                    <input
                      type="number"
                      value={task.points}
                      onChange={(e) => updateBonusTask(index, 'points', e.target.value)}
                      className="w-full px-3 py-2 border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                      placeholder="Points"
                    />
                  </div>
                  {index > 0 && (
                    <button
                      type="button"
                      onClick={() => removeBonusTask(index)}
                      className="text-red-500 hover:text-red-700 bg-red-50 p-1.5 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addBonusTask}
                className="w-full py-2 px-3 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition-colors flex items-center justify-center font-medium"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Another Task
              </button>
            </div>
          </div>
          
          <div className="flex justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 flex items-center"
            >
              <Award className="w-4 h-4 mr-2" />
              Create Yuga
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateYugaModal;
