import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);

  useEffect(() => {
    // Only connect if we have a valid URL
    const socketUrl = import.meta.env.VITE_SOCKET_URL;
    
    if (!socketUrl || socketUrl === 'http://localhost:3000') {
      console.log('Socket URL not configured, skipping connection');
      setConnectionError('Socket server not configured');
      return;
    }

    try {
      const newSocket = io(socketUrl, {
        withCredentials: true,
        autoConnect: true,
        timeout: 5000,
        reconnectionAttempts: 3
      });

      setSocket(newSocket);

      newSocket.on('connect', () => {
        setIsConnected(true);
        setConnectionError(null);
        console.log('Connected to server');
      });

      newSocket.on('disconnect', () => {
        setIsConnected(false);
        console.log('Disconnected from server');
      });

      newSocket.on('connect_error', (error) => {
        setIsConnected(false);
        setConnectionError(error.message);
        console.error('Socket connection error:', error);
      });

      return () => {
        newSocket.close();
      };
    } catch (error) {
      console.error('Failed to initialize socket:', error);
      setConnectionError('Failed to initialize socket connection');
    }
  }, []);

  const value = {
    socket,
    isConnected,
    connectionError,
    emit: (event, data) => {
      if (socket && isConnected) {
        socket.emit(event, data);
      } else {
        console.warn('Socket not connected, cannot emit:', event);
      }
    },
    on: (event, callback) => {
      if (socket) {
        socket.on(event, callback);
        return () => socket.off(event, callback);
      }
      return () => {};
    },
    off: (event, callback) => {
      if (socket) {
        socket.off(event, callback);
      }
    }
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketContext;