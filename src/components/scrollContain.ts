import { Alignment } from './alignment'
import { Limit } from './limit'

export type ScrollContains = '' | 'trimSnaps' | 'keepSnaps'

type Params = {
  contentSize: number
  viewSize: number
  alignment: Alignment
}

export type ScrollContain = {
  snaps: (scrollSnaps: number[], trim: boolean) => number[]
}

export function ScrollContain(params: Params): ScrollContain {
  const { alignment, contentSize, viewSize } = params
  const scrollBounds = Limit({ min: -contentSize + viewSize, max: 0 })
  const alignedWithinView = [alignment.measure(contentSize)]
  const contentExceedsView = contentSize > viewSize

  function findDuplicates(scrollSnaps: number[]): Limit {
    const startSnap = scrollSnaps[0]
    const endSnap = scrollSnaps[scrollSnaps.length - 1]
    const min = scrollSnaps.lastIndexOf(startSnap) + 1
    const max = scrollSnaps.indexOf(endSnap)
    return Limit({ min, max })
  }

  function snaps(scrollSnaps: number[], trim: boolean): number[] {
    const containedSnaps = scrollSnaps.map(scrollBounds.constrain)
    const { min, max } = findDuplicates(containedSnaps)

    if (!contentExceedsView) return alignedWithinView
    if (!trim) return containedSnaps
    return containedSnaps.slice(min - 1, max + 1)
  }

  const self: ScrollContain = {
    snaps,
  }
  return Object.freeze(self)
}
