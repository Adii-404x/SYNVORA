import React, { FormEvent, useEffect, useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { api, Conversation, ConversationMessage, EvidenceSource, GroundedText } from '../../services/api';

type Mode = 'copilot' | 'summary';

function Sources({ sources, onSelectSource }: { sources: EvidenceSource[]; onSelectSource: (source: EvidenceSource) => void }) {
  if (!sources.length) return <p className="text-xs text-slate-500">No source records were returned.</p>;
  return (
    <ul className="mt-3 space-y-2">
      {sources.map((source) => (
        <li key={source.factId} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-teal-700">description</span>
              <span>{source.fileName}{source.pageNumber ? ` · page ${source.pageNumber}` : ''}</span>
            </span>
            <button
              type="button"
              onClick={() => onSelectSource(source)}
              className="min-h-8 rounded-md border border-teal-700/40 bg-teal-50 px-2.5 text-xs font-semibold text-teal-950 hover:bg-teal-100 transition-colors flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[14px]">visibility</span>
              <span>View source</span>
            </button>
          </div>
          <blockquote className="mt-2 border-l-2 border-teal-700 pl-3 text-sm leading-relaxed text-slate-700 italic">
            "{source.evidence}"
          </blockquote>
        </li>
      ))}
    </ul>
  );
}

function FormattedText({ text }: { text: string }) {
  const lines = text.split('\n');

  return (
    <div className="space-y-1.5 text-sm leading-relaxed text-slate-800">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={idx} className="h-1" />;

        // Header lines (e.g. 1. Glycemic & Metabolic Status: or CLINICAL BRIEFING)
        const isHeader = /^(?:[0-9]+\.|\*\*|[A-Z\s]{4,}:)/.test(trimmed) && trimmed.length < 80;

        // Render bold markers
        const parts = line.split(/(\*\*[^*]+\*\*)/g);
        const rendered = parts.map((part, pIdx) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={pIdx} className="font-semibold text-slate-900">{part.slice(2, -2)}</strong>;
          }
          if (part.startsWith('*') && part.endsWith('*')) {
            return <em key={pIdx} className="italic text-slate-600">{part.slice(1, -1)}</em>;
          }
          return part;
        });

        if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
          return (
            <div key={idx} className="flex items-start gap-2 pl-2">
              <span className="text-teal-700 font-bold">•</span>
              <div className="flex-1">{rendered.slice(1)}</div>
            </div>
          );
        }

        if (isHeader) {
          return (
            <p key={idx} className="font-semibold text-teal-950 pt-1.5">
              {rendered}
            </p>
          );
        }

        return <p key={idx}>{rendered}</p>;
      })}
    </div>
  );
}

