import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { Header } from './components/Header';
import { AgentConfigurator } from './components/AgentConfigurator';
import { SessionOutputDisplay } from './components/SessionOutputDisplay';
import { SessionSelector } from './components/SessionSelector';
import ApiSettings from './components/ApiSettings';
import DocumentViewer from './pages/DocumentViewer';
import ChatViewer from './pages/ChatViewer';
import type { RunsResponse, ErrorResponse } from './types/masApi';
import { testApiConnection } from './services/masApi';

// セッション選択ページコンポーネント
function SessionSelectorPage({ onSessionSelected }: { onSessionSelected: (session: RunsResponse) => void }) {
  const navigate = useNavigate();

  return (
    <div className="w-full h-full overflow-y-auto">
      <SessionSelector
        onSessionSelected={(session) => {
          onSessionSelected(session);
          // URLにsessionIdを含めてナビゲート
          navigate(`/session?sessionId=${session.sessionId}`);
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
          // 作成したセッションのIDをURLに含める
          if ('sessionId' in apiResponse) {
            navigate(`/session?sessionId=${apiResponse.sessionId}`);
          } else {
            navigate('/session');
          }
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
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('sessionId');

  // responseがなく、sessionIdもない場合はトップページへ
  if (!response && !sessionId) {
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
  const [showSettings, setShowSettings] = useState(false);
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
      <div className="h-screen w-full layout-full-width flex flex-col bg-mas-bg-root">
        <Header onSettingsClick={() => setShowSettings(true)} />

        {/* API Status Banner */}
        {!apiStatus.checking && !apiStatus.connected && (
          <div className="bg-mas-bg-panel border-b border-mas-border px-4 py-3 flex-shrink-0">
            <div className="w-full px-4 sm:px-6 lg:px-8 flex items-center justify-between">
              <p className="text-sm text-mas-status-warning">
                {apiStatus.message}
              </p>
              <button
                onClick={checkApiConnection}
                className="text-sm text-mas-blue hover:text-mas-blue-soft underline"
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

            {/* ドキュメントビューワーページ */}
            <Route
              path="/docs"
              element={<DocumentViewer />}
            />

            {/* チャットビューワーページ */}
            <Route
              path="/chat"
              element={<ChatViewer />}
            />

            {/* デフォルトルート */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <ApiSettings isOpen={showSettings} onClose={() => setShowSettings(false)} />
      </div>
    </Router>
  );
}

export default App;