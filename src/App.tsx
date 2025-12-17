import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { AgentConfigurator } from './components/AgentConfigurator';
import { SessionOutputDisplay } from './components/SessionOutputDisplay';
import ApiSettings from './components/ApiSettings';
import type { RunsResponse, ErrorResponse } from './types/masApi';
import { testApiConnection } from './services/masApi';

function App() {
  const [response, setResponse] = useState<RunsResponse | ErrorResponse | null>(null);
  const [showOutput, setShowOutput] = useState(false);
  const [apiStatus, setApiStatus] = useState<{
    checking: boolean;
    connected: boolean;
    message: string;
  }>({ checking: true, connected: false, message: '' });

  useEffect(() => {
    // Test API connection on startup
    checkApiConnection();
  }, []);

  const checkApiConnection = async () => {
    setApiStatus({ checking: true, connected: false, message: '' });
    try {
      const result = await testApiConnection();
      setApiStatus({
        checking: false,
        connected: result.connected,
        message: result.message
      });
    } catch (error) {
      setApiStatus({
        checking: false,
        connected: false,
        message: 'Failed to check API connection'
      });
    }
  };

  const handleSubmitSuccess = (apiResponse: RunsResponse | ErrorResponse) => {
    setResponse(apiResponse);
    setShowOutput(true);
  };

  const handleReset = () => {
    setResponse(null);
    setShowOutput(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* API Status Banner */}
      {!apiStatus.checking && !apiStatus.connected && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-3">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <p className="text-sm text-yellow-800">
              {apiStatus.message}
            </p>
            <button
              onClick={checkApiConnection}
              className="text-sm text-yellow-700 hover:text-yellow-900 underline"
            >
              Retry Connection
            </button>
          </div>
        </div>
      )}

      <main>
        {!showOutput ? (
          <AgentConfigurator onSubmitSuccess={handleSubmitSuccess} />
        ) : (
          <SessionOutputDisplay response={response} onReset={handleReset} />
        )}
      </main>
      <ApiSettings />
    </div>
  );
}

export default App;