import { roundToDecimals } from './utils'
import { Vector1D } from './vector1d'

export type Translate = {
  to: (vector: Vector1D) => void
}

export function Translate(node: HTMLElement): Translate {
  const roundToTwoDecimals = roundToDecimals(2)
  let translate = 0

  function translateX(n: number): string {
    return `translate3d(${n}%,0px,0px)`
  }

  function to(v: Vector1D): void {
    const target = roundToTwoDecimals(v.get())
    if (translate === target) return

    getComputedStyle(node).transform
    node.style.transform = translateX(target)
    translate = target
  }

  const self: Translate = {
    to,
  }
  return Object.freeze(self)
}
