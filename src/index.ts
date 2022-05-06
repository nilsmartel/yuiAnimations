
const elementToWatch: [HTMLElement | string, (factor: number) => void][] = []

window.onscroll = async function (event) {
  let pageScroll = window.pageYOffset || document.documentElement.scrollTop

  for (let [element, action] of elementToWatch) {
    if (typeof element === 'string') {
      const maybeElement = document.getElementById(element)
      if (!maybeElement) continue
      element = maybeElement
    }

    const {height, y} = element.getBoundingClientRect()

    const position = pageScroll - y

    if (position >= 0 && position <= height) {
      const factor = position / height
      action(factor)
    }

  }
}

export default function animate(element: HTMLElement | string, action: (factor: number) => void) {
  elementToWatch.push([element, action])
}
