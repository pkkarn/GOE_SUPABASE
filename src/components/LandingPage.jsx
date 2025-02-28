import React, { useState, useEffect } from 'react';
import { Camera, ChevronRight, Star, Activity, BarChart2, Award, Clock } from 'lucide-react';

const GameOfEvolutionLanding = () => {
  const [scrollY, setScrollY] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Set loaded state after a small delay to trigger animations
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 300);

    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(timer);
    };
  }, []);

  // 3D parallax effect
  const calculateTransform = (factor) => {
    return {
      transform: `translateY(${scrollY * factor}px)`,
    };
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 via-indigo-900 to-black text-white overflow-hidden">
      {/* Animated cosmic particles */}
      <div className="fixed inset-0 pointer-events-none">
        {Array.from({ length: 50 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white opacity-70"
            style={{
              width: Math.random() * 4 + 'px',
              height: Math.random() * 4 + 'px',
              top: Math.random() * 100 + '%',
              left: Math.random() * 100 + '%',
              animation: `twinkle ${Math.random() * 5 + 5}s linear infinite`,
            }}
          />
        ))}
      </div>

      {/* Navigation */}
      <nav className={`fixed w-full top-0 z-50 transition-all duration-500 ${scrollY > 50 ? 'bg-purple-900/80 backdrop-blur-md py-2' : 'py-6'}`}>
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center">
            <div className="relative h-8 w-8 mr-2">
              <div className="absolute inset-0 bg-purple-500 rounded-md rotate-45" />
              <Star className="absolute inset-0 m-auto text-white h-5 w-5" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-300 bg-clip-text text-transparent">
              Game of Evolution
            </span>
          </div>
          
          <div className="hidden md:flex space-x-8">
            <a href="#features" className="hover:text-purple-300 transition-colors">Features</a>
            <a href="#concept" className="hover:text-purple-300 transition-colors">Concept</a>
            <a href="#testimonials" className="hover:text-purple-300 transition-colors">Testimonials</a>
          </div>
          
          <button className="bg-gradient-to-r from-purple-500 to-indigo-600 px-5 py-2 rounded-full font-medium hover:shadow-lg hover:shadow-purple-500/30 transition-all">
            Get Started
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative pt-32 pb-20 md:pt-40 md:pb-32 flex items-center min-h-screen">
        <div 
          className={`absolute inset-0 z-0 opacity-60 flex items-center justify-center transition-opacity duration-1000 ${isLoaded ? 'opacity-60' : 'opacity-0'}`}
          style={calculateTransform(-0.05)}
        >
          <div className="w-96 h-96 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 blur-3xl" />
        </div>
        
        <div className="container mx-auto px-4 z-10">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className={`transition-all duration-1000 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
                Transform Your <span className="bg-gradient-to-r from-purple-400 to-pink-300 bg-clip-text text-transparent">Evolution</span> Into A Game
              </h1>
              <p className="text-lg md:text-xl mb-8 text-purple-100 max-w-lg">
                Track your personal development journey through the ancient wisdom of Yugas, 
                turning consistent efforts into measurable evolution.
              </p>
              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                <button className="bg-gradient-to-r from-purple-500 to-indigo-600 px-8 py-3 rounded-full font-medium hover:shadow-lg hover:shadow-purple-500/30 transition-all flex items-center justify-center">
                  Create Your Yuga <ChevronRight className="ml-2 h-5 w-5" />
                </button>
                <button className="bg-white/10 backdrop-blur-sm border border-white/20 px-8 py-3 rounded-full font-medium hover:bg-white/20 transition-all">
                  Learn More
                </button>
              </div>
            </div>
            
            <div 
              className={`relative transition-all duration-1000 delay-300 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
              style={calculateTransform(0.03)}
            >
              {/* 3D Floating UI Card */}
              <div className="relative bg-gradient-to-br from-purple-800/90 to-indigo-900/90 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-white/10 transform rotate-3 hover:rotate-0 transition-all duration-500 hover:shadow-purple-500/20">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold">Vaidushi Yuga</h3>
                  <div className="flex items-center text-yellow-400">
                    <Trophy className="h-4 w-4 mr-1" />
                    <span>2.0/1000</span>
                  </div>
                </div>
                
                <div className="bg-white/10 rounded-lg p-3 mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Recent Activity</span>
                    <span>0.5 hours</span>
                  </div>
                  <div className="w-full bg-purple-900/50 h-2 rounded-full overflow-hidden">
                    <div className="bg-gradient-to-r from-purple-400 to-pink-500 h-full rounded-full" style={{ width: '15%' }}></div>
                  </div>
                </div>
                
                <button className="w-full bg-purple-600 hover:bg-purple-500 transition-colors py-2 rounded-lg flex items-center justify-center mb-4">
                  <span className="mr-2">+</span> Add Daily Entry
                </button>
                
                <div className="flex justify-between items-center text-sm text-purple-200">
                  <div className="flex items-center">
                    <Star className="h-4 w-4 mr-1 text-yellow-400" />
                    <span>Bonus Tasks</span>
                  </div>
                  <span className="text-purple-300">No bonus tasks available</span>
                </div>
              </div>
              
              {/* Floating Elements */}
              <div className="absolute -top-6 -right-4 bg-gradient-to-br from-indigo-600 to-purple-700 p-4 rounded-lg shadow-lg transform -rotate-6 animate-pulse-slow border border-white/10">
                <Activity className="h-6 w-6" />
              </div>
              <div className="absolute -bottom-8 -left-4 bg-gradient-to-br from-purple-600 to-pink-700 p-3 rounded-lg shadow-lg transform rotate-12 animate-float border border-white/10">
                <BarChart2 className="h-5 w-5" />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section id="features" className="py-20 relative overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className={`text-3xl md:text-5xl font-bold mb-4 transition-all duration-1000 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              Evolve With <span className="bg-gradient-to-r from-purple-400 to-pink-300 bg-clip-text text-transparent">Powerful Features</span>
            </h2>
            <p className="text-lg text-purple-200 max-w-2xl mx-auto">
              Track your journey through different Yugas with our intuitive tools designed for personal growth.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Award className="h-10 w-10 text-yellow-400" />,
                title: "Yugas System",
                description: "Create long-term projects with target points, inspired by the ancient Hindu concept of time cycles."
              },
              {
                icon: <Activity className="h-10 w-10 text-green-400" />,
                title: "Smart Points System",
                description: "Earn points based on time invested and consistency, with rewards for longer sessions."
              },
              {
                icon: <BarChart2 className="h-10 w-10 text-blue-400" />,
                title: "Visual Progress",
                description: "Track your evolution with beautiful visualizations and detailed statistics."
              },
              {
                icon: <Star className="h-10 w-10 text-yellow-400" />,
                title: "Bonus Achievements",
                description: "Complete special tasks within each Yuga to earn additional points and accelerate progress."
              },
              {
                icon: <Clock className="h-10 w-10 text-purple-400" />,
                title: "Daily Consistency",
                description: "Log your daily activities with detailed entries to build lasting habits."
              },
              {
                icon: <Camera className="h-10 w-10 text-pink-400" />,
                title: "Growth Snapshots",
                description: "Capture your evolution journey with progress milestones and comparisons."
              }
            ].map((feature, index) => (
              <div 
                key={index}
                className={`bg-gradient-to-br from-purple-900/50 to-indigo-900/50 backdrop-blur-md rounded-xl p-6 border border-white/10 hover:shadow-lg hover:shadow-purple-500/20 transition-all duration-500 transform hover:-translate-y-1 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
                style={{ transitionDelay: `${300 + index * 100}ms` }}
              >
                <div className="bg-gradient-to-br from-purple-800 to-indigo-900 p-3 rounded-lg inline-block mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-purple-200">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
        
        {/* Background effect */}
        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-purple-600/30 rounded-full blur-3xl"></div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative">
        <div className="container mx-auto px-4">
          <div className="bg-gradient-to-r from-purple-800/90 to-indigo-900/90 backdrop-blur-xl rounded-2xl p-10 border border-white/10 shadow-2xl relative overflow-hidden">
            {/* 3D floating elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
              <div className="absolute top-10 right-10 bg-gradient-to-br from-purple-500 to-pink-600 p-4 rounded-xl opacity-40 blur-sm transform rotate-12 animate-float"></div>
              <div className="absolute bottom-10 left-20 bg-gradient-to-br from-indigo-500 to-purple-600 p-6 rounded-xl opacity-40 blur-sm transform -rotate-12 animate-float-delay"></div>
            </div>
            
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
              <div className="max-w-2xl">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Start Your Evolution?</h2>
                <p className="text-lg text-purple-200 mb-6">
                  Begin your journey through the Yugas and transform your personal development into a meaningful game of evolution.
                </p>
                <div className="flex flex-wrap gap-4">
                  <button className="bg-white text-purple-900 px-8 py-3 rounded-full font-medium hover:shadow-lg hover:shadow-white/30 transition-all">
                    Get Started Now
                  </button>
                  <button className="bg-transparent border border-white/30 px-8 py-3 rounded-full font-medium hover:bg-white/10 transition-all">
                    Watch Demo
                  </button>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-purple-700/60 to-indigo-800/60 backdrop-blur-lg rounded-xl p-6 border border-white/10 shadow-lg max-w-xs w-full">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold">Your Stats</h3>
                  <div className="bg-purple-600/50 px-3 py-1 rounded-full text-sm">3.00 Points</div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Total Progress</span>
                      <span>3.0/10.0</span>
                    </div>
                    <div className="w-full bg-purple-900/50 h-2 rounded-full overflow-hidden">
                      <div className="bg-gradient-to-r from-purple-400 to-pink-500 h-full rounded-full" style={{ width: '30%' }}></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Active Yugas</span>
                      <span>2</span>
                    </div>
                    <div className="w-full bg-purple-900/50 h-2 rounded-full overflow-hidden">
                      <div className="bg-gradient-to-r from-blue-400 to-indigo-500 h-full rounded-full" style={{ width: '40%' }}></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Current Streak</span>
                      <span>1 day</span>
                    </div>
                    <div className="w-full bg-purple-900/50 h-2 rounded-full overflow-hidden">
                      <div className="bg-gradient-to-r from-yellow-400 to-orange-500 h-full rounded-full" style={{ width: '10%' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Add custom animations */}
      <style jsx>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 0.8; }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(12deg); }
          50% { transform: translateY(-10px) rotate(12deg); }
        }
        
        @keyframes float-delay {
          0%, 100% { transform: translateY(0px) rotate(-12deg); }
          50% { transform: translateY(-15px) rotate(-12deg); }
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        
        .animate-float-delay {
          animation: float-delay 8s ease-in-out infinite;
        }
        
        .animate-pulse-slow {
          animation: pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </div>
  );
};

// Custom Trophy icon component
const Trophy = ({ className }) => {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  );
};

export default GameOfEvolutionLanding;