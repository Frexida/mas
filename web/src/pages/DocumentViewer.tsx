import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Menu, X, ChevronRight } from 'lucide-react';
import TreeView from '../components/docs/TreeView';
import DocumentContent from '../components/docs/DocumentContent';

interface UnitStructure {
  [key: string]: {
    name: string;
    agents: Array<{ id: string; name: string }>;
  };
}

interface DocumentFile {
  name: string;
  type: 'file' | 'directory';
  path: string;
  children?: DocumentFile[];
}

const DocumentViewer: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('sessionId') || '';
  const [units, setUnits] = useState<UnitStructure>({});
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [documents, setDocuments] = useState<DocumentFile[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<string | null>(null);
  const [documentContent, setDocumentContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // ユニット構造を取得
  useEffect(() => {
    const fetchStructure = async () => {
      try {
        const response = await fetch('/api/docs/structure');
        if (!response.ok) throw new Error('Failed to fetch structure');
        const data = await response.json();
        setUnits(data);
      } catch (err) {
        setError('Failed to load unit structure');
        console.error(err);
      }
    };
    fetchStructure();
  }, []);

  // エージェントが選択されたときにドキュメント一覧を取得
  useEffect(() => {
    if (!selectedAgent) {
      setDocuments([]);
      setSelectedDocument(null);
      setDocumentContent(null);
      return;
    }

    const fetchDocuments = async () => {
      setLoading(true);
      setError(null);
      try {
        const url = sessionId
          ? `/api/docs/agent/${selectedAgent}?sessionId=${sessionId}`
          : `/api/docs/agent/${selectedAgent}`;
        const response = await fetch(url);
        if (!response.ok) {
          if (response.status === 404) {
            setDocuments([]);
            setError('No OpenSpec documents yet');
          } else {
            throw new Error('Failed to fetch documents');
          }
        } else {
          const data = await response.json();
          setDocuments(data.files || []);
        }
      } catch (err) {
        setError('Failed to load documents');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, [selectedAgent, sessionId]);

  // ドキュメントが選択されたときに内容を取得
  const handleDocumentSelect = async (filePath: string) => {
    if (!selectedAgent) return;

    setLoading(true);
    setError(null);
    setSelectedDocument(filePath);

    try {
      const url = sessionId
        ? `/api/docs/agent/${selectedAgent}/file/${filePath}?sessionId=${sessionId}`
        : `/api/docs/agent/${selectedAgent}/file/${filePath}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch document');
      const data = await response.json();
      setDocumentContent(data.content);
    } catch (err) {
      setError('Failed to load document content');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handleAgentSelect = (agentId: string | null) => {
    setSelectedAgent(agentId);
    // モバイルでエージェント選択時にサイドバーを閉じる
    setSidebarOpen(false);
  };

  // sessionIdがない場合の警告表示
  if (!sessionId) {
    return (
      <div className="h-full flex flex-col bg-mas-bg-root">
        {/* Header */}
        <div className="bg-mas-bg-panel border-b border-mas-border px-4 sm:px-6 py-3 sm:py-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <h1 className="text-xl sm:text-2xl font-semibold text-mas-text">Document viewer</h1>
            <button
              onClick={handleBack}
              className="px-3 py-1.5 sm:px-4 sm:py-2 text-sm font-medium text-mas-text-secondary bg-mas-bg-subtle border border-mas-border rounded-md hover:bg-mas-bg-panel hover:text-mas-text transition-colors"
            >
              Back
            </button>
          </div>
        </div>

        {/* No session warning */}
        <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
          <div className="max-w-md text-center">
            <div className="bg-mas-bg-panel border border-mas-border rounded-lg p-4 sm:p-6">
              <div className="mx-auto h-12 w-12 text-mas-status-warning mb-4 flex items-center justify-center text-4xl">!</div>
              <h3 className="text-lg font-medium text-mas-text mb-2">No session selected</h3>
              <p className="text-sm text-mas-text-secondary mb-4">
                Please select a session first to view its documents.
              </p>
              <button
                onClick={() => navigate('/')}
                className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-mas-bg-root bg-mas-blue hover:bg-mas-blue-soft transition-colors"
              >
                Go to session selector
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-mas-bg-root">
      {/* Header */}
      <div className="bg-mas-bg-panel border-b border-mas-border px-3 sm:px-4 py-2 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center min-w-0">
          {/* Mobile menu button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden p-2 -ml-1 mr-2 text-mas-text-secondary hover:bg-mas-bg-subtle hover:text-mas-text transition-colors rounded"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <button
            onClick={handleBack}
            className="hidden sm:block mr-4 px-3 py-1 text-mas-text-secondary hover:bg-mas-bg-subtle hover:text-mas-text transition-colors rounded"
          >
            Back
          </button>

          {/* Breadcrumb */}
          <div className="flex items-center text-sm sm:text-base min-w-0">
            <span className="font-medium text-mas-text truncate">Docs</span>
            {selectedAgent && (
              <>
                <ChevronRight size={16} className="mx-1 text-mas-text-muted flex-shrink-0" />
                <span className="text-mas-text-secondary truncate">{selectedAgent}</span>
              </>
            )}
            {selectedDocument && (
              <>
                <ChevronRight size={16} className="mx-1 text-mas-text-muted flex-shrink-0 hidden sm:block" />
                <span className="text-mas-text-muted truncate hidden sm:block">{selectedDocument.split('/').pop()}</span>
              </>
            )}
          </div>
        </div>

        {/* Mobile back button */}
        <button
          onClick={handleBack}
          className="sm:hidden px-3 py-1 text-sm text-mas-text-secondary hover:bg-mas-bg-subtle hover:text-mas-text transition-colors rounded"
        >
          Back
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="md:hidden fixed inset-0 bg-black/50 z-20"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Tree View Sidebar - Desktop: always visible, Mobile: slide-in */}
        {/* Desktop version */}
        <div className="hidden md:block w-80 border-r border-mas-border overflow-y-auto bg-mas-bg-panel flex-shrink-0">
          <TreeView
            units={units}
            selectedAgent={selectedAgent}
            onSelectAgent={setSelectedAgent}
          />
        </div>

        {/* Mobile version */}
        <div className={`
          md:hidden fixed inset-y-0 left-0 z-30
          w-72 border-r border-mas-border overflow-y-auto bg-mas-bg-panel
          transform transition-transform duration-200 ease-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <div className="pt-14">
            <TreeView
              units={units}
              selectedAgent={selectedAgent}
              onSelectAgent={handleAgentSelect}
            />
          </div>
        </div>

        {/* Document Content */}
        <div className="flex-1 overflow-y-auto">
          <DocumentContent
            agentId={selectedAgent}
            documents={documents}
            selectedDocument={selectedDocument}
            documentContent={documentContent}
            loading={loading}
            error={error}
            onSelectDocument={handleDocumentSelect}
          />
        </div>
      </div>
    </div>
  );
};

export default DocumentViewer;
