import React, { useState } from 'react';
import { Send, Terminal, CheckCircle, AlertCircle, FileText, ChevronDown } from 'lucide-react';
import { sendMessage } from '../services/masApi';
import type { MessageRequest } from '../types/masApi';

interface MessageSenderProps {
  tmuxSession: string;
}

// プロンプトテンプレート定義
const promptTemplates = {
  metaManager: {
    taskDistribution: {
      name: "タスク分配（各エージェントへ）",
      template: `【タスク分配指示】
このメッセージは各エージェントに割り振ってください。

【要求事項】
1. 各ユニットマネージャーに適切にタスクを分配
2. 明確な成果物と期限を設定
3. 実行後、進捗報告を収集

【期待する成果】
- 全ユニットからの完了報告
- 統合された成果物の提出

指示を出して報告までさせてください。`,
    },
    criticalReview: {
      name: "批判的レビュー要求",
      template: `【批判的評価要求】

提出された提案/成果物について以下の観点で徹底的に評価せよ：

1. 論理的整合性の検証
2. 隠れたリスクの特定
3. コスト見積もりの妥当性検証
4. 代替案との比較
5. 最悪シナリオの分析

甘い評価は許さない。プロとして恥ずかしくない評価を行え。`,
    },
    proposalReject: {
      name: "提案否決テンプレート",
      template: `【評価結果】否決

【致命的欠陥】
1. [具体的な問題点を記入]
2. [論理的矛盾を指摘]
3. [見落とし項目を列挙]

【改善要求】
- [必須改善項目を明記]
- 期限: [具体的な期限]

【再考すべき前提】
- [疑うべき前提条件を指摘]

提案を根本から見直せ。小手先の修正では承認しない。`,
    },
    emergencyMeeting: {
      name: "緊急会議召集",
      template: `【緊急会議通知】

全ユニットマネージャーは即座に応答せよ。

【議題】
[緊急議題を記入]

【要求事項】
1. 各ユニットの現状報告
2. 影響評価
3. 対応策の提案

5分以内に初期報告を提出せよ。`,
    },
  },
  unitManager: {
    workerAssignment: {
      name: "ワーカーへのタスク割当",
      template: `【作業指示】

対象ワーカー: [11/12/13/21/22/23/31/32/33]

【タスク内容】
[具体的なタスク]

【成果物】
- [期待される成果物]

【期限】
[明確な期限]

【品質基準】
- [具体的な品質基準]

作業開始時と完了時に報告すること。`,
    },
    progressReport: {
      name: "進捗報告テンプレート",
      template: `【進捗報告】

ユニット: [ユニット名]
報告者: Unit [番号]

【完了タスク】
- [完了項目]

【進行中タスク】
- [タスク名]: 進捗[XX]%

【課題・リスク】
- [識別された課題]

【次のアクション】
- [予定されているアクション]

【必要なサポート】
- [他ユニットからの支援要請]`,
    },
    proposalSubmit: {
      name: "提案書提出",
      template: `/openspec:proposal [提案タイトル]

## 背景
[なぜこの提案が必要か]

## 提案内容
[具体的な提案]

## 期待効果
- [定量的効果]
- [定性的効果]

## リスクと対策
- リスク: [想定リスク]
  対策: [リスク軽減策]

## コスト見積もり
- 人的リソース: [人日]
- その他コスト: [金額]

## 代替案
1. [代替案1]
2. [代替案2]

## 実装計画
1. [フェーズ1]
2. [フェーズ2]`,
    },
  },
  worker: {
    taskAcceptance: {
      name: "タスク受領確認",
      template: `【タスク受領】

Unit [番号]がタスクを受領しました。

【理解した内容】
- [タスク内容の要約]

【予定工数】
- [見積もり時間]

【開始予定】
- [開始時刻/日付]

作業を開始します。`,
    },
    issueReport: {
      name: "問題報告",
      template: `【問題報告】

Unit [番号]から緊急報告

【発生した問題】
[問題の詳細]

【影響範囲】
- [影響を受ける部分]

【原因分析】
- [推定原因]

【提案する対策】
1. [対策案1]
2. [対策案2]

【必要な判断】
- [マネージャーに求める判断]

至急対応をお願いします。`,
    },
    completionReport: {
      name: "作業完了報告",
      template: `【作業完了報告】

Unit [番号]の作業が完了しました。

【完了したタスク】
[タスク名]

【成果物】
- [成果物の場所/内容]

【作業時間】
- 予定: [予定時間]
- 実績: [実際の時間]

【特記事項】
- [気づいた点]
- [改善提案]

【次のタスク】
待機中 / [次のタスク名]

レビューをお願いします。`,
    },
  },
  general: {
    openspecProposal: {
      name: "OpenSpec提案（汎用）",
      template: `/openspec:proposal [提案タイトル]

[提案の詳細をここに記入]

このコマンドで提案書が自動生成されます。`,
    },
    requestInfo: {
      name: "情報要求",
      template: `【情報要求】

以下の情報を提供してください：

1. [要求項目1]
2. [要求項目2]
3. [要求項目3]

【用途】
[なぜこの情報が必要か]

【期限】
[いつまでに必要か]`,
    },
    collaboration: {
      name: "協力要請",
      template: `【協力要請】

From: Unit [送信元]
To: Unit [宛先]

【協力を求める内容】
[具体的な協力内容]

【理由】
[なぜ協力が必要か]

【期待する成果】
[協力により得られる成果]

【タイムライン】
[いつまでに必要か]

ご協力をお願いします。`,
    },
  },
};

