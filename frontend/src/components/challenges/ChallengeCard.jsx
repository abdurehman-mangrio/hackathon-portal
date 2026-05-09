// components/challenges/ChallengeCard.jsx (updated)
import React, { useState } from 'react';
import { Terminal, Flag, Clock, Award, Zap, Eye } from 'lucide-react';

const ChallengeCard = ({ challenge, onSolve, viewMode }) => {
  const [showTerminal, setShowTerminal] = useState(false);

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy': return 'text-green-400 border-green-500 bg-green-500 bg-opacity-10';
      case 'medium': return 'text-yellow-400 border-yellow-500 bg-yellow-500 bg-opacity-10';
      case 'hard': return 'text-red-400 border-red-500 bg-red-500 bg-opacity-10';
      default: return 'text-gray-400 border-gray-500 bg-gray-500 bg-opacity-10';
    }
  };

  const handleChallengeSolved = (challengeId, points, flag) => {
    onSolve(challengeId, points);
    setShowTerminal(false);
  };

  if (viewMode === 'list') {
    return (
      <>
        <div className="bg-black border border-green-500 rounded-lg p-6 hover:border-cyan-400 transition-all group">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 flex-1">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-r from-green-600 to-cyan-600 rounded-lg flex items-center justify-center">
                  <Zap className="w-6 h-6 text-white" />
                </div>
              </div>
              
              <div className="flex-1">
                <h3 className="text-white font-bold text-lg group-hover:text-cyan-300 transition-colors">
                  {challenge.title}
                </h3>
                <p className="text-green-300 text-sm mt-1">{challenge.description}</p>
                <div className="flex items-center space-x-4 mt-2">
                  <span className={`px-3 py-1 rounded-full border text-xs font-bold ${getDifficultyColor(challenge.difficulty)}`}>
                    {challenge.difficulty.toUpperCase()}
                  </span>
                  <span className="text-yellow-400 text-sm flex items-center">
                    <Award className="w-4 h-4 mr-1" />
                    {challenge.points} POINTS
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {challenge.solved ? (
                <span className="text-green-400 font-bold text-sm bg-green-500 bg-opacity-20 px-3 py-2 rounded-lg border border-green-500">
                  SOLVED ✓
                </span>
              ) : (
                <button
                  onClick={() => setShowTerminal(true)}
                  className="bg-gradient-to-r from-green-600 to-cyan-600 text-white font-bold px-6 py-2 rounded-lg hover:from-green-700 hover:to-cyan-700 transition-all border border-cyan-400 flex items-center space-x-2 group"
                >
                  <Terminal className="w-4 h-4" />
                  <span>LAUNCH_TERMINAL</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Terminal Modal */}
        {showTerminal && (
          <CTFTerminal
            challenge={challenge}
            isOpen={showTerminal}
            onClose={() => setShowTerminal(false)}
            onChallengeSolved={handleChallengeSolved}
          />
        )}
      </>
    );
  }

  // Grid view (your existing code with terminal button added)
  return (
    <>
      <div className="bg-black border border-green-500 rounded-lg p-6 hover:border-cyan-400 transition-all group">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-green-600 to-cyan-600 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-white font-bold group-hover:text-cyan-300 transition-colors">
                {challenge.title}
              </h3>
              <p className="text-green-300 text-sm">{challenge.category}</p>
            </div>
          </div>
          <span className={`px-3 py-1 rounded-full border text-xs font-bold ${getDifficultyColor(challenge.difficulty)}`}>
            {challenge.difficulty.toUpperCase()}
          </span>
        </div>

        <p className="text-green-300 text-sm mb-4 line-clamp-2">{challenge.description}</p>

        <div className="flex items-center justify-between mb-4">
          <span className="text-yellow-400 text-sm flex items-center">
            <Award className="w-4 h-4 mr-1" />
            {challenge.points} POINTS
          </span>
          {challenge.solved && (
            <span className="text-green-400 text-sm flex items-center">
              <Flag className="w-4 h-4 mr-1" />
              SOLVED
            </span>
          )}
        </div>

        {!challenge.solved ? (
          <button
            onClick={() => setShowTerminal(true)}
            className="w-full bg-gradient-to-r from-green-600 to-cyan-600 text-white font-bold py-3 rounded-lg hover:from-green-700 hover:to-cyan-700 transition-all border border-cyan-400 flex items-center justify-center space-x-2 group"
          >
            <Terminal className="w-4 h-4" />
            <span>ACCESS_TERMINAL</span>
          </button>
        ) : (
          <button
            onClick={() => setShowTerminal(true)}
            className="w-full bg-gray-700 text-gray-300 font-bold py-3 rounded-lg border border-gray-600 flex items-center justify-center space-x-2 hover:bg-gray-600 transition-all"
          >
            <Eye className="w-4 h-4" />
            <span>VIEW_TERMINAL</span>
          </button>
        )}
      </div>

      {/* Terminal Modal */}
      {showTerminal && (
        <CTFTerminal
          challenge={challenge}
          isOpen={showTerminal}
          onClose={() => setShowTerminal(false)}
          onChallengeSolved={handleChallengeSolved}
        />
      )}
    </>
  );
};

export default ChallengeCard;