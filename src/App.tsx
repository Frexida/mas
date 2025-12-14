import { useState } from 'react';
import { Header } from './components/Header';
import { AgentConfigurator } from './components/AgentConfigurator';
import { OutputDisplay } from './components/OutputDisplay';
import type { ApiResponse } from './types/agent.ts';

function App() {
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [showOutput, setShowOutput] = useState(false);

  const handleSubmitSuccess = (apiResponse: ApiResponse) => {
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
      <main>
        {!showOutput ? (
          <AgentConfigurator onSubmitSuccess={handleSubmitSuccess} />
        ) : (
          <OutputDisplay response={response} onReset={handleReset} />
        )}
      </main>
    </div>
  );
}

export default App;