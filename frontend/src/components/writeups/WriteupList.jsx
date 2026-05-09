import React, { useState } from 'react';
import WriteupCard from './WriteupCard';

const WriteupList = ({ 
  writeups, 
  onEdit, 
  onDelete, 
  onVote,
  showFilters = true,
  showActions = false 
}) => {
  const [filters, setFilters] = useState({
    search: '',
    difficulty: '',
    sortBy: 'newest'
  });

  const filteredWriteups = writeups
    .filter(writeup => {
      const matchesSearch = !filters.search || 
        writeup.title.toLowerCase().includes(filters.search.toLowerCase()) ||
        writeup.content.toLowerCase().includes(filters.search.toLowerCase()) ||
        writeup.tags?.some(tag => tag.toLowerCase().includes(filters.search.toLowerCase()));
      
      const matchesDifficulty = !filters.difficulty || writeup.difficulty === filters.difficulty;
      
      return matchesSearch && matchesDifficulty;
    })
    .sort((a, b) => {
      switch (filters.sortBy) {
        case 'newest':
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'oldest':
          return new Date(a.createdAt) - new Date(b.createdAt);
        case 'upvotes':
          return (b.upvotes || 0) - (a.upvotes || 0);
        case 'difficulty':
          const difficultyOrder = { 'easy': 1, 'medium': 2, 'hard': 3, 'expert': 4 };
          return difficultyOrder[b.difficulty] - difficultyOrder[a.difficulty];
        default:
          return 0;
      }
    });

  return (
    <div>
      {/* Filters */}
      {showFilters && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-6 border border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Search
              </label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                placeholder="Search writeups..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Difficulty
              </label>
              <select
                value={filters.difficulty}
                onChange={(e) => setFilters(prev => ({ ...prev, difficulty: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              >
                <option value="">All Difficulties</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
                <option value="expert">Expert</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Sort By
              </label>
              <select
                value={filters.sortBy}
                onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="upvotes">Most Upvoted</option>
                <option value="difficulty">Difficulty</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => setFilters({ search: '', difficulty: '', sortBy: 'newest' })}
                className="w-full px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors text-sm font-medium"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Writeups List */}
      <div className="space-y-6">
        {filteredWriteups.length > 0 ? (
          filteredWriteups.map(writeup => (
            <WriteupCard
              key={writeup._id}
              writeup={writeup}
              onEdit={onEdit}
              onDelete={onDelete}
              onVote={onVote}
              showActions={showActions}
              isOwner={writeup.isOwner}
            />
          ))
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-400 dark:text-gray-500 text-6xl mb-4">📝</div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No writeups found
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              {writeups.length === 0 
                ? "No writeups have been submitted yet." 
                : "No writeups match your current filters."
              }
            </p>
          </div>
        )}
      </div>

      {/* Results Count */}
      {filteredWriteups.length > 0 && (
        <div className="mt-6 text-sm text-gray-600 dark:text-gray-400">
          Showing {filteredWriteups.length} of {writeups.length} writeups
        </div>
      )}
    </div>
  );
};

export default WriteupList;