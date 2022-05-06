type Action = (factor: number) => Promise<void>

const elementToWatch: [HTMLElement | string, Action][] = []

window.onscroll = async function () {
  let pageScroll = window.pageYOffset || document.documentElement.scrollTop

  for (let [element, action] of elementToWatch) {
    if (typeof element === "string") {
      const maybeElement = document.getElementById(element)
      if (!maybeElement) continue
      element = maybeElement
    }

    const { height, y } = element.getBoundingClientRect()

    const position = pageScroll - y

    if (position >= 0 && position <= height) {
      const factor = position / height
      action(factor)
    }
  }
}

export default function animate(element: HTMLElement | string, action: Action) {
  elementToWatch.push([element, action])
}
