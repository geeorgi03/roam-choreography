'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import MuxPlayer from '@mux/mux-player-react';
import { createClient } from '@supabase/supabase-js';
import type { ClipComment } from '@roam/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

// [W9-C] Web-share feedback category chips — ticket b0936641-2685-4c72-bcca-4d9e848842db
// Prefixes submitted comment text with [Category] to mirror the structured feedback
// vocabulary used in the mobile FeedbackSheet (Liz Lerman 4-step flow).
const FEEDBACK_CATEGORIES = ['Idea', 'Timing', 'Spacing', 'Energy'] as const;

export interface ClipPlayerProps {
  playbackId: string;
  thumbnailUrl: string;
  label: string | null;
  tags: {
    style: string | null;
    energy: string | null;
    difficulty: string | null;
  };
  feedbackOpen?: boolean;
  clipId?: string;
  shareToken: string;
}

export function ClipPlayer({
  playbackId,
  thumbnailUrl,
  label,
  tags,
  feedbackOpen = false,
  clipId,
  shareToken,
}: ClipPlayerProps) {
  const supabase = useMemo(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return null;
    return createClient(url, key);
  }, []);

  const [expanded, setExpanded] = useState(false);
  const [feedbackRevealed, setFeedbackRevealed] = useState(false);
  const [persistedComments, setPersistedComments] = useState<ClipComment[]>([]);
  const [submittedComments, setSubmittedComments] = useState<ClipComment[]>([]);
  const [thanksShown, setThanksShown] = useState(false);
  const [name, setName] = useState('');
  const [timecodeMs, setTimecodeMs] = useState('');
  const [text, setText] = useState('');
  const [feedbackCategory, setFeedbackCategory] = useState<(typeof FEEDBACK_CATEGORIES)[number] | null>(
    null
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTimeMs, setCurrentTimeMs] = useState(0);

  const refreshComments = useCallback(async () => {
    if (!supabase || !clipId || !shareToken) return;
    const { data, error: rpcError } = await supabase.rpc('get_clip_comments_for_share', {
      p_token: shareToken,
      p_clip_id: clipId,
    });
    if (rpcError) return;
    const list = Array.isArray(data) ? (data as ClipComment[]) : [];
    setPersistedComments(list);
  }, [clipId, shareToken, supabase]);

  useEffect(() => {
    if (!expanded) return;
    void refreshComments();
  }, [expanded, refreshComments]);

  const handleUseCurrentTime = () => {
    setTimecodeMs(String(currentTimeMs));
  };

  const handleRevealFeedback = () => {
    setThanksShown(false);
    setError(null);
    setFeedbackRevealed(true);
    setFeedbackCategory(null);
    setTimecodeMs(String(currentTimeMs));
  };

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clipId || !text.trim()) return;
    setError(null);
    setSubmitting(true);
    const rawText = text.trim();
    try {
      const res = await fetch(`${API_BASE}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clip_id: clipId,
          timecode_ms: parseInt(timecodeMs, 10) || 0,
          text: rawText,
          category: feedbackCategory,
          commenter_name: name.trim() || undefined,
          share_token: shareToken,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error((data as { error?: string }).error ?? res.statusText);
      setThanksShown(true);
      setSubmittedComments((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          clip_id: clipId,
          session_id: '',
          timecode_ms: parseInt(timecodeMs, 10) || 0,
          text: feedbackCategory ? `[${feedbackCategory}] ${rawText}` : rawText,
          feedback_category: feedbackCategory,
          feedback_text: rawText,
          commenter_name: name.trim() || null,
          created_at: new Date().toISOString(),
        },
      ]);
      setText('');
      setFeedbackCategory(null);
      setTimecodeMs('');
      await refreshComments();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to submit');
    } finally {
      setSubmitting(false);
    }
  };

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="rounded-lg overflow-hidden bg-roam-chrome border border-roam-border text-left w-full aspect-video flex flex-col"
      >
        <img
          src={thumbnailUrl}
          alt={label ?? 'Clip'}
          className="w-full flex-1 object-cover"
        />
        <div className="p-2">
          {label && <p className="text-roam-active font-medium truncate">{label}</p>}
          <div className="flex flex-wrap gap-1 mt-1">
            {[tags.style, tags.energy, tags.difficulty]
              .filter(Boolean)
              .map((t) => (
                <span
                  key={t!}
                  className="text-xs px-2 py-0.5 rounded bg-roam-border text-roam-muted"
                >
                  {t}
                </span>
              ))}
          </div>
        </div>
      </button>
    );
  }

  return (
    <div className="rounded-lg overflow-hidden bg-roam-chrome border border-roam-border w-full space-y-4">
      <div className="aspect-video">
        <MuxPlayer
          playbackId={playbackId}
          streamType="on-demand"
          className="w-full h-full"
          onTimeUpdate={(e: Event) => {
            const el = e.target as { currentTime?: number } | null;
            const t = el?.currentTime;
            if (typeof t === 'number') setCurrentTimeMs(Math.round(t * 1000));
          }}
        />
      </div>
      {feedbackOpen && clipId && (
        <div className="p-4 bg-roam-chrome border border-roam-border rounded-lg">
          {!feedbackRevealed ? (
            <button
              type="button"
              onClick={handleRevealFeedback}
              className="w-full py-2 rounded bg-amber-600 text-white text-sm font-medium hover:bg-amber-500"
            >
              Leave Feedback
            </button>
          ) : (
            <>
              <h3 className="text-sm font-semibold text-roam-active mb-3">Leave Feedback</h3>
              {thanksShown && (
                <p className="text-amber-400 text-sm mb-3">Thanks for your feedback!</p>
              )}
              <form onSubmit={handleSubmitFeedback} className="space-y-3">
                <input
                  type="text"
                  placeholder="Your name (optional)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded bg-roam-border text-roam-active text-sm placeholder:text-roam-muted border border-roam-border"
                />
                <div>
                  <p className="text-xs text-roam-muted mb-2">Category (optional)</p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {FEEDBACK_CATEGORIES.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setFeedbackCategory((prev) => (prev === cat ? null : cat))}
                        className={`text-xs px-2 py-1 rounded border ${
                          feedbackCategory === cat
                            ? 'bg-amber-600 border-amber-500 text-white'
                            : 'bg-roam-border border-roam-border text-roam-muted hover:bg-roam-chrome'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Timecode (ms)"
                    value={timecodeMs}
                    onChange={(e) => setTimecodeMs(e.target.value)}
                    className="flex-1 px-3 py-2 rounded bg-roam-border text-roam-active text-sm placeholder:text-roam-muted border border-roam-border"
                  />
                  <button
                    type="button"
                    onClick={handleUseCurrentTime}
                    className="px-3 py-2 rounded bg-roam-border text-roam-muted text-sm hover:bg-roam-chrome border border-roam-border"
                  >
                    Use current time
                  </button>
                </div>
                <textarea
                  placeholder="Your feedback..."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  required
                  rows={3}
                  className="w-full px-3 py-2 rounded bg-roam-border text-roam-active text-sm placeholder:text-roam-muted border border-roam-border resize-none"
                />
                {error && <p className="text-red-400 text-sm">{error}</p>}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2 rounded bg-amber-600 text-white text-sm font-medium hover:bg-amber-500 disabled:opacity-50"
                >
                  {submitting ? 'Submitting…' : 'Submit'}
                </button>
              </form>
            </>
          )}

          {(persistedComments.length > 0 || submittedComments.length > 0) && (
            <div className="mt-4 pt-3 border-t border-roam-border">
              <p className="text-xs text-roam-muted mb-2">Comments:</p>
              <ul className="space-y-2">
                {persistedComments.map((c) => (
                  <li key={c.id} className="text-sm text-roam-active">
                    <span className="font-medium">{c.commenter_name || 'Anonymous'}</span>
                    {c.timecode_ms > 0 && (
                      <span className="text-roam-muted ml-2">@ {Math.floor(c.timecode_ms / 1000)}s</span>
                    )}
                    : {c.feedback_text || c.text}
                  </li>
                ))}
                {submittedComments
                  .filter((c) => !persistedComments.some((p) => p.id === c.id))
                  .map((c) => (
                    <li key={c.id} className="text-sm text-roam-active">
                      <span className="font-medium">{c.commenter_name || 'Anonymous'}</span>
                      {c.timecode_ms > 0 && (
                        <span className="text-roam-muted ml-2">@ {Math.floor(c.timecode_ms / 1000)}s</span>
                      )}
                      : {c.feedback_text || c.text}
                    </li>
                  ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
