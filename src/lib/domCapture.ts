function collectStyleText() {
  return Array.from(document.styleSheets)
    .map((styleSheet) => {
      try {
        return Array.from(styleSheet.cssRules)
          .map((rule) => rule.cssText)
          .join('\n')
      } catch {
        return ''
      }
    })
    .filter(Boolean)
    .join('\n')
}

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

function normalizeImages(cloneRoot: Element) {
  cloneRoot.querySelectorAll<HTMLImageElement>('img').forEach((img) => {
    if (img.currentSrc) {
      img.setAttribute('src', img.currentSrc)
      return
    }

    if (img.src) {
      img.setAttribute('src', img.src)
    }
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
  const rect = element.getBoundingClientRect()
  const width = Math.ceil(rect.width)
  const height = Math.ceil(rect.height)
  const captureWidth = width + padding * 2
  const captureHeight = height + padding * 2

  const clone = element.cloneNode(true) as HTMLElement
  clone.style.width = `${width}px`
  clone.style.height = `${height}px`
  clone.style.maxWidth = 'none'
  clone.style.maxHeight = 'none'
  clone.style.margin = '0'
  clone.style.transform = 'none'
  clone.style.opacity = '1'

  syncScrollPositions(element, clone)
  normalizeImages(clone)

  clone.querySelectorAll<HTMLElement>('[data-capture-ignore]').forEach((node) => node.remove())

  beforeSerialize?.(clone)

  const styles = collectStyleText()
  const serializer = new XMLSerializer()
  const markup = serializer.serializeToString(clone)

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${captureWidth}" height="${captureHeight}" viewBox="0 0 ${captureWidth} ${captureHeight}">
      <foreignObject x="0" y="0" width="100%" height="100%">
        <div xmlns="http://www.w3.org/1999/xhtml" style="width:${captureWidth}px;height:${captureHeight}px;background:${background};padding:${padding}px;box-sizing:border-box;overflow:hidden;">
          <style>${styles}</style>
          ${markup}
        </div>
      </foreignObject>
    </svg>
  `.trim()

  const svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' })
  const svgUrl = URL.createObjectURL(svgBlob)

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image()
      img.decoding = 'async'
      img.onload = () => resolve(img)
      img.onerror = () => reject(new Error('Failed to load generated capture image'))
      img.src = svgUrl
    })

    const canvas = document.createElement('canvas')
    canvas.width = captureWidth * scale
    canvas.height = captureHeight * scale

    const context = canvas.getContext('2d')
    if (!context) {
      throw new Error('Canvas 2D context is unavailable')
    }

    context.scale(scale, scale)
    context.drawImage(image, 0, 0, captureWidth, captureHeight)

    const pngBlob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => {
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
    URL.revokeObjectURL(svgUrl)
  }
}