export const CareToolsScreen: React.FC<{ mode: Mode }> = ({ mode }) => {
  const { lang } = useLanguage();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [conversationId, setConversationId] = useState('');
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [question, setQuestion] = useState('');
  const [summary, setSummary] = useState<GroundedText | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [copied, setCopied] = useState(false);
  const [activeSource, setActiveSource] = useState<EvidenceSource | null>(null);

  const quickQuestions = [
    'What do my recent glucose & HbA1c results show?',
    'What medications am I taking and what is the schedule?',
    'What questions should I ask Dr. Rajiv at my next visit?',
    'Explain my blood pressure & cholesterol readings',
    'Summarize my overall health status & trends',
    'मेरी हालिया स्वास्थ्य रिपोर्ट का संक्षिप्त विवरण दें (Hindi)',
  ];

  useEffect(() => {
    if (mode === 'copilot') {
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
    }

    if (mode === 'summary') {
      void handleSummary();
    }
  }, [mode, lang]);

  async function askQuestionText(text: string) {
    if (!text.trim() || busy) return;
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
      const result = await api.askCopilot(text, conversationId || undefined, lang);
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

  async function handleAsk(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await askQuestionText(question.trim());
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
      const res = await api.generateSummary(lang);
      setSummary(res);
      setNotice(lang === 'hi' ? 'सत्यापित रिकॉर्ड का नैदानिक सारांश तैयार किया गया।' : 'Verified records clinical briefing updated.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Summary generation is unavailable.');
    } finally {
      setBusy(false);
    }
  }

  async function handleCopySummary() {
    if (!summary?.summary) return;
    try {
      await navigator.clipboard.writeText(summary.summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
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
      link.download = 'synvora-health-records-fhir-r4.json';
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
      'Patient: Alex Morgan',
      `Generated: ${new Date().toLocaleString()}`,
      '',
      summary.summary || summary.answer || '',
      '',
      'Source records:',
      ...(sources.length ? sources : ['- No source records were returned.']),
      '',
      'This is informational support, not a clinician\'s diagnosis or treatment instruction.',
    ].join('\n');
    const url = URL.createObjectURL(new Blob([content], { type: 'text/plain;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'synvora-clinician-review-summary.txt';
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <section className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 space-y-5">
      <header className="border-b border-slate-200 pb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{mode === 'copilot' ? 'Health Copilot' : 'Clinical Summary'}</h1>
            <p className="mt-1 text-sm text-slate-600">
              {mode === 'copilot'
                ? 'Ask questions about your verified lab tests, prescriptions, and health trends. All responses are source-linked.'
                : 'A structured, AI-generated briefing synthesized from verified records for physician consultations.'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 border border-emerald-200">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Grounded AI Engine
            </span>
          </div>
        </div>
      </header>

      {error && <div role="alert" className="rounded-lg border border-rose-300 bg-rose-50 p-3 text-sm text-rose-900 flex items-center justify-between"><span>{error}</span><button type="button" onClick={() => setError('')} className="text-xs font-bold underline">Dismiss</button></div>}
      {notice && <div role="status" className="rounded-lg border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-900">{notice}</div>}

      {mode === 'copilot' ? (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <label className="sr-only" htmlFor="conversationSelect">Conversation history</label>
            <select id="conversationSelect" value={conversationId} onChange={(event) => void selectConversation(event.target.value)} className="min-h-10 min-w-0 flex-1 rounded-md border border-slate-300 bg-white px-3 text-sm" disabled={busy}>
              <option value="">New conversation</option>
              {conversations.map((item) => <option key={item.id} value={item.id}>{item.title || new Date(item.updated_at).toLocaleString()}</option>)}
            </select>
            <button type="button" onClick={startConversation} disabled={busy} className="min-h-10 rounded-md border border-slate-300 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">New chat</button>
          </div>

          {/* Quick Prompt Chips */}
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Suggested questions:</p>
            <div className="flex flex-wrap gap-2">
              {quickQuestions.map((qText) => (
                <button
                  key={qText}
                  type="button"
                  disabled={busy}
                  onClick={() => void askQuestionText(qText)}
                  className="rounded-full border border-teal-200 bg-teal-50/60 px-3 py-1.5 text-xs font-medium text-teal-900 hover:bg-teal-100 hover:border-teal-300 transition-colors disabled:opacity-50 text-left"
                >
                  {qText}
                </button>
              ))}
            </div>
          </div>

          <div aria-live="polite" className="min-h-64 space-y-4 rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs">
            {messages.length === 0 && (
              <div className="py-12 text-center text-slate-500 space-y-2">
                <span className="material-symbols-outlined text-[36px] text-teal-700">chat_bubble</span>
                <p className="text-sm font-semibold text-slate-700">Ask a question about your verified records</p>
                <p className="text-xs max-w-md mx-auto text-slate-500">
                  Tap any suggested chip above or type a custom question. Every claim is grounded in your verified documents.
                </p>
              </div>
            )}
            {messages.map((message) => (
              <article key={message.id} className={`max-w-[94%] ${message.role === 'user' ? 'ml-auto rounded-xl bg-teal-800 text-white p-3.5 shadow-xs' : 'rounded-xl border border-slate-200 bg-slate-50/80 p-4'}`}>
                {message.role === 'user' ? (
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
                ) : (
                  <>
                    <FormattedText text={message.content} />
                    {message.uncertainty && (
                      <div className="mt-3 flex items-center gap-1.5 rounded-md bg-amber-50 border border-amber-200 p-2 text-xs font-medium text-amber-900">
                        <span className="material-symbols-outlined text-[16px] text-amber-700">info</span>
                        <span>Evidence in current records is limited for parts of this inquiry. Consult your physician.</span>
                      </div>
                    )}
                    {message.citations?.length > 0 && <Sources sources={message.citations} onSelectSource={setActiveSource} />}
                  </>
                )}
              </article>
            ))}
            {busy && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-50 border border-slate-200 text-sm text-teal-900 animate-pulse">
                <span className="material-symbols-outlined text-[18px]">neurology</span>
                <span>Synthesizing source-grounded response…</span>
              </div>
            )}
          </div>

          <form onSubmit={(event) => void handleAsk(event)} className="space-y-2">
            <label htmlFor="healthQuestion" className="text-sm font-semibold text-slate-800">Your health question</label>
            <div className="flex gap-2">
              <textarea
                id="healthQuestion"
                value={question}
                maxLength={2000}
                rows={2}
                onChange={(event) => setQuestion(event.target.value)}
                placeholder="Ask about glucose, medications, blood pressure, doctor questions, diet..."
                className="flex-1 rounded-lg border border-slate-300 bg-white p-3 text-sm text-slate-900 focus:border-teal-800 focus:outline-none focus:ring-2 focus:ring-teal-800/20"
              />
              <button
                type="submit"
                disabled={busy || !question.trim()}
                className="min-h-11 px-5 rounded-lg bg-teal-800 font-semibold text-white hover:bg-teal-900 disabled:cursor-not-allowed disabled:opacity-50 transition-colors flex items-center gap-2 self-end"
              >
                <span className="material-symbols-outlined text-[18px]">send</span>
                <span>Ask</span>
              </button>
            </div>
          </form>
        </>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void handleSummary()}
                disabled={busy}
                className="min-h-10 rounded-md bg-teal-800 px-4 text-sm font-semibold text-white hover:bg-teal-900 disabled:opacity-50 transition-colors flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[18px]">refresh</span>
                <span>{busy ? 'Preparing…' : 'Regenerate summary'}</span>
              </button>
              {summary && (
                <>
                  <button
                    type="button"
                    onClick={() => void handleCopySummary()}
                    className="min-h-10 rounded-md border border-slate-300 bg-white px-3.5 text-sm font-semibold text-slate-800 hover:bg-slate-50 transition-colors flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[18px]">{copied ? 'check' : 'content_copy'}</span>
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={downloadSummary}
                    className="min-h-10 rounded-md border border-slate-300 bg-white px-3.5 text-sm font-semibold text-slate-800 hover:bg-slate-50 transition-colors flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[18px]">download</span>
                    <span>Download TXT</span>
                  </button>
                </>
              )}
            </div>
            <button
              type="button"
              onClick={() => void handleExport()}
              disabled={busy}
              className="min-h-10 rounded-md border border-teal-800/40 bg-teal-50 px-3.5 text-sm font-semibold text-teal-950 hover:bg-teal-100 disabled:opacity-50 transition-colors flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[18px]">share</span>
              <span>Export FHIR R4</span>
            </button>
          </div>

          {summary ? (
            <article className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <span className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-teal-900">
                  <span className="material-symbols-outlined text-[16px]">verified</span>
                  Clinician Review Briefing
                </span>
                <span className="text-xs text-slate-500">Updated: Just now</span>
              </div>
              <FormattedText text={summary.summary || summary.answer || ''} />
              <div className="mt-6 border-t border-slate-200 pt-4">
                <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[18px] text-teal-700">source</span>
                  <span>Underlying Verified Source Records</span>
                </h2>
                <Sources sources={summary.sources || []} onSelectSource={setActiveSource} />
              </div>
            </article>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center space-y-3">
              <span className="material-symbols-outlined text-[36px] text-teal-700">summarize</span>
              <h2 className="text-base font-semibold text-slate-800">Generate Your Clinical Briefing</h2>
              <p className="text-sm text-slate-500 max-w-md mx-auto">
                Synthesize all verified laboratory reports, prescriptions, and cardiovascular vital signs into an organized consultation sheet.
              </p>
              <button
                type="button"
                onClick={() => void handleSummary()}
                disabled={busy}
                className="min-h-11 rounded-lg bg-teal-800 px-5 text-sm font-semibold text-white hover:bg-teal-900 transition-colors"
              >
                {busy ? 'Preparing summary…' : 'Generate summary now'}
              </button>
            </div>
          )}
        </>
      )}

      {/* In-App Source Document Evidence Modal */}
      {activeSource && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs" onClick={() => setActiveSource(null)}>
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-200 p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[24px] text-teal-700">verified</span>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">{activeSource.fileName}</h3>
                  <p className="text-xs text-slate-500">
                    Verified clinical provenance · {activeSource.pageNumber ? `Page ${activeSource.pageNumber}` : 'Document record'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveSource(null)}
                className="text-slate-400 hover:text-slate-600 rounded-lg p-1"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="rounded-xl bg-teal-50/70 border border-teal-200 p-4 space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-900 flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">format_quote</span>
                Verified Document Evidence Excerpt
              </span>
              <blockquote className="text-sm text-slate-800 leading-relaxed font-serif italic border-l-2 border-teal-700 pl-3">
                "{activeSource.evidence}"
              </blockquote>
            </div>

            <div className="text-xs text-slate-600 space-y-1">
              <p><span className="font-semibold text-slate-700">Document ID:</span> <span className="font-mono text-[11px]">{activeSource.documentId}</span></p>
              <p><span className="font-semibold text-slate-700">Fact ID:</span> <span className="font-mono text-[11px]">{activeSource.factId}</span></p>
              <p><span className="font-semibold text-slate-700">Verification Engine:</span> Source-grounded OCR & Medical Entity Extraction</p>
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveSource(null)}
                className="min-h-10 px-4 rounded-lg bg-teal-800 text-white text-sm font-semibold hover:bg-teal-900 transition-colors"
              >
                Close preview
              </button>
            </div>
          </div>
        </div>
      )}

      <p className="text-xs leading-relaxed text-slate-500">
        Informational clinical support only. This is not a diagnosis or treatment instruction. Always discuss medical decisions with a qualified clinician.
      </p>
    </section>
  );
};
