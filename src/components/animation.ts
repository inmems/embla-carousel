type Callback = () => void

export type Animation = {
  start: () => void
  stop: () => void
  proceed: () => void
}

export function Animation(callback: FrameRequestCallback): Animation {
  const run = requestAnimationFrame.bind(window)
  const end = cancelAnimationFrame.bind(window)
  let animationFrame = 0

  function ifAnimating(active: boolean, cb: Callback): Callback {
    return (): void => {
      if (active === !!animationFrame) cb()
    }
  }

  function start(): void {
    animationFrame = run(callback)
  }

  function stop(): void {
    end(animationFrame)
    animationFrame = 0
  }

  const self: Animation = {
    proceed: ifAnimating(true, start),
    start: ifAnimating(false, start),
    stop: ifAnimating(true, stop),
  }
  return Object.freeze(self)
}
