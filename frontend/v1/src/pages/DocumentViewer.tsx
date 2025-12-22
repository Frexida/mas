import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
        const response = await fetch(`/api/docs/agent/${selectedAgent}`);
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
  }, [selectedAgent]);

  // ドキュメントが選択されたときに内容を取得
  const handleDocumentSelect = async (filePath: string) => {
    if (!selectedAgent) return;

    setLoading(true);
    setError(null);
    setSelectedDocument(filePath);

    try {
      const response = await fetch(`/api/docs/agent/${selectedAgent}/file/${filePath}`);
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