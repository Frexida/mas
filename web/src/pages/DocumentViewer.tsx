import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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

  // sessionIdがない場合の警告表示
  if (!sessionId) {
    return (
      <div className="h-screen flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold text-gray-900">Document Viewer</h1>
            <button
              onClick={handleBack}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Back to Sessions
            </button>
          </div>
        </div>

        {/* No session warning */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="max-w-md text-center">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <svg className="mx-auto h-12 w-12 text-yellow-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h3 className="text-lg font-medium text-yellow-900 mb-2">No Session Selected</h3>
              <p className="text-sm text-yellow-700 mb-4">
                Please select a session first to view its documents.
              </p>
              <button
                onClick={() => navigate('/')}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Go to Session Selector
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 px-4 py-2 flex items-center">
        <button
          onClick={handleBack}
          className="mr-4 px-3 py-1 hover:bg-gray-100 transition-colors"
        >
          ← Back
        </button>
        <h1 className="text-lg font-medium">MAS Documentation</h1>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Tree View */}
        <div className="w-80 border-r border-gray-200 overflow-y-auto">
          <TreeView
            units={units}
            selectedAgent={selectedAgent}
            onSelectAgent={setSelectedAgent}
          />
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