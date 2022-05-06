type Action = (factor: number) => Promise<void>

const elementToWatch: [HTMLElement | string, Action][] = []

const updateScrollAnimations = async function () {
  let pageScroll = window.pageYOffset || document.documentElement.scrollTop

  for (let [element, action] of elementToWatch) {
    if (typeof element === "string") {
      const maybeElement = document.getElementById(element)
      if (!maybeElement) continue
      element = maybeElement
    }

    const {height, y} = element.getBoundingClientRect()

    const position = pageScroll - y

    if (position >= 0 && position <= height) {
      let factor: number = (position / height)
      if (isNaN(factor)) factor = 1.0

      action(factor)
    }
  }
}

window.onscroll = updateScrollAnimations
window.onpageshow = updateScrollAnimations

export default function animate(element: HTMLElement | string, action: Action) {
  elementToWatch.push([element, action])
}
