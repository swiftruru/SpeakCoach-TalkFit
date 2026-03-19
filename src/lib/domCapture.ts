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
  padding?: number | Partial<Record<'top' | 'right' | 'bottom' | 'left', number>>
  scale?: number
  creditLabel?: string
  beforeSerialize?: (clone: HTMLElement) => void
}

function resolvePadding(
  padding: number | Partial<Record<'top' | 'right' | 'bottom' | 'left', number>>
) {
  if (typeof padding === 'number') {
    return { top: padding, right: padding, bottom: padding, left: padding }
  }

  return {
    top: padding.top ?? 0,
    right: padding.right ?? 0,
    bottom: padding.bottom ?? 0,
    left: padding.left ?? 0,
  }
}

export async function downloadElementAsPng(
  element: HTMLElement,
  {
    fileName,
    background = '#f8f9fa',
    padding = 24,
    scale = 2,
    creditLabel,
    beforeSerialize,
  }: DownloadElementAsPngOptions
) {
  const resolvedPadding = resolvePadding(padding)
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
  outputCanvas.width = renderedCanvas.width + (resolvedPadding.left + resolvedPadding.right) * scale
  outputCanvas.height = renderedCanvas.height + (resolvedPadding.top + resolvedPadding.bottom) * scale

  const context = outputCanvas.getContext('2d')
  if (!context) {
    throw new Error('Canvas 2D context is unavailable')
  }

  context.fillStyle = background
  context.fillRect(0, 0, outputCanvas.width, outputCanvas.height)
  context.drawImage(
    renderedCanvas,
    resolvedPadding.left * scale,
    resolvedPadding.top * scale,
    renderedCanvas.width,
    renderedCanvas.height
  )

  if (creditLabel) {
    context.save()
    context.textAlign = 'right'
    context.textBaseline = 'middle'
    context.font = `${Math.round(12 * scale)}px ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`
    context.fillStyle = '#64748b'
    context.fillText(
      creditLabel,
      outputCanvas.width - resolvedPadding.right * scale,
      outputCanvas.height - (resolvedPadding.bottom * scale) / 2
    )
    context.restore()
  }

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
