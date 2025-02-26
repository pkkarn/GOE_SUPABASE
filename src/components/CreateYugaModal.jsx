import { useState } from 'react';
import { X, Plus, Minus } from 'lucide-react';
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
  
      if (yugaError) throw yugaError;
  
      // ... (rest of your code for creating bonus tasks)
    } catch (error) {
      toast.error('Failed to create yuga');
      console.error('Error:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Create New Yuga</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Yuga Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Enter yuga name"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Target Points
            </label>
            <input
              type="number"
              value={formData.targetPoints}
              onChange={(e) => setFormData({ ...formData, targetPoints: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Enter target points"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bonus Tasks
            </label>
            <div className="space-y-2">
              {formData.bonusTasks.map((task, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={task.name}
                    onChange={(e) => updateBonusTask(index, 'name', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Task name"
                  />
                  <input
                    type="number"
                    value={task.points}
                    onChange={(e) => updateBonusTask(index, 'points', e.target.value)}
                    className="w-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Points"
                  />
                  {index > 0 && (
                    <button
                      type="button"
                      onClick={() => removeBonusTask(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Minus className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addBonusTask}
                className="text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Another Task
              </button>
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:text-gray-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
            >
              Create Yuga
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateYugaModal;