import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Header } from './components/Header';
import { AgentConfigurator } from './components/AgentConfigurator';
import { SessionOutputDisplay } from './components/SessionOutputDisplay';
import { SessionSelector } from './components/SessionSelector';
import ApiSettings from './components/ApiSettings';
import type { RunsResponse, ErrorResponse } from './types/masApi';
import { testApiConnection } from './services/masApi';

// セッション選択ページコンポーネント
function SessionSelectorPage({ onSessionSelected }: { onSessionSelected: (session: RunsResponse) => void }) {
  const navigate = useNavigate();

  return (
    <div className="w-full h-full">
      <SessionSelector
        onSessionSelected={(session) => {
          onSessionSelected(session);
          navigate('/session');
        }}
        onCreateNew={() => {
          navigate('/create-session');
        }}
      />
    </div>
  );
}

// セッション作成ページコンポーネント
function CreateSessionPage({ onSubmitSuccess }: { onSubmitSuccess: (response: RunsResponse | ErrorResponse) => void }) {
  const navigate = useNavigate();

  return (
    <div className="w-full h-full overflow-y-auto">
      <AgentConfigurator
        onSubmitSuccess={(apiResponse) => {
          onSubmitSuccess(apiResponse);
          navigate('/session');
        }}
        onBack={() => {
          navigate('/');
        }}
      />
    </div>
  );
}

// セッション表示ページコンポーネント
function SessionPage({ response, onReset }: { response: RunsResponse | ErrorResponse | null; onReset: () => void }) {
  const navigate = useNavigate();

  if (!response) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="w-full h-full">
      <SessionOutputDisplay
        response={response}
        onReset={() => {
          onReset();
          navigate('/');
        }}
      />
    </div>
  );
}

function App() {
  const [response, setResponse] = useState<RunsResponse | ErrorResponse | null>(null);
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

  const handleSessionSelected = (session: RunsResponse) => {
    setResponse(session);
  };

  const handleSubmitSuccess = (apiResponse: RunsResponse | ErrorResponse) => {
    setResponse(apiResponse);
  };

  const handleReset = () => {
    setResponse(null);
  };

  return (
    <Router>
      <div className="h-screen flex flex-col bg-gray-50">
        <Header />

        {/* API Status Banner */}
        {!apiStatus.checking && !apiStatus.connected && (
          <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-3 flex-shrink-0">
            <div className="w-full px-4 sm:px-6 lg:px-8 flex items-center justify-between">
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

        <main className="flex-grow overflow-hidden">
          <Routes>
            {/* メインページ - セッション選択 */}
            <Route
              path="/"
              element={<SessionSelectorPage onSessionSelected={handleSessionSelected} />}
            />

            {/* セッション作成ページ */}
            <Route
              path="/create-session"
              element={<CreateSessionPage onSubmitSuccess={handleSubmitSuccess} />}
            />

            {/* セッション出力表示ページ */}
            <Route
              path="/session"
              element={<SessionPage response={response} onReset={handleReset} />}
            />

            {/* デフォルトルート */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <ApiSettings />
      </div>
    </Router>
  );
}

export default App;