import html2canvas from 'html2canvas'

function syncScrollPositions(sourceRoot: Element, cloneRoot: Element) {
  const sourceElements = [sourceRoot, ...Array.from(sourceRoot.querySelectorAll<HTMLElement>('*'))]
  const cloneElements = [cloneRoot, ...Array.from(cloneRoot.querySelectorAll<HTMLElement>('*'))]

  sourceElements.forEach((source, index) => {
    const clone = cloneElements[index]
    if (!(source instanceof HTMLElement) || !(clone instanceof HTMLElement)) return
    clone.scrollTop = source.scrollTop
    clone.scrollLeft = source.scrollLeft
  })
}

interface DownloadElementAsPngOptions {
  fileName: string
  background?: string
  padding?: number
  scale?: number
  beforeSerialize?: (clone: HTMLElement) => void
}

export async function downloadElementAsPng(
  element: HTMLElement,
  {
    fileName,
    background = '#f8f9fa',
    padding = 24,
    scale = 2,
    beforeSerialize,
  }: DownloadElementAsPngOptions
) {
  const renderedCanvas = await html2canvas(element, {
    backgroundColor: null,
    scale,
    useCORS: true,
    allowTaint: false,
    logging: false,
    foreignObjectRendering: false,
    windowWidth: document.documentElement.clientWidth,
    windowHeight: document.documentElement.clientHeight,
    scrollX: window.scrollX,
    scrollY: window.scrollY,
    onclone: (clonedDocument, clonedElement) => {
      syncScrollPositions(element, clonedElement)

      clonedElement.querySelectorAll<HTMLElement>('[data-capture-ignore]').forEach((node) => node.remove())
      beforeSerialize?.(clonedElement)

      clonedDocument.querySelectorAll<HTMLElement>('[data-capture-ignore]').forEach((node) => node.remove())
    },
  })

  const outputCanvas = document.createElement('canvas')
  outputCanvas.width = renderedCanvas.width + padding * 2 * scale
  outputCanvas.height = renderedCanvas.height + padding * 2 * scale

  const context = outputCanvas.getContext('2d')
  if (!context) {
    throw new Error('Canvas 2D context is unavailable')
  }

  context.fillStyle = background
  context.fillRect(0, 0, outputCanvas.width, outputCanvas.height)
  context.drawImage(renderedCanvas, padding * scale, padding * scale, renderedCanvas.width, renderedCanvas.height)

  const pngBlob = await new Promise<Blob>((resolve, reject) => {
    outputCanvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Failed to export PNG blob'))
        return
      }
      resolve(blob)
    }, 'image/png')
  })

  const downloadUrl = URL.createObjectURL(pngBlob)
  const link = document.createElement('a')
  link.href = downloadUrl
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(downloadUrl)
}
