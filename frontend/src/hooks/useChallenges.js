import { useState, useEffect } from 'react';
import { challengeService } from '../services/challengeService';

export const useChallenges = () => {
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchChallenges = async () => {
    try {
      setLoading(true);
      const data = await challengeService.getAllChallenges();
      setChallenges(data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch challenges');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChallenges();
  }, []);

  const refetch = () => {
    fetchChallenges();
  };

  return {
    challenges,
    loading,
    error,
    refetch
  };
};