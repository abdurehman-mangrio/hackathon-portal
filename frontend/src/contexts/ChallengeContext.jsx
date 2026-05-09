// src/contexts/ChallengeContext.jsx
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { challengeService } from '../services/challengeService';
import { useAuth } from './AuthContext';

const ChallengeContext = createContext();

const challengeReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_CHALLENGES':
      return { ...state, challenges: action.payload, loading: false };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'UPDATE_CHALLENGE':
      return {
        ...state,
        challenges: state.challenges.map(challenge =>
          challenge._id === action.payload._id ? action.payload : challenge
        )
      };
    case 'ADD_CHALLENGE':
      return {
        ...state,
        challenges: [...state.challenges, action.payload]
      };
    case 'DELETE_CHALLENGE':
      return {
        ...state,
        challenges: state.challenges.filter(challenge => challenge._id !== action.payload)
      };
    default:
      return state;
  }
};

const initialState = {
  challenges: [],
  loading: false,
  error: null
};

export const useChallenge = () => {
  const context = useContext(ChallengeContext);
  if (!context) {
    throw new Error('useChallenge must be used within a ChallengeProvider');
  }
  return context;
};

export const ChallengeProvider = ({ children }) => {
  const [state, dispatch] = useReducer(challengeReducer, initialState);
  const { user, loading: authLoading } = useAuth();

  const fetchChallenges = async () => {
    // Don't fetch if user is not authenticated or not admin
    if (!user || user.role !== 'admin') {
      return;
    }

    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const challenges = await challengeService.getAllChallenges();
      dispatch({ type: 'SET_CHALLENGES', payload: challenges });
    } catch (error) {
      // Don't set error for 401 - it's handled by the interceptor
      if (error.response?.status !== 401) {
        dispatch({ type: 'SET_ERROR', payload: error.message });
      }
    }
  };

  const updateChallenge = (challengeId, updates) => {
    dispatch({ type: 'UPDATE_CHALLENGE', payload: { ...updates, _id: challengeId } });
  };

  const addChallenge = (challenge) => {
    dispatch({ type: 'ADD_CHALLENGE', payload: challenge });
  };

  const deleteChallenge = (challengeId) => {
    dispatch({ type: 'DELETE_CHALLENGE', payload: challengeId });
  };

  // Only fetch challenges when user is authenticated and is admin
  useEffect(() => {
    if (!authLoading && user && user.role === 'admin') {
      fetchChallenges();
    }
  }, [user, authLoading]);

  const value = {
    ...state,
    fetchChallenges,
    updateChallenge,
    addChallenge,
    deleteChallenge
  };

  return (
    <ChallengeContext.Provider value={value}>
      {children}
    </ChallengeContext.Provider>
  );
};

export default ChallengeContext;