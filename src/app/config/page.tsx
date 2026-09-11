'use client'
import { useState, useEffect } from 'react'
import { AppHeader } from '@/components/AppHeader'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'
const PROVIDERS = ['anthropic', 'openai', 'google'] as const
function token() { return sessionStorage.getItem('access_token') ?? '' }

type CfgState = {
  system_prompt: string
  llm_provider: string
  llm_model: string
  llm_temperature: number
  llm_max_tokens: number
  embed_provider: string
  embed_model: string
  rag_retrieval_k: number
  rag_chunk_size: number
  rag_score_threshold: number
}

export default function ConfigPage() {
  const [cfg, setCfg] = useState<CfgState>({
    system_prompt: '',
    llm_provider: 'anthropic',
    llm_model: '',
    llm_temperature: 0.3,
    llm_max_tokens: 1024,
    embed_provider: 'openai',
    embed_model: '',
    rag_retrieval_k: 6,
    rag_chunk_size: 900,
    rag_score_threshold: 0.0,
  })
  const [apiKeys, setApiKeys] = useState({ anthropic: '', openai: '', google: '' })
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`${API}/config`, { headers: { Authorization: `Bearer ${token()}` } })
      .then(r => r.json())
      .then(({
        system_prompt, llm_provider, llm_model,
        llm_temperature, llm_max_tokens,
        embed_provider, embed_model,
        rag_retrieval_k, rag_chunk_size, rag_score_threshold,
      }) =>
        setCfg({
          system_prompt: system_prompt ?? '',
          llm_provider: llm_provider ?? 'google',
          llm_model: llm_model ?? '',
          llm_temperature: llm_temperature ?? 0.3,
          llm_max_tokens: llm_max_tokens ?? 1024,
          embed_provider: embed_provider ?? 'google',
          embed_model: embed_model ?? '',
          rag_retrieval_k: rag_retrieval_k ?? 6,
          rag_chunk_size: rag_chunk_size ?? 900,
          rag_score_threshold: rag_score_threshold ?? 0.0,
        })
      )
      .catch(() => setError('Erro ao carregar configurações'))
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault(); setError(''); setSaved(false)
    const res = await fetch(`${API}/config`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
      body: JSON.stringify({
        system_prompt: cfg.system_prompt,
        llm_provider: cfg.llm_provider,
        llm_model: cfg.llm_model,
        llm_temperature: cfg.llm_temperature,
        llm_max_tokens: cfg.llm_max_tokens,
        embed_provider: cfg.embed_provider,
        embed_model: cfg.embed_model,
        rag_retrieval_k: cfg.rag_retrieval_k,
        rag_chunk_size: cfg.rag_chunk_size,
        rag_score_threshold: cfg.rag_score_threshold,
        ...(apiKeys.anthropic && { anthropic_api_key: apiKeys.anthropic }),
        ...(apiKeys.openai && { openai_api_key: apiKeys.openai }),
        ...(apiKeys.google && { google_api_key: apiKeys.google }),
      }),
    })
    if (res.ok) { setSaved(true); setApiKeys({ anthropic: '', openai: '', google: '' }) }
    else setError('Erro ao salvar')
  }

  function numField(
    key: keyof CfgState,
    opts: { min: number; max: number; step?: number }
  ) {
    return (
      <input
        type="number"
        value={cfg[key] as number}
        min={opts.min}
        max={opts.max}
        step={opts.step ?? 1}
        onChange={e => setCfg(c => ({ ...c, [key]: parseFloat(e.target.value) }))}
        className={fieldClass}
      />
    )
  }

  const fieldClass =
    'rounded-xl border border-mist px-4 py-3 bg-cream min-h-[48px] focus-visible:border-owl-orange-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-owl-orange-dark'

  return (
    <>
      <AppHeader />
      <main id="main-content" className="max-w-2xl mx-auto px-6 py-6">
        <h1 className="text-2xl font-bold text-ink mb-6 pl-4 border-l-4 border-owl-orange">Configurações</h1>
        <form onSubmit={handleSave} className="flex flex-col gap-5">

          {/* System Prompt */}
          <div className="bg-cream-card rounded-2xl border border-mist p-6 shadow-sm">
            <label className="flex flex-col gap-1 text-sm font-medium text-ink">
              System Prompt do AURA
              <textarea
                rows={10}
                value={cfg.system_prompt}
                onChange={e => setCfg(c => ({ ...c, system_prompt: e.target.value }))}
                className="rounded-2xl border border-mist px-5 py-3.5 text-sm bg-cream font-mono focus-visible:border-owl-orange-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-owl-orange-dark"
              />
            </label>
          </div>

          {/* Modelo de Linguagem */}
          <div className="bg-cream-card rounded-2xl border border-mist p-6 shadow-sm">
            <h2 className="text-base font-semibold text-ink mb-4">Modelo de Linguagem</h2>
            <div className="grid grid-cols-2 gap-4">
              <label className="flex flex-col gap-1 text-sm font-medium text-ink">
                Provedor LLM
                <select value={cfg.llm_provider}
                  onChange={e => setCfg(c => ({ ...c, llm_provider: e.target.value }))}
                  className={fieldClass}>
                  {PROVIDERS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-sm font-medium text-ink">
                Modelo LLM
                <input type="text" value={cfg.llm_model}
                  onChange={e => setCfg(c => ({ ...c, llm_model: e.target.value }))}
                  className={fieldClass} />
              </label>
            </div>
          </div>

          {/* Parâmetros de Geração */}
          <div className="bg-cream-card rounded-2xl border border-mist p-6 shadow-sm">
            <h2 className="text-base font-semibold text-ink mb-4">Parâmetros de Geração</h2>
            <div className="grid grid-cols-2 gap-4">
              <label className="flex flex-col gap-1 text-sm font-medium text-ink">
                Temperatura (0 – 1)
                {numField('llm_temperature', { min: 0, max: 1, step: 0.1 })}
              </label>
              <label className="flex flex-col gap-1 text-sm font-medium text-ink">
                Máx. tokens (256 – 4096)
                {numField('llm_max_tokens', { min: 256, max: 4096, step: 128 })}
              </label>
            </div>
          </div>

          {/* Embeddings */}
          <div className="bg-cream-card rounded-2xl border border-mist p-6 shadow-sm">
            <h2 className="text-base font-semibold text-ink mb-4">Embeddings</h2>
            <div className="grid grid-cols-2 gap-4">
              <label className="flex flex-col gap-1 text-sm font-medium text-ink">
                Provedor Embeddings
                <select value={cfg.embed_provider}
                  onChange={e => setCfg(c => ({ ...c, embed_provider: e.target.value }))}
                  className={fieldClass}>
                  {PROVIDERS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-sm font-medium text-ink">
                Modelo Embeddings
                <input type="text" value={cfg.embed_model}
                  onChange={e => setCfg(c => ({ ...c, embed_model: e.target.value }))}
                  className={fieldClass} />
              </label>
            </div>
          </div>

          {/* RAG — Recuperação e Chunking */}
          <div className="bg-cream-card rounded-2xl border border-mist p-6 shadow-sm">
            <h2 className="text-base font-semibold text-ink mb-4">RAG — Recuperação e Chunking</h2>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <label className="flex flex-col gap-1 text-sm font-medium text-ink">
                Chunks recuperados (1 – 20)
                {numField('rag_retrieval_k', { min: 1, max: 20 })}
              </label>
              <label className="flex flex-col gap-1 text-sm font-medium text-ink">
                Limiar de relevância (0 = desabilitado)
                {numField('rag_score_threshold', { min: 0, max: 1, step: 0.05 })}
              </label>
            </div>
            <label className="flex flex-col gap-1 text-sm font-medium text-ink">
              Tamanho do chunk (200 – 2000)
              {numField('rag_chunk_size', { min: 200, max: 2000, step: 100 })}
            </label>
            <p role="note" className="mt-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5">
              ⚠ Alterações no tamanho do chunk exigem re-ingestão de todos os documentos para ter efeito.
            </p>
          </div>

          {/* Chaves de API */}
          <div className="bg-violet-soft rounded-2xl border border-violet/20 p-5">
            <p className="text-sm font-semibold text-ink mb-4 flex items-center gap-2">
              <span aria-hidden="true">🔒</span> Chaves de API
            </p>
            <div className="flex flex-col gap-3">
              {[
                { label: 'Anthropic API Key', key: 'anthropic' as const },
                { label: 'OpenAI API Key', key: 'openai' as const },
                { label: 'Google API Key', key: 'google' as const },
              ].map(({ label, key }) => (
                <label key={key} htmlFor={`api-key-${key}`} className="flex flex-col gap-1 text-sm font-medium text-ink">
                  {label}
                  <input
                    id={`api-key-${key}`}
                    type="password"
                    value={apiKeys[key]}
                    onChange={e => setApiKeys(k => ({ ...k, [key]: e.target.value }))}
                    placeholder="sk-... (deixe vazio para não alterar)"
                    autoComplete="new-password"
                    className={fieldClass}
                  />
                </label>
              ))}
            </div>
          </div>

          {error && (
            <p role="alert" className="flex items-center gap-2 text-sm text-ink bg-error/10 rounded-xl px-4 py-2.5 border border-error/30">
              <span aria-hidden="true">⚠️</span> {error}
            </p>
          )}
          {saved && (
            <p role="status" className="flex items-center gap-2 text-sm text-success bg-success/10 rounded-xl px-4 py-2.5">
              <span aria-hidden="true">✓</span> Configurações salvas com sucesso.
            </p>
          )}

          <button type="submit"
            className="bg-owl-orange hover:bg-owl-orange-dark text-ink rounded-2xl py-2.5 px-5 font-semibold self-start transition-colors min-h-[44px]">
            Salvar
          </button>
        </form>
      </main>
    </>
  )
}
