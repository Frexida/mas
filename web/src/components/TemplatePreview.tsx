import React from 'react';
import type { Template } from '../types/templates';
import { generatePromptFromTemplate } from '../utils/templates';

interface TemplatePreviewProps {
  template: Template;
  onClose: () => void;
  onUse: () => void;
  variables?: {
    unitId?: number;
    agentId?: string;
    workerId?: number;
  };
}

const TemplatePreview: React.FC<TemplatePreviewProps> = ({
  template,
  onClose,
  onUse,
  variables
}) => {
  // Generate sample preview with placeholders
  const previewContent = generatePromptFromTemplate(
    template,
    variables || { unitId: 1, workerId: 1, agentId: '10' },
    true
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-mas-bg-panel border border-mas-border rounded-lg max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col">
        <div className="px-6 py-4 border-b border-mas-border">
          <h3 className="text-lg font-semibold text-mas-text">
            テンプレートプレビュー: {template.name}
          </h3>
        </div>

        <div className="px-6 py-4 flex-1 overflow-y-auto">
          <div className="bg-mas-bg-subtle rounded-md p-4">
            <pre className="whitespace-pre-wrap text-sm text-mas-text-secondary font-mono">
              {previewContent}
            </pre>
          </div>

          {variables && (
            <div className="mt-4 text-sm text-mas-text-secondary">
              <p className="font-medium mb-2">変数の説明:</p>
              <ul className="list-disc list-inside space-y-1">
                <li><code className="bg-mas-bg-subtle px-1 rounded">{'{unitId}'}</code> - ユニット番号</li>
                <li><code className="bg-mas-bg-subtle px-1 rounded">{'{workerId}'}</code> - ワーカー番号</li>
                <li><code className="bg-mas-bg-subtle px-1 rounded">{'{agentId}'}</code> - エージェントID</li>
              </ul>
              <p className="mt-2 text-xs text-mas-text-muted">
                ※実際の使用時には、これらの変数は自動的に適切な値に置換されます
              </p>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-mas-border flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-mas-text-secondary bg-mas-bg-subtle rounded-md hover:bg-mas-bg-root transition-colors"
          >
            キャンセル
          </button>
          <button
            onClick={onUse}
            className="px-4 py-2 text-sm text-mas-bg-root bg-mas-blue rounded-md hover:bg-mas-blue-soft transition-colors"
          >
            このテンプレートを使用
          </button>
        </div>
      </div>
    </div>
  );
};

export default TemplatePreview;
