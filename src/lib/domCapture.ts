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
  crop?: Partial<Record<'x' | 'y' | 'width' | 'height', number>>
  creditLabel?: string
  beforeSerialize?: (clone: HTMLElement) => void
  foreignObjectRendering?: boolean
  detachedRender?: boolean
}

function isCanvasMostlyTransparent(canvas: HTMLCanvasElement) {
  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) return false

  const { width, height } = canvas
  if (width === 0 || height === 0) return true

  const stepX = Math.max(1, Math.floor(width / 48))
  const stepY = Math.max(1, Math.floor(height / 96))
  const image = context.getImageData(0, 0, width, height).data

  let sampled = 0
  let transparent = 0

  for (let y = 0; y < height; y += stepY) {
    for (let x = 0; x < width; x += stepX) {
      const alpha = image[(y * width + x) * 4 + 3]
      sampled += 1
      if (alpha < 8) transparent += 1
    }
  }

  return sampled > 0 && transparent / sampled > 0.995
}

async function renderElementToCanvas(
  element: HTMLElement,
  scale: number,
  foreignObjectRendering: boolean,
  beforeSerialize?: (clone: HTMLElement) => void
) {
  return html2canvas(element, {
    backgroundColor: null,
    scale,
    useCORS: true,
    allowTaint: false,
    logging: false,
    foreignObjectRendering,
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
    crop,
    creditLabel,
    beforeSerialize,
    foreignObjectRendering = false,
    detachedRender = false,
  }: DownloadElementAsPngOptions
) {
  if ('fonts' in document) {
    try {
      await document.fonts.ready
    } catch {
      // Ignore font readiness failures and continue with capture.
    }
  }

  let captureElement = element
  let detachedHost: HTMLDivElement | null = null

  if (detachedRender) {
    detachedHost = document.createElement('div')
    detachedHost.style.position = 'fixed'
    detachedHost.style.left = '-20000px'
    detachedHost.style.top = '0'
    detachedHost.style.zIndex = '-1'
    detachedHost.style.pointerEvents = 'none'
    detachedHost.style.opacity = '1'
    detachedHost.style.background = 'transparent'

    const detachedClone = element.cloneNode(true) as HTMLElement
    const width = element.offsetWidth || Math.round(element.getBoundingClientRect().width)
    const height = element.offsetHeight || Math.round(element.getBoundingClientRect().height)
    detachedClone.style.width = `${width}px`
    detachedClone.style.height = `${height}px`
    detachedClone.style.margin = '0'
    detachedClone.style.transform = 'none'
    detachedClone.style.transformOrigin = 'top left'

    detachedHost.appendChild(detachedClone)
    document.body.appendChild(detachedHost)
    syncScrollPositions(element, detachedClone)
    captureElement = detachedClone
  }

  try {
    const resolvedPadding = resolvePadding(padding)
    let renderedCanvas = await renderElementToCanvas(
      captureElement,
      scale,
      foreignObjectRendering,
      beforeSerialize
    )

    // Safari/WebKit can produce a fully transparent canvas when foreignObject
    // rendering is enabled. Fall back to the regular renderer instead of
    // exporting a blank PNG.
    if (foreignObjectRendering && isCanvasMostlyTransparent(renderedCanvas)) {
      renderedCanvas = await renderElementToCanvas(
        captureElement,
        scale,
        false,
        beforeSerialize
      )
    }

    const cropRect = crop
      ? {
          x: Math.max(0, Math.round((crop.x ?? 0) * scale)),
          y: Math.max(0, Math.round((crop.y ?? 0) * scale)),
          width: Math.max(1, Math.round((crop.width ?? 0) * scale)),
          height: Math.max(1, Math.round((crop.height ?? 0) * scale)),
        }
      : {
          x: 0,
          y: 0,
          width: renderedCanvas.width,
          height: renderedCanvas.height,
        }

    const outputCanvas = document.createElement('canvas')
    outputCanvas.width = cropRect.width + (resolvedPadding.left + resolvedPadding.right) * scale
    outputCanvas.height = cropRect.height + (resolvedPadding.top + resolvedPadding.bottom) * scale

    const context = outputCanvas.getContext('2d')
    if (!context) {
      throw new Error('Canvas 2D context is unavailable')
    }

    context.fillStyle = background
    context.fillRect(0, 0, outputCanvas.width, outputCanvas.height)
    context.drawImage(
      renderedCanvas,
      cropRect.x,
      cropRect.y,
      cropRect.width,
      cropRect.height,
      resolvedPadding.left * scale,
      resolvedPadding.top * scale,
      cropRect.width,
      cropRect.height
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
  } finally {
    detachedHost?.remove()
  }
}
