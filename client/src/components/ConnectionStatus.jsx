import React, { useState, useEffect } from 'react';
import socketService from '../services/socket';
import apiService from '../services/api';

const ConnectionStatus = () => {
  const [socketStatus, setSocketStatus] = useState('checking');
  const [apiStatus, setApiStatus] = useState('checking');
  const [socketDetails, setSocketDetails] = useState(null);
  const [apiDetails, setApiDetails] = useState(null);

  useEffect(() => {
    // Check socket connection
    const checkSocketConnection = () => {
      const isConnected = socketService.getConnectionStatus();
      const socket = socketService.getSocket();
      
      if (socket) {
        setSocketStatus(isConnected ? 'connected' : 'disconnected');
        setSocketDetails({
          id: socket.id || 'N/A',
          connected: isConnected,
          transport: socket.io?.engine?.transport?.name || 'N/A'
        });
      } else {
        setSocketStatus('disconnected');
        setSocketDetails(null);
      }
    };

    // Check API connection
    const checkApiConnection = async () => {
      try {
        const API_BASE_URL = import.meta.env.MODE === 'production' 
          ? 'https://your-railway-backend-url.railway.app/api' 
          : 'http://localhost:5000/api';
        
        // Try a simple health check or test endpoint
        const startTime = Date.now();
        
        // Create an AbortController for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
        
        try {
          // Try to fetch a test endpoint to check if server is reachable
          const response = await fetch(`${API_BASE_URL.replace('/api', '')}/test-uploads`, {
            method: 'GET',
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          const responseTime = Date.now() - startTime;
          
          // Server is reachable if we get any response (even 404 means server is up)
          setApiStatus('connected');
          setApiDetails({
            responseTime: `${responseTime}ms`,
            status: response.ok ? 'OK' : `HTTP ${response.status}`
          });
        } catch (fetchError) {
          clearTimeout(timeoutId);
          throw fetchError;
        }
      } catch (error) {
        setApiStatus('disconnected');
        setApiDetails({
          error: error.name === 'AbortError' ? 'Connection timeout' : error.message || 'Connection failed',
          status: 'Error'
        });
      }
    };

    // Initial check
    checkSocketConnection();
    checkApiConnection();

    // Set up interval to check connection status periodically
    const interval = setInterval(() => {
      checkSocketConnection();
      checkApiConnection();
    }, 5000); // Check every 5 seconds

    // Listen to socket events for real-time updates
    const socket = socketService.getSocket();
    if (socket) {
      
      const onConnect = () => {
        setSocketStatus('connected');
        setSocketDetails({
          id: socket.id,
          connected: true,
          transport: socket.io?.engine?.transport?.name || 'N/A'
        });
      };

      const onDisconnect = () => {
        setSocketStatus('disconnected');
        setSocketDetails(null);
      };

      const onConnectError = () => {
        setSocketStatus('disconnected');
        setSocketDetails(null);
      };

      socket.on('connect', onConnect);
      socket.on('disconnect', onDisconnect);
      socket.on('connect_error', onConnectError);

      return () => {
        clearInterval(interval);
        socket.off('connect', onConnect);
        socket.off('disconnect', onDisconnect);
        socket.off('connect_error', onConnectError);
      };
    }

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'connected':
        return 'bg-green-500';
      case 'disconnected':
        return 'bg-red-500';
      case 'checking':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'connected':
        return 'Connected';
      case 'disconnected':
        return 'Disconnected';
      case 'checking':
        return 'Checking...';
      default:
        return 'Unknown';
    }
  };

  const allConnected = socketStatus === 'connected' && apiStatus === 'connected';
  const anyChecking = socketStatus === 'checking' || apiStatus === 'checking';

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-lg p-4 shadow-2xl min-w-[280px]">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white font-semibold text-sm">Connection Status</h3>
          <div className={`w-3 h-3 rounded-full ${getStatusColor(allConnected ? 'connected' : anyChecking ? 'checking' : 'disconnected')} animate-pulse`}></div>
        </div>
        
        <div className="space-y-2">
          {/* Socket Status */}
          <div className="flex items-center justify-between">
            <span className="text-gray-300 text-xs">WebSocket:</span>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${getStatusColor(socketStatus)}`}></div>
              <span className="text-white text-xs font-medium">{getStatusText(socketStatus)}</span>
            </div>
          </div>
          {socketDetails && socketStatus === 'connected' && (
            <div className="text-xs text-gray-400 ml-4">
              ID: {socketDetails.id?.substring(0, 8)}... | {socketDetails.transport}
            </div>
          )}

          {/* API Status */}
          <div className="flex items-center justify-between">
            <span className="text-gray-300 text-xs">HTTP API:</span>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${getStatusColor(apiStatus)}`}></div>
              <span className="text-white text-xs font-medium">{getStatusText(apiStatus)}</span>
            </div>
          </div>
          {apiDetails && (
            <div className="text-xs text-gray-400 ml-4">
              {apiStatus === 'connected' 
                ? `Response: ${apiDetails.responseTime}` 
                : `Error: ${apiDetails.error}`}
            </div>
          )}
        </div>

        {/* Server URL Info */}
        <div className="mt-3 pt-3 border-t border-white/10">
          <div className="text-xs text-gray-400">
            <div>Mode: {import.meta.env.MODE || 'development'}</div>
            <div className="mt-1">
              Server: {import.meta.env.MODE === 'production' 
                ? 'Production' 
                : 'http://localhost:5000'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConnectionStatus;

