import { useState } from 'react'
import { useAllMenuItems, useUpdateMenuItem, useAddMenuItem, useDeleteMenuItem } from '../../hooks/useMenuAdmin'
import { AdminNav } from '../../components/AdminNav'
import { Spinner } from '../../components/Spinner'
import { ErrorMessage } from '../../components/ErrorMessage'
import { DietaryBadge } from '../../components/DietaryBadge'
import type { MenuItem } from '../../lib/types'

const CATEGORIES = ['food', 'snack', 'drink']
const DIETARY_OPTIONS = ['vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'nut-free', 'halal', 'kosher']

// ─── Inline row editor ────────────────────────────────────────────────────────

function MenuRow({ item }: { item: MenuItem }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(item)
  const { mutate: update, isPending: saving } = useUpdateMenuItem()
  const { mutate: remove, isPending: deleting } = useDeleteMenuItem()

  function save() {
    update(
      { id: item.id, values: draft },
      { onSuccess: () => setEditing(false) }
    )
  }

  function toggleAvailable() {
    update({ id: item.id, values: { available: !item.available } })
  }

  function toggleDietaryTag(tag: string) {
    const tags = draft.dietary_tags.includes(tag)
      ? draft.dietary_tags.filter((t) => t !== tag)
      : [...draft.dietary_tags, tag]
    setDraft({ ...draft, dietary_tags: tags })
  }

  if (editing) {
    return (
      <tr className="bg-gray-900">
        <td className="table-td" colSpan={6}>
          <div className="flex flex-col gap-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="label">Name</label>
                <input
                  className="input"
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Price ($)</label>
                <input
                  className="input"
                  type="number"
                  step="0.50"
                  min="0"
                  value={draft.price}
                  onChange={(e) => setDraft({ ...draft, price: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <label className="label">Category</label>
                <select
                  className="input"
                  value={draft.category}
                  onChange={(e) => setDraft({ ...draft, category: e.target.value })}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="label">Description</label>
              <input
                className="input"
                value={draft.description ?? ''}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Dietary tags</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {DIETARY_OPTIONS.map((tag) => (
                  <label key={tag} className="flex items-center gap-1.5 text-xs text-gray-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={draft.dietary_tags.includes(tag)}
                      onChange={() => toggleDietaryTag(tag)}
                      className="w-3.5 h-3.5 rounded"
                    />
                    {tag}
                  </label>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={save} disabled={saving} className="btn-primary">
                {saving ? 'Saving…' : 'Save changes'}
              </button>
              <button
                onClick={() => { setDraft(item); setEditing(false) }}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </td>
      </tr>
    )
  }

  return (
    <tr className={`hover:bg-gray-900 transition-colors ${!item.available ? 'opacity-50' : ''}`}>
      <td className="table-td font-medium">
        <div>{item.name}</div>
        {item.description && (
          <div className="text-xs text-gray-500 mt-0.5">{item.description}</div>
        )}
      </td>
      <td className="table-td capitalize text-gray-400">{item.category}</td>
      <td className="table-td font-bold text-brand-400">${item.price.toFixed(2)}</td>
      <td className="table-td">
        <div className="flex flex-wrap gap-1">
          {item.dietary_tags.length === 0
            ? <span className="text-gray-600 text-xs">—</span>
            : item.dietary_tags.map((t) => <DietaryBadge key={t} tag={t} />)
          }
        </div>
      </td>
      <td className="table-td">
        <button
          onClick={toggleAvailable}
          className={`badge border cursor-pointer transition-colors ${
            item.available
              ? 'bg-green-950 text-green-400 border-green-800 hover:bg-red-950 hover:text-red-400 hover:border-red-800'
              : 'bg-red-950 text-red-400 border-red-800 hover:bg-green-950 hover:text-green-400 hover:border-green-800'
          }`}
          title={item.available ? 'Click to hide from menu' : 'Click to show on menu'}
        >
          {item.available ? 'Available' : 'Hidden'}
        </button>
      </td>
      <td className="table-td">
        <div className="flex gap-2">
          <button
            onClick={() => setEditing(true)}
            className="btn-secondary text-xs px-2 py-1"
          >
            Edit
          </button>
          <button
            onClick={() => {
              if (confirm(`Delete "${item.name}"?`)) remove(item.id)
            }}
            disabled={deleting}
            className="btn-danger text-xs px-2 py-1"
          >
            Delete
          </button>
        </div>
      </td>
    </tr>
  )
}

// ─── Add new item form ────────────────────────────────────────────────────────

const BLANK: Omit<MenuItem, 'id'> = {
  name: '', description: '', price: 0, category: 'food', dietary_tags: [], available: true,
}

function AddItemForm({ onDone }: { onDone: () => void }) {
  const [draft, setDraft] = useState<Omit<MenuItem, 'id'>>(BLANK)
  const { mutate: add, isPending, error } = useAddMenuItem()

  function toggleTag(tag: string) {
    const tags = draft.dietary_tags.includes(tag)
      ? draft.dietary_tags.filter((t) => t !== tag)
      : [...draft.dietary_tags, tag]
    setDraft({ ...draft, dietary_tags: tags })
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!draft.name.trim()) return
    add(draft, { onSuccess: () => { setDraft(BLANK); onDone() } })
  }

  return (
    <form onSubmit={submit} className="card mt-6">
      <h2 className="font-semibold text-white mb-4">Add new item</h2>
      {error && <div className="mb-4"><ErrorMessage message={error.message} /></div>}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
        <div>
          <label className="label">Name *</label>
          <input
            className="input"
            required
            placeholder="Pepperoni Pizza"
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Price ($) *</label>
          <input
            className="input"
            type="number"
            step="0.50"
            min="0"
            required
            value={draft.price || ''}
            onChange={(e) => setDraft({ ...draft, price: parseFloat(e.target.value) || 0 })}
          />
        </div>
        <div>
          <label className="label">Category</label>
          <select
            className="input"
            value={draft.category}
            onChange={(e) => setDraft({ ...draft, category: e.target.value })}
          >
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>
      <div className="mb-3">
        <label className="label">Description</label>
        <input
          className="input"
          placeholder="Short description…"
          value={draft.description ?? ''}
          onChange={(e) => setDraft({ ...draft, description: e.target.value })}
        />
      </div>
      <div className="mb-4">
        <label className="label">Dietary tags</label>
        <div className="flex flex-wrap gap-2 mt-1">
          {DIETARY_OPTIONS.map((tag) => (
            <label key={tag} className="flex items-center gap-1.5 text-xs text-gray-300 cursor-pointer">
              <input
                type="checkbox"
                checked={draft.dietary_tags.includes(tag)}
                onChange={() => toggleTag(tag)}
                className="w-3.5 h-3.5 rounded"
              />
              {tag}
            </label>
          ))}
        </div>
      </div>
      <div className="flex gap-2">
        <button type="submit" disabled={isPending} className="btn-primary">
          {isPending ? 'Adding…' : 'Add item'}
        </button>
        <button type="button" onClick={onDone} className="btn-secondary">
          Cancel
        </button>
      </div>
    </form>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminMenuItems() {
  const { data: items, isLoading, error } = useAllMenuItems()
  const [showAdd, setShowAdd] = useState(false)

  if (isLoading) return <><AdminNav /><Spinner label="Loading menu…" /></>
  if (error)     return <><AdminNav /><ErrorMessage message="Failed to load menu items." /></>

  const available = items!.filter((i) => i.available).length
  const hidden    = items!.filter((i) => !i.available).length

  return (
    <div>
      <AdminNav />
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Menu items</h1>
          <p className="text-sm text-gray-400 mt-1">
            {available} available · {hidden} hidden
          </p>
        </div>
        <button
          onClick={() => setShowAdd((v) => !v)}
          className="btn-primary"
        >
          {showAdd ? 'Cancel' : '+ Add item'}
        </button>
      </div>

      {showAdd && <AddItemForm onDone={() => setShowAdd(false)} />}

      <div className="overflow-x-auto rounded-xl border border-gray-800 mt-6">
        <table className="w-full min-w-[700px]">
          <thead className="bg-gray-900 border-b border-gray-800">
            <tr>
              {['Item', 'Category', 'Price', 'Dietary tags', 'Status', 'Actions'].map((h) => (
                <th key={h} className="table-th">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800 bg-gray-950">
            {items!.map((item) => <MenuRow key={item.id} item={item} />)}
          </tbody>
        </table>
        {items!.length === 0 && (
          <p className="text-center text-gray-500 py-12 text-sm">No menu items yet.</p>
        )}
      </div>
    </div>
  )
}
