'use client'
import { useState, useEffect, useCallback } from 'react'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

const LLM_PROVIDERS = ['anthropic', 'openai', 'google'] as const
const EMBED_PROVIDERS = ['anthropic', 'openai', 'google'] as const

type LLMProvider = (typeof LLM_PROVIDERS)[number]
type EmbedProvider = (typeof EMBED_PROVIDERS)[number]

interface ConfigState {
  system_prompt: string
  llm_provider: LLMProvider
  llm_model: string
  llm_temperature: number
  llm_max_tokens: number
  embed_provider: EmbedProvider
  embed_model: string
  rag_retrieval_k: number
  rag_chunk_size: number
  rag_score_threshold: number
}

const DEFAULT_CONFIG: ConfigState = {
  system_prompt: '',
  llm_provider: 'google',
  llm_model: '',
  llm_temperature: 0.3,
  llm_max_tokens: 1024,
  embed_provider: 'google',
  embed_model: '',
  rag_retrieval_k: 6,
  rag_chunk_size: 900,
  rag_score_threshold: 0.0,
}

function getToken(): string {
  if (typeof window === 'undefined') return ''
  return sessionStorage.getItem('access_token') ?? ''
}

const fieldClass =
  'w-full rounded-lg border border-mist px-3 py-2 bg-cream text-sm text-ink ' +
  'focus-visible:border-owl-orange-dark focus-visible:outline-none ' +
  'focus-visible:ring-2 focus-visible:ring-owl-orange-dark ' +
  'disabled:opacity-50 disabled:cursor-not-allowed'

const labelClass = 'flex flex-col gap-1 text-xs font-medium text-slate-text'

// ── Spinner icon (inline SVG, no external dependency) ──────────────────────
function Spinner() {
  return (
    <svg
      aria-hidden="true"
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      className="animate-spin"
    >
      <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="2" strokeDasharray="20 10" />
    </svg>
  )
}

