type Action = (factor: number) => void
type InterpolationFunction = (linear: number) => number

/**
 * Where on the screen an element needs to pass, for the animation to start playing.
 *
 * default is Top.
 */
export enum StartPosition {
  Top,
  Middle,
  Bottom,
}

export const Interpolation = {
  /**
   * default Interpolation,
   *
   * Pace stays consistent
   * Starts just a little abrupt
   * End just a little unexpected
   */
  Linear(x: number): number {
    return x
  },

  /**
   * Start slow, end hard
   */
  Quadratic(x: number): number {
    return x * x
  },

  /**
   * Start strong, end graceful
   */
  Root: Math.sqrt,

  Ease(x: number): number {
    return -0.5 * Math.cos(x * Math.PI) + 0.5
  },
}

interface WatchElement {
  element: HTMLElement | string
  action: Action
  state?: AnimationState
  startPosition: StartPosition
  id?: string
}

/**
 * Collection of all Elements we watch for our animation
 * alongside state to remember, whether we have already started our animations or not
 */
const elementsToWatch: WatchElement[] = []

enum AnimationState {
  Start,
  Between,
  End,
}

const updateScrollAnimations = function () {
  const screenSize = window.innerHeight
  const mid = screenSize >> 1
  const bottom = screenSize

  for (let index in elementsToWatch) {
    let { element, action, state, startPosition } = elementsToWatch[index]

    const setState = (state: AnimationState) => {
      elementsToWatch[index].state = state
    }

    if (typeof element === "string") {
      const maybeElement = document.getElementById(element)
      if (!maybeElement) continue
      element = maybeElement
    }

    let { height, y } = element.getBoundingClientRect()

    // Adjust the position to respect different start positions
    if (startPosition === StartPosition.Middle) y -= mid
    else if (startPosition === StartPosition.Bottom) y -= bottom

    let factor: number = -y / height
    if (isNaN(factor)) {
      // height might be 0
      // in that case we want to have abinary decision about being either in start or end animation state
      if (y > 0) factor = 0
      else factor = 1
    }

    // check if we're in between a running animation
    if (factor > 0 && factor < 1) {
      action(factor)
      setState(AnimationState.Between)
      // nothing left to consider now
      continue
    }

    // we want to run the animation at least once, to be consistent when it starts
    // this is guaranteed by the state beeing null only on startup,
    // and by some animation always happening in between, before and after an animation

    // we want to ensure that the animation is up to date before and after,
    // as to not leave the screen with intermediate artifacts, when the exact 0 | 1 point has been reached

    // check if we should be in start configuration (factor <= 0) but aren't
    if (factor <= 0 && state !== AnimationState.Start) {
      // if so, fire animation to make state consistent
      action(0)
      setState(AnimationState.Start)
      continue
    }

    // check if the animation should have ran already (factor >= 1), but hasn't
    if (factor >= 1 && state !== AnimationState.End) {
      action(1)
      setState(AnimationState.End)
      continue
    }
  }
}

window.onscroll = updateScrollAnimations

// Fire the animation frames on page load, to remain consistent later on
// Though we want to defer firing this event, until later in the event loop. This helps with responsive websites
window.onpageshow = () => window.setTimeout(updateScrollAnimations, 0)

/** Useful function, that one will find to need from time to time, when using this library.
 * Interpolates between 2 values, if used on the interval [0, 1]
 */
export const lerp = (a: number, b: number, x: number) => a + (b - a) * x

export interface Options {
  startPosition?: StartPosition
  interpolation?: InterpolationFunction
  id?: string
}

export default function animate(
  element: HTMLElement | string,
  action: Action,
  options?: Options
) {
  if (options?.interpolation) {
    const i = options?.interpolation
    action = (x: number) => action(i(x))
  }

  elementsToWatch.push({
    element,
    action,
    startPosition: options?.startPosition ?? StartPosition.Top,
    id: options?.id,
  })
}

export function revokeAnimation(key: {
  element?: HTMLElement | string
  action?: Action
  id?: string
}) {
  if (key.id) {
    const id = key.id

    const index = elementsToWatch.findIndex((elem) => elem.id === id)
    if (index === -1)
      throw Error(
        "No element found with index ${index}. Failed to remove from animation list"
      )

    elementsToWatch.splice(index, 1)
    return
  }

  const { element, action } = key
  if (!element || !action)
    throw Error(
      "can't revoke element of type undefined or action of type undefind"
    )

  const index = elementsToWatch.findIndex(
    (elem) => elem.element === element && elem.action === action
  )
  if (index === -1)
    throw Error(
      "No element or action matches predicate. Failed to remove from animation list"
    )

  elementsToWatch.splice(index, 1)
}
