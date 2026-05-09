import React, { useState, useEffect, useCallback } from 'react';
import { teamService } from '../../services/teamService';
import { useAuth } from '../../contexts/AuthContext';

const UserTeam = () => {
  const { user } = useAuth();
  const [team, setTeam] = useState(null);
  const [teamStats, setTeamStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [createForm, setCreateForm] = useState({
    name: '',
    description: ''
  });

  const [joinForm, setJoinForm] = useState({
    teamId: ''
  });

  const [transferForm, setTransferForm] = useState({
    newCaptainId: ''
  });

  // Fetch team data
  const fetchTeamData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const teamData = await teamService.getUserTeam();
      
      if (teamData) {
        setTeam(teamData.team);
        
        // Calculate stats from team data
        const stats = {
          totalPoints: teamData.team.score || 0,
          solvedChallenges: teamData.team.solvedChallenges?.length || 0,
          totalMembers: teamData.team.members?.length || 0,
          rank: 'N/A'
        };
        setTeamStats(stats);
      } else {
        setTeam(null);
        setTeamStats(null);
      }
    } catch (err) {
      console.error('Error fetching team data:', err);
      if (err.response?.status !== 404) {
        setError(err.response?.data?.error || err.message || 'Failed to load team data. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeamData();
  }, [fetchTeamData]);

  // Team actions
  const handleCreateTeam = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      const response = await teamService.createTeam(createForm);
      setTeam(response.team);
      setShowCreateModal(false);
      setCreateForm({ name: '', description: '' });
      await fetchTeamData();
    } catch (err) {
      console.error('Error creating team:', err);
      setError(err.response?.data?.error || err.message || 'Failed to create team. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleJoinTeam = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      const response = await teamService.joinTeam(joinForm.teamId);
      setTeam(response.team);
      setShowJoinModal(false);
      setJoinForm({ teamId: '' });
      await fetchTeamData();
    } catch (err) {
      console.error('Error joining team:', err);
      setError(err.response?.data?.error || err.message || 'Failed to join team. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleLeaveTeam = async () => {
    try {
      setActionLoading(true);
      await teamService.leaveTeam(team.id || team._id);
      setTeam(null);
      setTeamStats(null);
      setShowLeaveModal(false);
      await fetchTeamData();
    } catch (err) {
      console.error('Error leaving team:', err);
      setError(err.response?.data?.error || err.message || 'Failed to leave team. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleTransferCaptaincy = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      await teamService.transferCaptaincy(team.id || team._id, transferForm.newCaptainId);
      setShowTransferModal(false);
      setTransferForm({ newCaptainId: '' });
      await fetchTeamData();
    } catch (err) {
      console.error('Error transferring captaincy:', err);
      setError(err.response?.data?.error || err.message || 'Failed to transfer captaincy. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="flex justify-center items-center h-64">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
            <div className="text-gray-600">Loading team information...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Team</h1>
            <p className="text-gray-600 mt-2">
              {team ? 'Manage your team and collaborate with members' : 'Join or create a team to collaborate with others'}
            </p>
          </div>
          <div className="flex gap-3">
            {!team ? (
              <>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors duration-200 font-medium flex items-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Create Team</span>
                </button>
                <button
                  onClick={() => setShowJoinModal(true)}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors duration-200 font-medium flex items-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  <span>Join Team</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => setShowLeaveModal(true)}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors duration-200 font-medium flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Leave Team</span>
              </button>
            )}
            <button
              onClick={fetchTeamData}
              disabled={loading}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors duration-200 font-medium flex items-center space-x-2 disabled:opacity-50"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
              <button
                onClick={() => setError(null)}
                className="text-red-500 hover:text-red-700"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Team Content */}
        {team ? (
          <TeamDashboard 
            team={team}
            teamStats={teamStats}
            currentUser={user}
            onShowTransferModal={() => setShowTransferModal(true)}
          />
        ) : (
          <NoTeamView />
        )}

        {/* Create Team Modal */}
        {showCreateModal && (
          <CreateTeamModal
            form={createForm}
            loading={actionLoading}
            onClose={() => setShowCreateModal(false)}
            onSubmit={handleCreateTeam}
            onFormChange={(updates) => setCreateForm(prev => ({ ...prev, ...updates }))}
          />
        )}

        {/* Join Team Modal */}
        {showJoinModal && (
          <JoinTeamModal
            form={joinForm}
            loading={actionLoading}
            onClose={() => setShowJoinModal(false)}
            onSubmit={handleJoinTeam}
            onFormChange={(updates) => setJoinForm(prev => ({ ...prev, ...updates }))}
          />
        )}

        {/* Leave Team Modal */}
        {showLeaveModal && (
          <LeaveTeamModal
            team={team}
            loading={actionLoading}
            onClose={() => setShowLeaveModal(false)}
            onConfirm={handleLeaveTeam}
          />
        )}

        {/* Transfer Captaincy Modal */}
        {showTransferModal && (
          <TransferCaptaincyModal
            team={team}
            form={transferForm}
            loading={actionLoading}
            onClose={() => setShowTransferModal(false)}
            onSubmit={handleTransferCaptaincy}
            onFormChange={(updates) => setTransferForm(prev => ({ ...prev, ...updates }))}
          />
        )}
      </div>
    </div>
  );
};

// No Team View Component
const NoTeamView = () => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
    <div className="text-gray-400 text-6xl mb-4">👥</div>
    <h3 className="text-2xl font-bold text-gray-900 mb-4">No Team Yet</h3>
    <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
      Join an existing team or create your own to collaborate with other CTF players. 
      Teams allow you to work together on challenges, share knowledge, and compete on the leaderboard.
    </p>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
        <div className="text-3xl mb-3">🚀</div>
        <h4 className="text-lg font-semibold text-blue-900 mb-2">Create a Team</h4>
        <p className="text-blue-700 text-sm mb-4">
          Start your own team and invite other players to join your journey.
        </p>
        <ul className="text-blue-600 text-sm text-left space-y-1 mb-4">
          <li>• Set your team name and description</li>
          <li>• Invite members to join</li>
          <li>• Compete on the team leaderboard</li>
        </ul>
      </div>
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
        <div className="text-3xl mb-3">🤝</div>
        <h4 className="text-lg font-semibold text-green-900 mb-2">Join a Team</h4>
        <p className="text-green-700 text-sm mb-4">
          Join an existing team using a team ID.
        </p>
        <ul className="text-green-600 text-sm text-left space-y-1 mb-4">
          <li>• Collaborate with experienced players</li>
          <li>• Learn from team members</li>
          <li>• Combine skills to solve challenges</li>
        </ul>
      </div>
    </div>
  </div>
);

// Team Dashboard Component
const TeamDashboard = ({ team, teamStats, currentUser, onShowTransferModal }) => {
  const isCaptain = team.captain?._id === currentUser._id;

  return (
    <div className="space-y-6">
      {/* Team Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white text-2xl font-bold">
              {team.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{team.name}</h2>
              <p className="text-gray-600 mt-1">{team.description || 'No description provided.'}</p>
              <div className="flex items-center space-x-4 mt-2">
                <span className="text-sm text-gray-500">
                  Created {team.createdAt ? new Date(team.createdAt).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </div>
          </div>
          {isCaptain && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
              👑 Team Captain
            </span>
          )}
        </div>
      </div>

      {/* Team Stats */}
      {teamStats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard value={teamStats.totalPoints || 0} label="Total Points" color="blue" />
          <StatCard value={teamStats.solvedChallenges || 0} label="Challenges Solved" color="green" />
          <StatCard value={teamStats.totalMembers || 0} label="Team Members" color="purple" />
          <StatCard value={teamStats.rank || 'N/A'} label="Team Rank" color="orange" />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Team Members */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Team Members</h3>
              <span className="text-sm text-gray-500">{team.members?.length || 0} members</span>
            </div>
            
            <div className="space-y-4">
              {team.members?.map((member) => (
                <TeamMemberCard
                  key={member._id}
                  member={member}
                  isCaptain={team.captain}
                  isCurrentUser={member._id === currentUser._id}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Team Info Sidebar */}
        <div className="space-y-6">
          {/* Team Captain */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Team Captain</h3>
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-white font-bold">
                {team.captain?.username?.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="font-medium text-gray-900">{team.captain?.username}</div>
                <div className="text-sm text-gray-500">Score: {team.captain?.score || 0}</div>
              </div>
            </div>
          </div>

          {/* Team Actions */}
          {isCaptain && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Team Management</h3>
              <div className="space-y-3">
                <button
                  onClick={onShowTransferModal}
                  className="w-full bg-yellow-500 hover:bg-yellow-600 text-white py-2 px-4 rounded-lg transition-colors duration-200 font-medium"
                >
                  Transfer Captaincy
                </button>
                <div className="text-xs text-gray-500 text-center">
                  Only team captain can manage these settings
                </div>
              </div>
            </div>
          )}

          {/* Team Info */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Team Information</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Team ID:</span>
                <span className="font-mono text-gray-900">{team._id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Members:</span>
                <span className="text-gray-900">{team.members?.length || 0}/4</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Score:</span>
                <span className="text-gray-900">{team.score || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Challenges Solved:</span>
                <span className="text-gray-900">{team.solvedChallenges?.length || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Stat Card Component
const StatCard = ({ value, label, color }) => {
  const colorClasses = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    purple: 'text-purple-600',
    orange: 'text-orange-600'
  };

  return (
    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 text-center">
      <div className={`text-2xl font-bold ${colorClasses[color]} mb-1`}>{value}</div>
      <div className="text-sm text-gray-600">{label}</div>
    </div>
  );
};

// Team Member Card Component
const TeamMemberCard = ({ member, isCaptain, isCurrentUser }) => {
  const isMemberCaptain = member._id === isCaptain?._id;

  return (
    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200">
      <div className="flex items-center space-x-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
          isMemberCaptain
            ? 'bg-gradient-to-br from-yellow-400 to-orange-500'
            : 'bg-gradient-to-br from-blue-500 to-purple-600'
        }`}>
          {member.username?.charAt(0).toUpperCase()}
        </div>
        <div>
          <div className="font-medium text-gray-900">
            {member.username}
            {isMemberCaptain && (
              <span className="ml-2 text-yellow-600 text-sm">👑 Captain</span>
            )}
            {isCurrentUser && (
              <span className="ml-2 text-blue-600 text-sm">(You)</span>
            )}
          </div>
          <div className="text-sm text-gray-500">
            Score: {member.score || 0} • Solves: {member.solvedChallenges?.length || 0}
          </div>
        </div>
      </div>
    </div>
  );
};

// Create Team Modal Component
const CreateTeamModal = ({ form, loading, onClose, onSubmit, onFormChange }) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(e);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Create New Team</h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Team Name *
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => onFormChange({ name: e.target.value })}
                required
                minLength="3"
                maxLength="50"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter team name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={form.description}
                onChange={(e) => onFormChange({ description: e.target.value })}
                rows="3"
                maxLength="200"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Describe your team's focus and goals"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-lg transition-colors duration-200 font-medium"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg transition-colors duration-200 font-medium"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Team'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Join Team Modal Component
const JoinTeamModal = ({ form, loading, onClose, onSubmit, onFormChange }) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(e);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Join a Team</h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Team ID *
              </label>
              <input
                type="text"
                value={form.teamId}
                onChange={(e) => onFormChange({ teamId: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter team ID"
              />
              <p className="text-xs text-gray-500 mt-1">
                Ask the team captain for the Team ID
              </p>
            </div>
          </div>

          <div className="flex gap-3 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-lg transition-colors duration-200 font-medium"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg transition-colors duration-200 font-medium"
              disabled={loading}
            >
              {loading ? 'Joining...' : 'Join Team'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Leave Team Modal Component
const LeaveTeamModal = ({ team, loading, onClose, onConfirm }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="p-6">
          <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          
          <h2 className="text-xl font-bold text-gray-900 text-center mb-2">
            Leave Team
          </h2>
          
          <p className="text-gray-600 text-center mb-6">
            Are you sure you want to leave <strong>{team?.name}</strong>? You will need to be invited again to rejoin.
          </p>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-yellow-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="text-sm text-yellow-700">
                If you are the team captain, you cannot leave the team. You must transfer captaincy first or disband the team.
              </span>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-lg transition-colors duration-200 font-medium"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg transition-colors duration-200 font-medium"
              disabled={loading}
            >
              {loading ? 'Leaving...' : 'Leave Team'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Transfer Captaincy Modal Component
const TransferCaptaincyModal = ({ team, form, loading, onClose, onSubmit, onFormChange }) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(e);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Transfer Captaincy</h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select New Captain *
              </label>
              <select
                value={form.newCaptainId}
                onChange={(e) => onFormChange({ newCaptainId: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select a team member</option>
                {team.members
                  ?.filter(member => member._id !== team.captain?._id)
                  .map(member => (
                    <option key={member._id} value={member._id}>
                      {member.username} (Score: {member.score || 0})
                    </option>
                  ))
                }
              </select>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <span className="text-sm text-blue-700">
                  After transferring captaincy, you will become a regular team member.
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-lg transition-colors duration-200 font-medium"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white py-2 px-4 rounded-lg transition-colors duration-200 font-medium"
              disabled={loading}
            >
              {loading ? 'Transferring...' : 'Transfer Captaincy'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserTeam;