import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { FolderOpen, X } from 'lucide-react';

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
  const [fileListOpen, setFileListOpen] = useState(false);

  // ファイルツリーを再帰的にレンダリング
  const renderFileTree = (items: DocumentFile[], level = 0, onSelect?: () => void) => {
    return items.map((item) => (
      <div key={item.path} style={{ marginLeft: `${level * 16}px` }}>
        {item.type === 'directory' ? (
          <>
            <div className="py-1.5 font-medium text-mas-text-secondary text-sm">
              {item.name}/
            </div>
            {item.children && renderFileTree(item.children, level + 1, onSelect)}
          </>
        ) : (
          <div
            className={`
              py-1.5 px-2 cursor-pointer rounded transition-colors text-sm
              ${selectedDocument === item.path
                ? 'bg-mas-blue-muted text-mas-blue'
                : 'text-mas-text-secondary hover:bg-mas-bg-subtle hover:text-mas-text'}
            `}
            onClick={() => {
              onSelectDocument(item.path);
              onSelect?.();
            }}
          >
            {item.name}
          </div>
        )}
      </div>
    ));
  };

  // ファイルリストのコンテンツ
  const FileListContent = ({ onFileSelect }: { onFileSelect?: () => void }) => (
    <>
      <div className="text-xs sm:text-sm font-medium text-mas-text-muted font-mono truncate mb-2">
        {agentId}/openspec/
      </div>
      <div className="text-sm">
        {documents.length > 0 ? (
          renderFileTree(documents, 0, onFileSelect)
        ) : (
          <div className="text-mas-text-muted">No documents found</div>
        )}
      </div>
    </>
  );

  // エージェントが選択されていない場合
  if (!agentId) {
    return (
      <div className="h-full flex items-center justify-center p-4 sm:p-8 text-mas-text-secondary text-center">
        <div>
          <div className="text-4xl mb-2 opacity-50">—</div>
          <div>Select an agent to view documentation</div>
        </div>
      </div>
    );
  }

  // ローディング状態
  if (loading && !documentContent) {
    return (
      <div className="h-full flex items-center justify-center p-4 sm:p-8 text-mas-text-secondary text-center">
        Loading...
      </div>
    );
  }

  // エラー状態（ドキュメントがない場合も含む）
  if (error && documents.length === 0) {
    return (
      <div className="h-full flex items-center justify-center p-4 sm:p-8 text-mas-text-secondary text-center">
        {error}
      </div>
    );
  }

  return (
    <div className="flex h-full relative">
      {/* Mobile File List Toggle Button */}
      {documents.length > 0 && (
        <button
          onClick={() => setFileListOpen(!fileListOpen)}
          className="md:hidden fixed bottom-4 right-4 z-20 p-3 bg-mas-blue text-mas-bg-root rounded-full shadow-lg hover:bg-mas-blue-soft transition-colors"
        >
          {fileListOpen ? <X size={20} /> : <FolderOpen size={20} />}
        </button>
      )}

      {/* Mobile overlay */}
      {fileListOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-10"
          onClick={() => setFileListOpen(false)}
        />
      )}

      {/* File List - Desktop: always visible */}
      <div className="hidden md:block w-64 border-r border-mas-border p-4 overflow-y-auto bg-mas-bg-panel flex-shrink-0">
        <FileListContent />
      </div>

      {/* File List - Mobile: slide-in from right */}
      <div className={`
        md:hidden fixed inset-y-0 right-0 z-20
        w-64 border-l border-mas-border p-3 overflow-y-auto bg-mas-bg-panel
        transform transition-transform duration-200 ease-out
        ${fileListOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs font-medium text-mas-text-muted font-mono truncate">
            {agentId}/openspec/
          </div>
          <button
            onClick={() => setFileListOpen(false)}
            className="p-1 text-mas-text-muted hover:text-mas-text"
          >
            <X size={18} />
          </button>
        </div>
        <div className="text-sm">
          {documents.length > 0 ? (
            renderFileTree(documents, 0, () => setFileListOpen(false))
          ) : (
            <div className="text-mas-text-muted">No documents found</div>
          )}
        </div>
      </div>

      {/* Document Viewer */}
      <div className="flex-1 p-4 sm:p-6 pb-20 md:pb-12 overflow-y-auto">
        {loading ? (
          <div className="text-mas-text-secondary">Loading document...</div>
        ) : documentContent ? (
          <div className="prose prose-sm max-w-none text-mas-text">
            <ReactMarkdown
              components={{
                h1: ({ children }) => (
                  <h1 className="text-xl sm:text-2xl font-bold mb-4 mt-6 border-b border-mas-border pb-2 text-mas-text">{children}</h1>
                ),
                h2: ({ children }) => (
                  <h2 className="text-lg sm:text-xl font-bold mb-3 mt-6 text-mas-text">{children}</h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-base sm:text-lg font-semibold mb-2 mt-4 text-mas-text">{children}</h3>
                ),
                h4: ({ children }) => (
                  <h4 className="text-sm sm:text-base font-semibold mb-2 mt-3 text-mas-text">{children}</h4>
                ),
                p: ({ children }) => (
                  <p className="mb-3 leading-relaxed text-mas-text-secondary text-sm sm:text-base">{children}</p>
                ),
                ul: ({ children }) => (
                  <ul className="list-disc ml-4 sm:ml-6 mb-3 space-y-1 text-mas-text-secondary text-sm sm:text-base">{children}</ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal ml-4 sm:ml-6 mb-3 space-y-1 text-mas-text-secondary text-sm sm:text-base">{children}</ol>
                ),
                li: ({ children }) => (
                  <li className="leading-relaxed">{children}</li>
                ),
                code: ({ children, ...props }) => {
                  const inline = !('className' in props && typeof props.className === 'string' && props.className.includes('language-'));
                  return inline ? (
                    <code className="bg-mas-bg-subtle px-1 py-0.5 rounded text-xs sm:text-sm font-mono text-mas-text break-all">
                      {children}
                    </code>
                  ) : (
                    <code className="block bg-mas-bg-subtle p-2 sm:p-3 rounded text-xs sm:text-sm font-mono overflow-x-auto text-mas-text">
                      {children}
                    </code>
                  );
                },
                pre: ({ children }) => (
                  <pre className="bg-mas-bg-subtle p-2 sm:p-3 rounded overflow-x-auto mb-3 text-xs sm:text-sm">{children}</pre>
                ),
                blockquote: ({ children }) => (
                  <blockquote className="border-l-4 border-mas-border pl-3 sm:pl-4 my-3 italic text-mas-text-secondary text-sm sm:text-base">
                    {children}
                  </blockquote>
                ),
                table: ({ children }) => (
                  <div className="overflow-x-auto mb-3">
                    <table className="border-collapse border border-mas-border text-sm">
                      {children}
                    </table>
                  </div>
                ),
                th: ({ children }) => (
                  <th className="border border-mas-border px-2 sm:px-3 py-1.5 sm:py-2 bg-mas-bg-subtle font-semibold text-mas-text whitespace-nowrap">
                    {children}
                  </th>
                ),
                td: ({ children }) => (
                  <td className="border border-mas-border px-2 sm:px-3 py-1.5 sm:py-2 text-mas-text-secondary">{children}</td>
                ),
              }}
            >
              {documentContent}
            </ReactMarkdown>
          </div>
        ) : selectedDocument ? (
          <div className="text-mas-text-secondary">Failed to load document</div>
        ) : (
          <div className="h-full flex items-center justify-center text-mas-text-muted">
            <div className="text-center">
              <div className="text-4xl mb-2 opacity-50">—</div>
              <div>Select a file to view</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentContent;