export const MessageSenderWithTemplates: React.FC<MessageSenderProps> = ({ tmuxSession }) => {
  const [target, setTarget] = useState<string>('all');
  const [message, setMessage] = useState<string>('');
  const [execute, setExecute] = useState<boolean>(true);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [showTemplates, setShowTemplates] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [result, setResult] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const targetOptions = [
    { value: 'all', label: 'All Agents' },
    { value: 'managers', label: 'All Managers (00, 10, 20, 30)' },
    { value: 'agent-00', label: 'Meta Manager (00)' },
    { value: 'agent-10', label: 'Design Manager (10)' },
    { value: 'agent-11', label: 'UI Designer (11)' },
    { value: 'agent-12', label: 'UX Designer (12)' },
    { value: 'agent-13', label: 'Visual Designer (13)' },
    { value: 'agent-20', label: 'Dev Manager (20)' },
    { value: 'agent-21', label: 'Frontend Dev (21)' },
    { value: 'agent-22', label: 'Backend Dev (22)' },
    { value: 'agent-23', label: 'DevOps (23)' },
    { value: 'agent-30', label: 'Business Manager (30)' },
    { value: 'agent-31', label: 'Accounting (31)' },
    { value: 'agent-32', label: 'Strategy (32)' },
    { value: 'agent-33', label: 'Analysis (33)' },
    { value: 'custom', label: 'Custom Target' },
  ];

  const applyTemplate = (template: string) => {
    setMessage(template);
    setShowTemplates(false);
    setSelectedCategory('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim()) {
      setResult({
        type: 'error',
        message: 'メッセージを入力してください'
      });
      return;
    }

    setIsSending(true);
    setResult(null);

    const request: MessageRequest = {
      target,
      message,
      execute,
      session: tmuxSession
    };

    try {
      const response = await sendMessage(request);
      setResult({
        type: 'success',
        message: `メッセージを${response.target}に送信しました (${new Date(response.timestamp).toLocaleTimeString()})`
      });
      setMessage('');
    } catch (error) {
      setResult({
        type: 'error',
        message: error instanceof Error ? error.message : 'メッセージの送信に失敗しました'
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Terminal className="text-blue-600" size={24} />
          <h3 className="text-lg font-semibold text-gray-800">
            メッセージ送信: {tmuxSession}
          </h3>
        </div>
        <button
          onClick={() => setShowTemplates(!showTemplates)}
          className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
        >
          <FileText size={18} />
          <span>テンプレート</span>
          <ChevronDown
            size={16}
            className={`transform transition-transform ${showTemplates ? 'rotate-180' : ''}`}
          />
        </button>
      </div>

      {showTemplates && (
        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-semibold mb-3 text-gray-800">プロンプトテンプレート</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h5 className="font-medium text-sm text-gray-600 mb-2">カテゴリ選択</h5>
              <div className="space-y-2">
                <button
                  onClick={() => setSelectedCategory('metaManager')}
                  className={`w-full text-left px-3 py-2 rounded ${
                    selectedCategory === 'metaManager'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-white hover:bg-gray-100'
                  }`}
                >
                  メタマネージャー用
                </button>
                <button
                  onClick={() => setSelectedCategory('unitManager')}
                  className={`w-full text-left px-3 py-2 rounded ${
                    selectedCategory === 'unitManager'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-white hover:bg-gray-100'
                  }`}
                >
                  ユニットマネージャー用
                </button>
                <button
                  onClick={() => setSelectedCategory('worker')}
                  className={`w-full text-left px-3 py-2 rounded ${
                    selectedCategory === 'worker'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-white hover:bg-gray-100'
                  }`}
                >
                  ワーカー用
                </button>
                <button
                  onClick={() => setSelectedCategory('general')}
                  className={`w-full text-left px-3 py-2 rounded ${
                    selectedCategory === 'general'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-white hover:bg-gray-100'
                  }`}
                >
                  汎用
                </button>
              </div>
            </div>
            <div>
              {selectedCategory && (
                <>
                  <h5 className="font-medium text-sm text-gray-600 mb-2">テンプレート選択</h5>
                  <div className="space-y-2">
                    {Object.entries(promptTemplates[selectedCategory as keyof typeof promptTemplates]).map(
                      ([key, template]) => (
                        <button
                          key={key}
                          onClick={() => applyTemplate(template.template)}
                          className="w-full text-left px-3 py-2 bg-white hover:bg-blue-50 rounded border border-gray-200"
                        >
                          {template.name}
                        </button>
                      )
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            送信先
          </label>
          {target === 'custom' ? (
            <input
              type="text"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="カスタムターゲットを入力 (例: agent-14)"
            />
          ) : (
            <select
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {targetOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            メッセージ
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            rows={8}
            placeholder="メッセージまたはコマンドを入力..."
          />
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="execute"
            checked={execute}
            onChange={(e) => setExecute(e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="execute" className="text-sm text-gray-700">
            コマンドとして実行（メッセージ送信後にEnterキーを送信）
          </label>
        </div>

        {result && (
          <div
            className={`p-3 rounded-md flex items-start space-x-2 ${
              result.type === 'success'
                ? 'bg-green-50 text-green-800'
                : 'bg-red-50 text-red-800'
            }`}
          >
            {result.type === 'success' ? (
              <CheckCircle className="mt-0.5" size={18} />
            ) : (
              <AlertCircle className="mt-0.5" size={18} />
            )}
            <span className="text-sm">{result.message}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={isSending}
          className={`w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-md transition-colors ${
            isSending
              ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          <Send size={18} />
          <span>{isSending ? '送信中...' : 'メッセージを送信'}</span>
        </button>
      </form>
    </div>
  );
};