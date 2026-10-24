'use client'

import { useEffect, useMemo, useState } from 'react'
import { FileText, Menu, Moon, Plus, Search, Sun, Trash2, X } from 'lucide-react'

type Note = {
  id: string
  title: string
  content: string
  updatedAt: number
}

const STORAGE_KEY = 'offline-notes-v1'

const starterNotes: Note[] = [
  {
    id: 'welcome',
    title: 'Welcome to Notes',
    content: '# A quiet place for your thoughts\n\nEverything you write here stays in your browser. Start a new note or edit this one — your changes save automatically.',
    updatedAt: Date.now(),
  },
  {
    id: 'ideas',
    title: 'Ideas',
    content: 'Capture ideas before they disappear.\n\n- Keep it simple\n- Make time to think\n- Ship the useful version',
    updatedAt: Date.now() - 86400000,
  },
]

function formatDate(timestamp: number) {
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(timestamp)
}

export function NoteApp() {
  const [notes, setNotes] = useState<Note[]>([])
  const [activeId, setActiveId] = useState('')
  const [query, setQuery] = useState('')
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [hasLoaded, setHasLoaded] = useState(false)
  const [isDark, setIsDark] = useState(true)
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    setIsOnline(navigator.onLine)
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => undefined)
    }

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  useEffect(() => {
    const savedTheme = window.localStorage.getItem('offline-notes-theme')
    if (savedTheme) setIsDark(savedTheme === 'dark')
  }, [])

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', isDark)
    root.classList.toggle('light', !isDark)
    root.style.colorScheme = isDark ? 'dark' : 'light'
    window.localStorage.setItem('offline-notes-theme', isDark ? 'dark' : 'light')
  }, [isDark])

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY)
      const parsed = saved ? JSON.parse(saved) : starterNotes
      setNotes(Array.isArray(parsed) && parsed.length ? parsed : starterNotes)
      setActiveId((Array.isArray(parsed) && parsed.length ? parsed : starterNotes)[0].id)
    } catch {
      setNotes(starterNotes)
      setActiveId(starterNotes[0].id)
    } finally {
      setHasLoaded(true)
    }
  }, [])

  useEffect(() => {
    if (hasLoaded) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(notes))
  }, [notes, hasLoaded])

  const activeNote = notes.find((note) => note.id === activeId) ?? notes[0]
  const filteredNotes = useMemo(
    () => notes.filter((note) => note.title.toLowerCase().includes(query.toLowerCase())),
    [notes, query],
  )

  function updateActive(field: 'title' | 'content', value: string) {
    setNotes((current) => current.map((note) => (note.id === activeId ? { ...note, [field]: value, updatedAt: Date.now() } : note)))
  }

  function createNote() {
    const newNote: Note = { id: crypto.randomUUID(), title: 'Untitled note', content: '', updatedAt: Date.now() }
    setNotes((current) => [newNote, ...current])
    setActiveId(newNote.id)
    setIsSidebarOpen(false)
  }

  function deleteNote() {
    if (!activeNote) return
    const remaining = notes.filter((note) => note.id !== activeNote.id)
    setNotes(remaining)
    setActiveId(remaining[0]?.id ?? '')
    if (!remaining.length) createNote()
  }

  return (
    <main className={`min-h-screen selection:bg-violet-500/30 ${isDark ? 'bg-[#0b0c0f] text-[#f4f4f5]' : 'bg-[#f4f4f5] text-[#18181b]'}`}>
      <div className={`mx-auto flex min-h-screen max-w-[1440px] overflow-hidden border-x ${isDark ? 'border-white/[0.06] bg-[#101114]' : 'border-black/[0.06] bg-white'}`}>
        <aside className={`${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} absolute inset-y-0 left-0 z-20 flex w-[288px] flex-col border-r border-white/[0.07] bg-[#111216] transition-transform duration-200 md:relative md:translate-x-0`}>
          <div className="flex h-[76px] items-center justify-between border-b border-white/[0.07] px-5">
            <div className="flex items-center gap-3"><div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/15 text-violet-400"><FileText size={17} /></div><span className="text-sm font-semibold tracking-tight">Offline Notes</span></div>
            <button aria-label="Close notes sidebar" onClick={() => setIsSidebarOpen(false)} className="rounded-md p-1.5 text-zinc-500 hover:bg-white/5 hover:text-white md:hidden"><X size={18} /></button>
          </div>
          <div className="p-4"><button onClick={createNote} className="flex w-full items-center justify-center gap-2 rounded-lg bg-violet-500 px-3 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/10 transition hover:bg-violet-400"><Plus size={16} /> New note</button></div>
          <div className="px-4 pb-3"><label className="relative block"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" size={16} /><input aria-label="Search notes" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search notes" className="w-full rounded-lg border border-white/[0.07] bg-[#18191e] py-2 pl-9 pr-3 text-sm text-zinc-200 outline-none placeholder:text-zinc-600 focus:border-violet-500/60" /></label></div>
          <div className="flex-1 overflow-y-auto px-2 pb-4">
            <p className="px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-600">Your notes <span className="ml-1 text-zinc-700">{filteredNotes.length}</span></p>
            {filteredNotes.map((note) => <button key={note.id} onClick={() => { setActiveId(note.id); setIsSidebarOpen(false) }} className={`group mb-1 w-full rounded-lg px-3 py-3 text-left transition ${note.id === activeId ? 'bg-violet-500/10 ring-1 ring-inset ring-violet-500/20' : 'hover:bg-white/[0.035]'}`}><div className="flex items-start justify-between gap-2"><span className={`truncate text-sm font-medium ${note.id === activeId ? 'text-violet-300' : 'text-zinc-300'}`}>{note.title || 'Untitled note'}</span><span className="shrink-0 text-[10px] text-zinc-600">{formatDate(note.updatedAt)}</span></div><p className="mt-1 truncate text-xs text-zinc-600">{note.content || 'No content yet'}</p></button>)}
            {!filteredNotes.length && <p className="px-3 py-8 text-center text-xs text-zinc-600">No notes found</p>}
          </div>
          <div className="border-t border-white/[0.07] px-5 py-4 text-[11px] text-zinc-600">Saved locally in your browser</div>
        </aside>
        {isSidebarOpen && <button aria-label="Close sidebar overlay" onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 z-10 bg-black/60 md:hidden" />}
        <section className="flex min-w-0 flex-1 flex-col">
          <header className={`flex h-[76px] items-center justify-between border-b px-5 sm:px-9 ${isDark ? 'border-white/[0.07]' : 'border-black/[0.07]'}`}><div className="flex items-center gap-2"><button aria-label="Open notes sidebar" onClick={() => setIsSidebarOpen(true)} className="rounded-md p-2 text-zinc-500 hover:bg-black/5 hover:text-zinc-900 md:hidden"><Menu size={20} /></button><button aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'} onClick={() => setIsDark((current) => !current)} className="rounded-md p-2 text-zinc-500 transition hover:bg-black/5 hover:text-zinc-900" title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}>{isDark ? <Sun size={17} /> : <Moon size={17} />}</button></div><div className="ml-auto flex items-center gap-4"><span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-[10px] font-medium ${isOnline ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400' : 'border-amber-500/20 bg-amber-500/10 text-amber-400'}`}><span className={`size-1.5 rounded-full ${isOnline ? 'bg-emerald-400' : 'bg-amber-400'}`} />{isOnline ? 'Online' : 'Offline'}</span><span className="hidden text-xs text-zinc-600 sm:inline">All changes saved</span><button aria-label="Delete note" onClick={deleteNote} className="rounded-md p-2 text-zinc-500 transition hover:bg-red-500/10 hover:text-red-400"><Trash2 size={17} /></button></div></header>
          {activeNote ? <article className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-6 py-12 sm:px-10 sm:py-16"><input value={activeNote.title} onChange={(event) => updateActive('title', event.target.value)} aria-label="Note title" placeholder="Untitled note" className="mb-8 w-full bg-transparent text-3xl font-semibold tracking-[-0.03em] text-white outline-none placeholder:text-zinc-700 sm:text-4xl" /><textarea value={activeNote.content} onChange={(event) => updateActive('content', event.target.value)} aria-label="Note content" placeholder="Start writing..." className="min-h-[55vh] flex-1 resize-none bg-transparent text-[15px] leading-8 text-zinc-400 outline-none placeholder:text-zinc-700" /><footer className="mt-8 flex items-center justify-between border-t border-white/[0.06] pt-4 text-[11px] text-zinc-600"><span>Markdown supported</span><span>{activeNote.content.length} characters</span></footer></article> : <div className="flex flex-1 items-center justify-center text-sm text-zinc-600">Create a note to get started</div>}
        </section>
      </div>
    </main>
  )
}
