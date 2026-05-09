import React, { useState } from 'react';

const WriteupCard = ({ writeup, onEdit, onDelete, onVote, showActions = false, isOwner = false }) => {
  const [expanded, setExpanded] = useState(false);
  const [showFullContent, setShowFullContent] = useState(false);

  const truncatedContent = writeup.content.length > 200 ? 
    writeup.content.substring(0, 200) + '...' : writeup.content;

  const handleVote = (type) => {
    onVote?.(writeup._id, type);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-orange-100 text-orange-800';
      case 'expert': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 p-6 border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {writeup.title}
          </h3>
          <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <span>By {writeup.author?.username}</span>
            <span>•</span>
            <span>{formatDate(writeup.createdAt)}</span>
            {writeup.challenge && (
              <>
                <span>•</span>
                <span className="font-medium text-blue-600 dark:text-blue-400">
                  {writeup.challenge.title}
                </span>
              </>
            )}
          </div>
        </div>
        
        {showActions && isOwner && (
          <div className="flex space-x-2 ml-4">
            <button
              onClick={() => onEdit(writeup)}
              className="p-2 text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded-lg transition-colors"
              title="Edit Writeup"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              onClick={() => onDelete(writeup._id)}
              className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              title="Delete Writeup"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Tags and Difficulty */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(writeup.difficulty)}`}>
          {writeup.difficulty}
        </span>
        {writeup.tags?.map((tag, index) => (
          <span
            key={index}
            className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-full"
          >
            #{tag}
          </span>
        ))}
      </div>

      {/* Content */}
      <div className="mb-4">
        <div className="prose prose-sm dark:prose-invert max-w-none">
          {showFullContent ? (
            <div className="whitespace-pre-wrap">{writeup.content}</div>
          ) : (
            <div className="whitespace-pre-wrap">{truncatedContent}</div>
          )}
        </div>
        
        {writeup.content.length > 200 && (
          <button
            onClick={() => setShowFullContent(!showFullContent)}
            className="text-blue-500 hover:text-blue-600 text-sm font-medium mt-2"
          >
            {showFullContent ? 'Show less' : 'Read more'}
          </button>
        )}
      </div>

      {/* Stats and Actions */}
      <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
          <button
            onClick={() => handleVote('up')}
            className={`flex items-center space-x-1 transition-colors ${
              writeup.userVote === 'up' 
                ? 'text-green-500' 
                : 'hover:text-green-500'
            }`}
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            <span>{writeup.upvotes || 0}</span>
          </button>

          <button
            onClick={() => handleVote('down')}
            className={`flex items-center space-x-1 transition-colors ${
              writeup.userVote === 'down' 
                ? 'text-red-500' 
                : 'hover:text-red-500'
            }`}
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            <span>{writeup.downvotes || 0}</span>
          </button>

          <div className="flex items-center space-x-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            <span>{writeup.commentCount || 0}</span>
          </div>
        </div>

        {!writeup.isPublic && (
          <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded-full">
            Private
          </span>
        )}
      </div>
    </div>
  );
};

export default WriteupCard;