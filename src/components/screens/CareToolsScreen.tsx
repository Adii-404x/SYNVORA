import React, { FormEvent, useEffect, useState } from 'react';
import { api, Conversation, ConversationMessage, EvidenceSource, GroundedText } from '../../services/api';

type Mode = 'copilot' | 'summary';

async function openSource(source: EvidenceSource) {
  const popup = window.open('about:blank', '_blank');
  if (!popup) throw new Error('Allow pop-ups to open this private source document.');
  popup.opener = null;
  try {
    const { url } = await api.getDocumentUrl(source.documentId);
    popup.location.replace(url);
  } catch (error) {
    popup.close();
    throw error;
  }
}

function Sources({ sources, onError }: { sources: EvidenceSource[]; onError: (message: string) => void }) {
  const [opening, setOpening] = useState<string | null>(null);

  async function handleOpen(source: EvidenceSource) {
    setOpening(source.factId);
    try {
      await openSource(source);
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Source document could not be opened.');
    } finally {
      setOpening(null);
    }
  }

  if (!sources.length) return <p className="text-xs text-slate-500">No source records were returned.</p>;
  return (
    <ul className="mt-3 space-y-2">
      {sources.map((source) => (
        <li key={source.factId} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm font-semibold text-slate-800">{source.fileName}{source.pageNumber ? ` · page ${source.pageNumber}` : ''}</span>
            <button type="button" disabled={opening === source.factId} onClick={() => void handleOpen(source)} className="min-h-9 rounded-md border border-slate-300 px-3 text-xs font-semibold text-teal-900 hover:bg-white disabled:opacity-50">
              {opening === source.factId ? 'Opening…' : 'Open source'}
            </button>
          </div>
          <blockquote className="mt-2 border-l-2 border-teal-700 pl-3 text-sm leading-relaxed text-slate-700">{source.evidence}</blockquote>
        </li>
      ))}
    </ul>
  );
}

