type EventRemover = () => void
type EventHandler = EventListener | EventListenerObject | null
type EventOptions = boolean | EventListenerOptions | undefined

export type EventStore = {
  add: (
    node: EventTarget,
    type: string,
    handler: EventHandler,
    options?: EventOptions,
  ) => EventStore
  removeAll: () => EventStore
}

export function EventStore(): EventStore {
  const listeners: EventRemover[] = []

  function add(
    node: EventTarget,
    type: string,
    handler: EventHandler,
    options: EventOptions = false,
  ): EventStore {
    node.addEventListener(type, handler, options)
    listeners.push(() => {
      return node.removeEventListener(type, handler, options)
    })
    return self
  }

  function removeAll(): EventStore {
    listeners.filter(remove => remove())
    listeners.length = 0
    return self
  }

  const self: EventStore = {
    add,
    removeAll,
  }
  return Object.freeze(self)
}
