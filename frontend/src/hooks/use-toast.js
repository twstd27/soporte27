import { useState } from "react"

const TOAST_LIMIT = 5
const TOAST_REMOVE_DELAY = 4000

let count = 0
function genId() { return `toast-${++count}` }

const listeners = []
let memoryState = { toasts: [] }

function dispatch(action) {
  memoryState = reducer(memoryState, action)
  listeners.forEach(listener => listener(memoryState))
}

function reducer(state, action) {
  switch (action.type) {
    case "ADD_TOAST":
      return { ...state, toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT) }
    case "DISMISS_TOAST":
      return { ...state, toasts: state.toasts.map(t => t.id === action.toastId ? { ...t, open: false } : t) }
    case "REMOVE_TOAST":
      return { ...state, toasts: state.toasts.filter(t => t.id !== action.toastId) }
    default:
      return state
  }
}

function toast({ ...props }) {
  const id = genId()
  dispatch({ type: "ADD_TOAST", toast: { ...props, id, open: true, onOpenChange: (open) => { if (!open) { setTimeout(() => dispatch({ type: "REMOVE_TOAST", toastId: id }), 300) } } } })
  setTimeout(() => dispatch({ type: "DISMISS_TOAST", toastId: id }), TOAST_REMOVE_DELAY)
  return id
}

function useToast() {
  const [state, setState] = useState(memoryState)
  useState(() => {
    listeners.push(setState)
    return () => {
      const index = listeners.indexOf(setState)
      if (index > -1) listeners.splice(index, 1)
    }
  })
  return { ...state, toast, dismiss: (id) => dispatch({ type: "DISMISS_TOAST", toastId: id }) }
}

export { useToast, toast }