export function ConfigControls() {
  const [config, setConfig] = useState<ConfigState>(DEFAULT_CONFIG)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)

  // ── Load config on mount ────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false
    fetch(`${API}/config`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then((data: Partial<ConfigState>) => {
        if (cancelled) return
        setConfig({
          system_prompt:      data.system_prompt      ?? DEFAULT_CONFIG.system_prompt,
          llm_provider:       (data.llm_provider      ?? DEFAULT_CONFIG.llm_provider) as LLMProvider,
          llm_model:          data.llm_model          ?? DEFAULT_CONFIG.llm_model,
          llm_temperature:    data.llm_temperature    ?? DEFAULT_CONFIG.llm_temperature,
          llm_max_tokens:     data.llm_max_tokens     ?? DEFAULT_CONFIG.llm_max_tokens,
          embed_provider:     (data.embed_provider    ?? DEFAULT_CONFIG.embed_provider) as EmbedProvider,
          embed_model:        data.embed_model        ?? DEFAULT_CONFIG.embed_model,
          rag_retrieval_k:    data.rag_retrieval_k    ?? DEFAULT_CONFIG.rag_retrieval_k,
          rag_chunk_size:     data.rag_chunk_size     ?? DEFAULT_CONFIG.rag_chunk_size,
          rag_score_threshold: data.rag_score_threshold ?? DEFAULT_CONFIG.rag_score_threshold,
        })
        setLoaded(true)
      })
      .catch(() => {
        if (!cancelled) setLoadError('Erro ao carregar configurações.')
      })
    return () => { cancelled = true }
  }, [])

  // ── Persist a partial update via PATCH /config ──────────────────────────
  const patchConfig = useCallback(
    async (patch: Partial<ConfigState>) => {
      setError(null)
      setSaving(true)
      try {
        const res = await fetch(`${API}/config`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${getToken()}`,
          },
          body: JSON.stringify(patch),
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
      } catch {
        setError('Erro ao salvar. Tente novamente.')
      } finally {
        setSaving(false)
      }
    },
    [],
  )

  // ── Helpers to update local state and sync ──────────────────────────────
  function updateField<K extends keyof ConfigState>(key: K, value: ConfigState[K]) {
    setConfig(prev => ({ ...prev, [key]: value }))
    void patchConfig({ [key]: value } as Partial<ConfigState>)
  }

  function updateNumber<K extends keyof ConfigState>(key: K, raw: string, parser: (v: string) => number) {
    const value = parser(raw)
    if (!Number.isFinite(value)) return
    updateField(key, value as ConfigState[K])
  }

  // ── Loading / error states ─────────────────────────────────────────────
  if (loadError) {
    return (
      <p role="alert" className="text-xs text-error bg-error/10 rounded-lg px-3 py-2 border border-error/30">
        {loadError}
      </p>
    )
  }

  if (!loaded) {
    return (
      <p className="flex items-center gap-2 text-xs text-slate-text px-1">
        <Spinner /> Carregando configurações…
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-4">

      {/* ── Error toast ──────────────────────────────────────────────────── */}
      {error && (
        <p
          role="alert"
          className="flex items-center gap-2 text-xs text-ink bg-error/10 rounded-lg px-3 py-2 border border-error/30"
        >
          <span aria-hidden="true">&#9888;</span>
          {error}
        </p>
      )}

      {/* ── Saving indicator ─────────────────────────────────────────────── */}
      {saving && (
        <p role="status" className="flex items-center gap-2 text-xs text-slate-text px-1">
          <Spinner /> Salvando…
        </p>
      )}

      {/* ── System Prompt ─────────────────────────────────────────────────── */}
      <section aria-labelledby="cc-system-prompt-heading">
        <h3
          id="cc-system-prompt-heading"
          className="text-[11px] font-bold text-slate-text uppercase tracking-widest mb-2"
        >
          System Prompt
        </h3>
        <label className={labelClass}>
          <span className="sr-only">System Prompt do AURA</span>
          <textarea
            rows={6}
            value={config.system_prompt}
            disabled={saving}
            aria-label="System Prompt do AURA"
            onChange={e => updateField('system_prompt', e.target.value)}
            onBlur={e => void patchConfig({ system_prompt: e.target.value })}
            className={`${fieldClass} resize-y font-mono text-xs leading-relaxed`}
          />
        </label>
      </section>

      {/* ── Modelo de Linguagem ───────────────────────────────────────────── */}
      <section aria-labelledby="cc-llm-heading">
        <h3
          id="cc-llm-heading"
          className="text-[11px] font-bold text-slate-text uppercase tracking-widest mb-2"
        >
          Modelo de Linguagem
        </h3>
        <div className="flex flex-col gap-2">
          <label className={labelClass}>
            Provedor LLM
            <select
              value={config.llm_provider}
              disabled={saving}
              onChange={e => updateField('llm_provider', e.target.value as LLMProvider)}
              className={fieldClass}
            >
              {LLM_PROVIDERS.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </label>

          <label className={labelClass}>
            Modelo LLM
            <input
              type="text"
              value={config.llm_model}
              disabled={saving}
              placeholder="ex: gemini-1.5-flash"
              onChange={e => setConfig(prev => ({ ...prev, llm_model: e.target.value }))}
              onBlur={e => void patchConfig({ llm_model: e.target.value })}
              className={fieldClass}
            />
          </label>
        </div>
      </section>

      {/* ── Parâmetros de Geração ─────────────────────────────────────────── */}
      <section aria-labelledby="cc-gen-heading">
        <h3
          id="cc-gen-heading"
          className="text-[11px] font-bold text-slate-text uppercase tracking-widest mb-2"
        >
          Geração
        </h3>
        <div className="flex flex-col gap-2">
          <label className={labelClass}>
            Temperatura: <span className="text-ink font-semibold">{config.llm_temperature.toFixed(1)}</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.1}
              value={config.llm_temperature}
              disabled={saving}
              aria-label="Temperatura do modelo"
              onChange={e => updateNumber('llm_temperature', e.target.value, parseFloat)}
              className="w-full accent-owl-orange disabled:opacity-50 cursor-pointer"
            />
          </label>

          <label className={labelClass}>
            Máx. tokens
            <input
              type="number"
              value={config.llm_max_tokens}
              min={256}
              max={4096}
              step={128}
              disabled={saving}
              onChange={e => updateNumber('llm_max_tokens', e.target.value, v => parseInt(v, 10))}
              className={fieldClass}
            />
          </label>
        </div>
      </section>

      {/* ── Embeddings ────────────────────────────────────────────────────── */}
      <section aria-labelledby="cc-embed-heading">
        <h3
          id="cc-embed-heading"
          className="text-[11px] font-bold text-slate-text uppercase tracking-widest mb-2"
        >
          Embeddings
        </h3>
        <div className="flex flex-col gap-2">
          <label className={labelClass}>
            Provedor Embeddings
            <select
              value={config.embed_provider}
              disabled={saving}
              onChange={e => updateField('embed_provider', e.target.value as EmbedProvider)}
              className={fieldClass}
            >
              {EMBED_PROVIDERS.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </label>

          <label className={labelClass}>
            Modelo Embeddings
            <input
              type="text"
              value={config.embed_model}
              disabled={saving}
              placeholder="ex: text-embedding-3-small"
              onChange={e => setConfig(prev => ({ ...prev, embed_model: e.target.value }))}
              onBlur={e => void patchConfig({ embed_model: e.target.value })}
              className={fieldClass}
            />
          </label>
        </div>
      </section>

      {/* ── RAG ───────────────────────────────────────────────────────────── */}
      <section aria-labelledby="cc-rag-heading">
        <h3
          id="cc-rag-heading"
          className="text-[11px] font-bold text-slate-text uppercase tracking-widest mb-2"
        >
          RAG
        </h3>
        <div className="flex flex-col gap-2">
          <label className={labelClass}>
            Chunks recuperados (1 – 20)
            <input
              type="number"
              value={config.rag_retrieval_k}
              min={1}
              max={20}
              step={1}
              disabled={saving}
              onChange={e => updateNumber('rag_retrieval_k', e.target.value, v => parseInt(v, 10))}
              className={fieldClass}
            />
          </label>

          <label className={labelClass}>
            Limiar de relevância: <span className="text-ink font-semibold">{config.rag_score_threshold.toFixed(2)}</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={config.rag_score_threshold}
              disabled={saving}
              aria-label="Limiar de relevância do RAG"
              onChange={e => updateNumber('rag_score_threshold', e.target.value, parseFloat)}
              className="w-full accent-owl-orange disabled:opacity-50 cursor-pointer"
            />
          </label>

          <label className={labelClass}>
            Tamanho do chunk (200 – 2000)
            <input
              type="number"
              value={config.rag_chunk_size}
              min={200}
              max={2000}
              step={100}
              disabled={saving}
              onChange={e => updateNumber('rag_chunk_size', e.target.value, v => parseInt(v, 10))}
              className={fieldClass}
            />
          </label>

          <p role="note" className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1.5 leading-snug">
            Alteracoes no tamanho do chunk exigem re-ingestao de todos os documentos.
          </p>
        </div>
      </section>
    </div>
  )
}
