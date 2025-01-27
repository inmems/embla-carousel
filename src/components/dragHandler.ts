import { Animation } from './animation'
import { Counter } from './counter'
import { Direction } from './direction'
import { DragTracker } from './dragTracker'
import { EventDispatcher } from './eventDispatcher'
import { EventStore } from './eventStore'
import { Limit } from './limit'
import { ScrollBody } from './scrollBody'
import { ScrollTo } from './scrollTo'
import { Vector1D } from './vector1d'

type Params = {
  element: HTMLElement
  target: Vector1D
  dragFree: boolean
  snapSizes: number[]
  dragTracker: DragTracker
  location: Vector1D
  animation: Animation
  scrollTo: ScrollTo
  scrollBody: ScrollBody
  index: Counter
  limit: Limit
  loop: boolean
  events: EventDispatcher
}

export type DragHandler = {
  addActivationEvents: () => void
  clickAllowed: () => boolean
  pointerDown: () => boolean
  removeAllEvents: () => void
}

export function DragHandler(params: Params): DragHandler {
  const { target, scrollBody, dragFree, animation } = params
  const { element, dragTracker, location, events, limit } = params
  const focusNodes = ['INPUT', 'SELECT', 'TEXTAREA']
  const startX = Vector1D(0)
  const startY = Vector1D(0)
  const dragStartLocation = Vector1D(0)
  const activationEvents = EventStore()
  const interactionEvents = EventStore()
  const snapForceBoost = { mouse: 2.5, touch: 3.5 }
  const freeForceBoost = { mouse: 4, touch: 7 }
  const snapSpeed = { mouse: 12, touch: 14 }
  const freeSpeed = { mouse: 6, touch: 5 }
  const dragThreshold = 4
  let pointerIsDown = false
  let preventScroll = false
  let preventClick = false
  let isMouse = false

  function addActivationEvents(): void {
    const node = element
    activationEvents
      .add(node, 'touchmove', () => undefined)
      .add(node, 'touchend', () => undefined)
      .add(node, 'touchstart', down)
      .add(node, 'mousedown', down)
      .add(node, 'touchcancel', up)
      .add(node, 'contextmenu', up)
      .add(node, 'click', click)
  }

  function addInteractionEvents(): void {
    const node = !isMouse ? element : document
    interactionEvents
      .add(node, 'touchmove', move)
      .add(node, 'touchend', up)
      .add(node, 'mousemove', move)
      .add(node, 'mouseup', up)
  }

  function removeAllEvents(): void {
    activationEvents.removeAll()
    interactionEvents.removeAll()
  }

  function isFocusNode(node: Element): boolean {
    const name = node.nodeName || ''
    return focusNodes.indexOf(name) > -1
  }

  function movementSpeed(): number {
    const speed = dragFree ? freeSpeed : snapSpeed
    const type = isMouse ? 'mouse' : 'touch'
    return speed[type]
  }

  function dragForceBoost(): number {
    const boost = dragFree ? freeForceBoost : snapForceBoost
    const type = isMouse ? 'mouse' : 'touch'
    return boost[type]
  }

  function seekTargetBy(force: number): void {
    const { scrollTo, snapSizes, index } = params
    const forceAbs = Math.abs(force)
    const halfSnap = snapSizes[index.get()] / 2
    const reachedLimit = limit.reachedAny(target.get() + force)
    const seekNext = forceAbs > dragThreshold && forceAbs < halfSnap

    if (!dragFree && !reachedLimit && seekNext) {
      const indexDiff = Direction(force).get() * -1
      const next = index.clone().add(indexDiff)
      scrollTo.index(next.get(), 0)
    } else {
      scrollTo.distance(force, !dragFree)
    }
  }

  function down(evt: Event): void {
    isMouse = evt.type === 'mousedown'
    const diffToTarget = target.get() - location.get()
    const isMoving = Math.abs(diffToTarget) >= 2
    const clearPreventClick = isMouse || !isMoving
    const isNotFocusNode = !isFocusNode(evt.target as Element)
    const preventDefault = isMoving || (isMouse && isNotFocusNode)

    if (isMouse && (evt as MouseEvent).button !== 0) return

    pointerIsDown = true
    dragTracker.pointerDown(evt)
    dragStartLocation.set(target)
    target.set(location)
    scrollBody.useDefaultMass().useSpeed(80)
    addInteractionEvents()
    animation.start()
    startX.set(dragTracker.readPoint(evt, 'x'))
    startY.set(dragTracker.readPoint(evt, 'y'))
    events.dispatch('dragStart')

    if (clearPreventClick) preventClick = false
    if (preventDefault) evt.preventDefault()
  }

  function move(evt: Event): void {
    if (!preventScroll && !isMouse) {
      const X = dragTracker.readPoint(evt, 'x').get()
      const Y = dragTracker.readPoint(evt, 'y').get()
      const diffX = Math.abs(X - startX.get())
      const diffY = Math.abs(Y - startY.get())
      preventScroll = diffX > diffY
      if (!preventScroll && !preventClick) return up()
    }
    const diff = dragTracker.pointerMove(evt)
    const reachedLimit = limit.reachedAny(location.get())
    const resist = !params.loop && reachedLimit ? 2 : 1

    if (!preventClick && diff) preventClick = true
    target.add(diff / resist)
    evt.preventDefault()
  }

  function up(): void {
    const force = dragTracker.pointerUp() * dragForceBoost()
    const diffToTarget = target.get() - dragStartLocation.get()
    const isMoving = Math.abs(diffToTarget) >= 0.5

    if (isMoving && !isMouse) preventClick = true
    isMouse = false
    preventScroll = false
    pointerIsDown = false
    interactionEvents.removeAll()
    scrollBody.useSpeed(movementSpeed())
    seekTargetBy(force)
    events.dispatch('dragEnd')
  }

  function click(evt: Event): void {
    if (preventClick) evt.preventDefault()
  }

  function clickAllowed(): boolean {
    return !preventClick
  }

  function pointerDown(): boolean {
    return pointerIsDown
  }

  const self: DragHandler = {
    addActivationEvents,
    clickAllowed,
    pointerDown,
    removeAllEvents,
  }
  return Object.freeze(self)
}