export const CareToolsScreen: React.FC<{ mode: Mode }> = ({ mode }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [conversationId, setConversationId] = useState('');
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [question, setQuestion] = useState('');
  const [summary, setSummary] = useState<GroundedText | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (mode !== 'copilot') return;
    let active = true;
    void api.getConversations().then(async (items) => {
      if (!active) return;
      setConversations(items);
      if (items[0]) {
        setConversationId(items[0].id);
        const history = await api.getConversationMessages(items[0].id);
        if (active) setMessages(history.filter((item) => item.role !== 'system'));
      }
    }).catch((cause: unknown) => {
      if (active) setError(cause instanceof Error ? cause.message : 'Conversation history could not be loaded.');
    });
    return () => { active = false; };
  }, [mode]);

  async function handleAsk(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = question.trim();
    if (!text || busy) return;
    setBusy(true);
    setError('');
    setQuestion('');
    const localUserMessage = {
      id: `local-${Date.now()}`,
      role: 'user' as const,
      content: text,
      citations: [],
      created_at: new Date().toISOString(),
    };
    setMessages((current) => [...current, localUserMessage]);
    try {
      const result = await api.askCopilot(text, conversationId || undefined);
      const id = result.conversationId || conversationId;
      setConversationId(id);
      setMessages((current) => [...current, {
        id: `local-answer-${Date.now()}`,
        role: 'assistant',
        content: result.answer || '',
        citations: result.sources || [],
        uncertainty: result.uncertainty,
        created_at: new Date().toISOString(),
      }]);
      if (id && !conversations.some((item) => item.id === id)) {
        const updated = await api.getConversations();
        setConversations(updated);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The copilot could not answer right now.');
      setMessages((current) => current.filter((item) => item.id !== localUserMessage.id));
      setQuestion(text);
    } finally {
      setBusy(false);
    }
  }

  async function selectConversation(id: string) {
    setConversationId(id);
    setError('');
    setBusy(true);
    try {
      const history = await api.getConversationMessages(id);
      setMessages(history.filter((item) => item.role !== 'system'));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Conversation could not be loaded.');
    } finally {
      setBusy(false);
    }
  }

  function startConversation() {
    setConversationId('');
    setMessages([]);
    setError('');
  }

  async function handleSummary() {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      setSummary(await api.generateSummary());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Summary generation is unavailable.');
    } finally {
      setBusy(false);
    }
  }

  async function handleExport() {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const blob = await api.exportFhir();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'altrix-health-records-fhir-r4.json';
      link.click();
      URL.revokeObjectURL(url);
      setNotice('FHIR R4 bundle downloaded from verified records.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'FHIR export is unavailable.');
    } finally {
      setBusy(false);
    }
  }

  function downloadSummary() {
    if (!summary) return;
    const sources = (summary.sources || []).map((source) =>
      `- ${source.fileName}${source.pageNumber ? ` (page ${source.pageNumber})` : ''}: ${source.evidence}`,
    );
    const content = [
      'AI-GENERATED HEALTH SUMMARY - FOR CLINICIAN REVIEW',
      '',
      summary.summary || summary.answer || '',
      '',
      'Source records:',
      ...(sources.length ? sources : ['- No source records were returned.']),
      '',
      'This is informational support, not a diagnosis or treatment instruction.',
    ].join('\n');
    const url = URL.createObjectURL(new Blob([content], { type: 'text/plain;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'altrix-clinician-review-summary.txt';
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <section className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 space-y-5">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">{mode === 'copilot' ? 'Health copilot' : 'Care summary'}</h1>
        <p className="mt-1 text-sm text-slate-600">{mode === 'copilot' ? 'Answers use your verified, source-linked records only.' : 'A concise AI-generated draft from verified records, for your clinician to review.'}</p>
      </header>

      {error && <div role="alert" className="rounded-lg border border-rose-300 bg-rose-50 p-3 text-sm text-rose-900">{error}</div>}
      {notice && <div role="status" className="rounded-lg border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-900">{notice}</div>}

      {mode === 'copilot' ? (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <label className="sr-only" htmlFor="conversationSelect">Conversation history</label>
            <select id="conversationSelect" value={conversationId} onChange={(event) => void selectConversation(event.target.value)} className="min-h-10 min-w-0 flex-1 rounded-md border border-slate-300 bg-white px-3 text-sm" disabled={busy}>
              <option value="">New conversation</option>
              {conversations.map((item) => <option key={item.id} value={item.id}>{item.title || new Date(item.updated_at).toLocaleString()}</option>)}
            </select>
            <button type="button" onClick={startConversation} disabled={busy} className="min-h-10 rounded-md border border-slate-300 px-3 text-sm font-medium text-slate-700">New chat</button>
          </div>
          <div aria-live="polite" className="min-h-48 space-y-4 rounded-xl border border-slate-200 bg-white p-4">
            {messages.length === 0 && <p className="py-10 text-center text-sm text-slate-500">Ask a question about your reviewed health records. If there is not enough evidence, the copilot will say so.</p>}
            {messages.map((message) => (
              <article key={message.id} className={`max-w-[92%] ${message.role === 'user' ? 'ml-auto rounded-lg bg-teal-50 p-3' : 'rounded-lg bg-slate-50 p-3'}`}>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-800">{message.content}</p>
                {message.role === 'assistant' && message.uncertainty && <p className="mt-2 text-xs font-medium text-amber-800">Evidence is limited or incomplete.</p>}
                {message.role === 'assistant' && message.citations?.length > 0 && <Sources sources={message.citations} onError={setError} />}
              </article>
            ))}
            {busy && mode === 'copilot' && <p className="text-sm text-slate-500">Checking verified records…</p>}
          </div>
          <form onSubmit={(event) => void handleAsk(event)} className="space-y-2">
            <label htmlFor="healthQuestion" className="text-sm font-semibold text-slate-800">Your question</label>
            <textarea id="healthQuestion" value={question} maxLength={2000} rows={3} onChange={(event) => setQuestion(event.target.value)} placeholder="For example: What do my recent glucose results show?" className="w-full rounded-lg border border-slate-300 bg-white p-3 text-sm text-slate-900 focus:border-teal-800 focus:outline-none focus:ring-2 focus:ring-teal-800/20" />
            <button type="submit" disabled={busy || !question.trim()} className="min-h-11 rounded-md bg-teal-800 px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">Ask copilot</button>
          </form>
        </>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => void handleSummary()} disabled={busy} className="min-h-11 rounded-md bg-teal-800 px-4 text-sm font-semibold text-white disabled:opacity-50">{busy ? 'Preparing…' : 'Generate summary'}</button>
            {summary && <button type="button" onClick={downloadSummary} className="min-h-11 rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800">Download summary</button>}
            <button type="button" onClick={() => void handleExport()} disabled={busy} className="min-h-11 rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 disabled:opacity-50">Export verified records (FHIR R4)</button>
          </div>
          {summary && (
            <article className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="mb-4 border-b border-slate-200 pb-3">
                <span className="text-xs font-semibold uppercase text-teal-900">AI-generated · clinician review</span>
                {summary.uncertainty && <p className="mt-1 text-xs text-amber-800">Evidence is limited or incomplete.</p>}
              </div>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-800">{summary.summary || summary.answer}</p>
              <div className="mt-5">
                <h2 className="text-sm font-semibold text-slate-900">Source records</h2>
                <Sources sources={summary.sources || []} onError={setError} />
              </div>
            </article>
          )}
        </>
      )}
      <p className="text-xs leading-relaxed text-slate-500">Informational support only. This is not a diagnosis or treatment instruction. Discuss medical decisions with a qualified clinician.</p>
    </section>
  );
};
