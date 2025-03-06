import { X, Clock, CheckCircle, PenLine, Timer, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';

const CreateEntryModal = ({ isOpen, onClose, yugaId, yugaName, onAddEntry }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    hours: '',
  });
  
  const [formStep, setFormStep] = useState(1);
  const totalSteps = 3;
  const [existingEntry, setExistingEntry] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing entry on open
  useEffect(() => {
    if (isOpen && yugaId) {
      checkExistingEntry();
    }
  }, [isOpen, yugaId]);

  // Function to check if an entry already exists for the current day
  const checkExistingEntry = async () => {
    setIsLoading(true);
    try {
      // Get today's date in ISO format (YYYY-MM-DD)
      const today = new Date().toISOString().split('T')[0];
      
      // Query Supabase for an entry created today for this yuga
      const { data, error } = await supabase
        .from('daily_entries')
        .select('*')
        .eq('yuga_id', yugaId)
        .gte('created_at', today)
        .lt('created_at', today + 'T23:59:59.999Z');
      
      if (error) throw error;
      
      // If entry exists, store it
      if (data && data.length > 0) {
        setExistingEntry(data[0]);
      } else {
        setExistingEntry(null);
      }
    } catch (err) {
      console.error('Error checking existing entry:', err);
      toast.error('Failed to check existing entries');
    } finally {
      setIsLoading(false);
    }
  };

  // Function to load existing entry data into the form
  const loadExistingEntry = () => {
    if (existingEntry) {
      setFormData({
        title: existingEntry.title || '',
        description: existingEntry.description || '',
        hours: existingEntry.hours.toString() || '',
      });
      setFormStep(1); // Reset to first step
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // If there's an existing entry, update it instead of creating a new one
    if (existingEntry) {
      // We'll pass the existingEntry.id to update rather than create
      onAddEntry(yugaId, formData, existingEntry.id);
    } else {
      // Create new entry as before
      onAddEntry(yugaId, formData);
    }
    
    setFormData({ title: '', description: '', hours: '' }); // Reset form
    setFormStep(1); // Reset step
    onClose();
  };
  
  const nextStep = () => setFormStep(prev => Math.min(prev + 1, totalSteps));
  const prevStep = () => setFormStep(prev => Math.max(prev - 1, 1));
  
  const isStepComplete = (step) => {
    switch(step) {
      case 1: return formData.title.trim() !== '';
      case 2: return true; // Description is optional
      case 3: return formData.hours.trim() !== '';
      default: return false;
    }
  };
  
  const canProceed = isStepComplete(formStep);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-purple-100 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute -right-12 -top-12 w-40 h-40 bg-purple-50 rounded-full opacity-50"></div>
        <div className="absolute -left-8 -bottom-8 w-32 h-32 bg-indigo-50 rounded-full opacity-50"></div>
        
        <div className="flex justify-between items-center mb-6 relative">
          <div>
            <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600">
              {existingEntry ? 'Update Daily Entry' : 'Add Daily Entry'}
            </h2>
            <p className="text-sm text-indigo-600 font-medium">
              for <span className="text-purple-700">{yugaName}</span>
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="text-gray-500 hover:text-gray-700 bg-gray-100 p-1.5 rounded-full hover:bg-gray-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {isLoading ? (
          <div className="py-8 text-center">
            <p className="text-gray-600">Checking for existing entries...</p>
          </div>
        ) : existingEntry && !formData.title ? (
          <div className="bg-blue-50 p-4 rounded-xl mb-6">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-blue-800">Entry already exists for today</h3>
                <p className="text-sm text-blue-600 mt-1">
                  You already have an entry titled "{existingEntry.title}" for today.
                </p>
                <div className="flex space-x-3 mt-3">
                  <button
                    onClick={loadExistingEntry}
                    className="text-sm px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Update Existing Entry
                  </button>
                  <button
                    onClick={onClose}
                    className="text-sm px-3 py-1.5 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Progress indicator */
          <div className="flex items-center justify-between mb-6 px-2 relative">
            {[1, 2, 3].map(step => (
              <div key={step} className="flex flex-col items-center">
                <div 
                  className={`w-8 h-8 rounded-full flex items-center justify-center mb-1
                    ${formStep === step 
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white' 
                      : formStep > step || isStepComplete(step)
                        ? 'bg-green-100 text-green-600' 
                        : 'bg-gray-100 text-gray-400'
                      }`}
                >
                  {formStep > step || (step !== formStep && isStepComplete(step)) ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : step === 1 ? (
                    <PenLine className="w-4 h-4" />
                  ) : step === 2 ? (
                    <Clock className="w-4 h-4" />
                  ) : (
                    <Timer className="w-4 h-4" />
                  )}
                </div>
                <span className={`text-xs font-medium ${formStep === step ? 'text-indigo-600' : 'text-gray-500'}`}>
                  {step === 1 ? 'Title' : step === 2 ? 'Details' : 'Time'}
                </span>
              </div>
            ))}
            
            {/* Progress line */}
            <div className="absolute top-4 left-10 right-10 h-0.5 bg-gray-200 -z-10"></div>
            <div 
              className="absolute top-4 left-10 h-0.5 bg-gradient-to-r from-purple-600 to-indigo-600 transition-all duration-300 -z-10"
              style={{ width: `${(formStep - 1) * 50}%` }}
            ></div>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4 relative">
          {!isLoading && (existingEntry ? formData.title : true) && (
            <>
              {/* Step 1: Title */}
              {formStep === 1 && (
                <div className="animate-fadeIn">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    What did you work on?
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent shadow-sm"
                    placeholder="Enter a title for your activity"
                    required
                    autoFocus
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Be specific about what you accomplished
                  </p>
                </div>
              )}
              
              {/* Step 2: Description */}
              {formStep === 2 && (
                <div className="animate-fadeIn">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Add more details (optional)
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent shadow-sm h-28"
                    placeholder="Describe what you did, challenges you faced, or progress you made..."
                    autoFocus
                  />
                </div>
              )}
              
              {/* Step 3: Hours */}
              {formStep === 3 && (
                <div className="animate-fadeIn">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    How much time did you spend?
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 bg-indigo-100 p-1.5 rounded-lg">
                      <Clock className="w-4 h-4 text-indigo-600" />
                    </div>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={formData.hours}
                      onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent shadow-sm"
                      placeholder="0.0"
                      required
                      autoFocus
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Enter time in hours (e.g., 1.5 for 1 hour 30 minutes)
                  </p>
                </div>
              )}
              
              <div className="flex justify-between pt-6">
                {formStep > 1 ? (
                  <button
                    type="button"
                    onClick={prevStep}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    Back
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                )}
                
                {formStep < totalSteps ? (
                  <button
                    type="button"
                    onClick={nextStep}
                    disabled={!canProceed}
                    className={`px-6 py-2 rounded-xl transition-all duration-300 ${
                      canProceed 
                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md hover:shadow-lg transform hover:-translate-y-0.5' 
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    Continue
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={!canProceed}
                    className={`px-6 py-2 rounded-xl transition-all duration-300 ${
                      canProceed 
                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md hover:shadow-lg transform hover:-translate-y-0.5' 
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {existingEntry ? 'Update Entry' : 'Add Entry'}
                  </button>
                )}
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
};

export default CreateEntryModal;
