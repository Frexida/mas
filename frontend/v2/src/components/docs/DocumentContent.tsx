import React from 'react';
import ReactMarkdown from 'react-markdown';

interface DocumentFile {
  name: string;
  type: 'file' | 'directory';
  path: string;
  children?: DocumentFile[];
}

interface DocumentContentProps {
  agentId: string | null;
  documents: DocumentFile[];
  selectedDocument: string | null;
  documentContent: string | null;
  loading: boolean;
  error: string | null;
  onSelectDocument: (filePath: string) => void;
}

const DocumentContent: React.FC<DocumentContentProps> = ({
  agentId,
  documents,
  selectedDocument,
  documentContent,
  loading,
  error,
  onSelectDocument,
}) => {
  // ファイルツリーを再帰的にレンダリング
  const renderFileTree = (items: DocumentFile[], level = 0) => {
    return items.map((item) => (
      <div key={item.path} style={{ marginLeft: `${level * 20}px` }}>
        {item.type === 'directory' ? (
          <>
            <div className="py-1 font-medium text-gray-700">
              📁 {item.name}/
            </div>
            {item.children && renderFileTree(item.children, level + 1)}
          </>
        ) : (
          <div
            className={`
              py-1 cursor-pointer hover:bg-gray-50
              ${selectedDocument === item.path ? 'bg-gray-100' : ''}
            `}
            onClick={() => onSelectDocument(item.path)}
          >
            📄 {item.name}
          </div>
        )}
      </div>
    ));
  };

  // エージェントが選択されていない場合
  if (!agentId) {
    return (
      <div className="p-8 text-gray-500 text-center">
        Select an agent to view documentation
      </div>
    );
  }

  // ローディング状態
  if (loading && !documentContent) {
    return (
      <div className="p-8 text-gray-500 text-center">
        Loading...
      </div>
    );
  }

  // エラー状態（ドキュメントがない場合も含む）
  if (error && documents.length === 0) {
    return (
      <div className="p-8 text-gray-500 text-center">
        {error}
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* File List */}
      <div className="w-64 border-r border-gray-200 p-4 overflow-y-auto">
        <div className="text-sm font-medium text-gray-600 mb-2">
          unit/{agentId}/openspec/
        </div>
        <div className="text-sm">
          {documents.length > 0 ? (
            renderFileTree(documents)
          ) : (
            <div className="text-gray-400">No documents found</div>
          )}
        </div>
      </div>

      {/* Document Viewer */}
      <div className="flex-1 p-6 overflow-y-auto">
        {loading ? (
          <div className="text-gray-500">Loading document...</div>
        ) : documentContent ? (
          <div className="prose prose-sm max-w-none">
            <ReactMarkdown
              components={{
                // シンプルなスタイリング
                h1: ({ children }) => (
                  <h1 className="text-2xl font-bold mb-4 mt-6 border-b pb-2">{children}</h1>
                ),
                h2: ({ children }) => (
                  <h2 className="text-xl font-bold mb-3 mt-6">{children}</h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-lg font-semibold mb-2 mt-4">{children}</h3>
                ),
                h4: ({ children }) => (
                  <h4 className="text-base font-semibold mb-2 mt-3">{children}</h4>
                ),
                p: ({ children }) => (
                  <p className="mb-3 leading-relaxed">{children}</p>
                ),
                ul: ({ children }) => (
                  <ul className="list-disc ml-6 mb-3 space-y-1">{children}</ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal ml-6 mb-3 space-y-1">{children}</ol>
                ),
                li: ({ children }) => (
                  <li className="leading-relaxed">{children}</li>
                ),
                code: ({ children, ...props }) => {
                  const inline = !('className' in props && typeof props.className === 'string' && props.className.includes('language-'));
                  return inline ? (
                    <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">
                      {children}
                    </code>
                  ) : (
                    <code className="block bg-gray-100 p-3 rounded text-sm font-mono overflow-x-auto">
                      {children}
                    </code>
                  );
                },
                pre: ({ children }) => (
                  <pre className="bg-gray-100 p-3 rounded overflow-x-auto mb-3">{children}</pre>
                ),
                blockquote: ({ children }) => (
                  <blockquote className="border-l-4 border-gray-300 pl-4 my-3 italic">
                    {children}
                  </blockquote>
                ),
                table: ({ children }) => (
                  <table className="border-collapse border border-gray-300 mb-3">
                    {children}
                  </table>
                ),
                th: ({ children }) => (
                  <th className="border border-gray-300 px-3 py-2 bg-gray-50 font-semibold">
                    {children}
                  </th>
                ),
                td: ({ children }) => (
                  <td className="border border-gray-300 px-3 py-2">{children}</td>
                ),
              }}
            >
              {documentContent}
            </ReactMarkdown>
          </div>
        ) : selectedDocument ? (
          <div className="text-gray-500">Failed to load document</div>
        ) : (
          <div className="text-gray-400">Select a file to view</div>
        )}
      </div>
    </div>
  );
};

export default DocumentContent;