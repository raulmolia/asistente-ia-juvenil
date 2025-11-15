import { jsPDF } from "jspdf"
import { saveAs } from "file-saver"

// Función para convertir markdown a texto plano con formato básico
function markdownToPlainText(markdown: string): string {
    return markdown
        .replace(/^#{1,6}\s+(.+)$/gm, "$1") // Headers
        .replace(/\*\*(.+?)\*\*/g, "$1") // Bold
        .replace(/\*(.+?)\*/g, "$1") // Italic
        .replace(/`(.+?)`/g, "$1") // Code inline
        .replace(/```[\s\S]*?```/g, "") // Code blocks
        .replace(/^\s*[-*+]\s+/gm, "• ") // Bullets
        .replace(/^\s*\d+\.\s+/gm, "") // Numbered lists
}

// Función para parsear markdown en secciones
function parseMarkdown(markdown: string): Array<{ type: string; content: string; level?: number }> {
    const lines = markdown.split("\n")
    const sections: Array<{ type: string; content: string; level?: number }> = []

    let inCodeBlock = false
    let codeBlockContent = ""

    for (const line of lines) {
        // Manejar bloques de código
        if (line.trim().startsWith("```")) {
            if (inCodeBlock) {
                sections.push({ type: "code", content: codeBlockContent.trim() })
                codeBlockContent = ""
            }
            inCodeBlock = !inCodeBlock
            continue
        }

        if (inCodeBlock) {
            codeBlockContent += line + "\n"
            continue
        }

        // Headers
        const headerMatch = line.match(/^(#{1,6})\s+(.+)$/)
        if (headerMatch) {
            sections.push({ type: "heading", content: headerMatch[2], level: headerMatch[1].length })
            continue
        }

        // Bullets
        if (line.match(/^\s*[-*+]\s+(.+)$/)) {
            sections.push({ type: "bullet", content: line.replace(/^\s*[-*+]\s+/, "") })
            continue
        }

        // Numbered list
        if (line.match(/^\s*\d+\.\s+(.+)$/)) {
            sections.push({ type: "numbered", content: line.replace(/^\s*\d+\.\s+/, "") })
            continue
        }

        // Paragraph
        if (line.trim()) {
            sections.push({ type: "paragraph", content: line })
        }
    }

    return sections
}

// Función para cargar imagen
function loadImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image()
        img.crossOrigin = "anonymous"
        img.onload = () => resolve(img)
        img.onerror = reject
        img.src = url
    })
}

// Función para convertir blob a base64
function blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onloadend = () => {
            if (typeof reader.result === "string") {
                resolve(reader.result)
            } else {
                reject(new Error("Failed to convert blob to base64"))
            }
        }
        reader.onerror = reject
        reader.readAsDataURL(blob)
    })
}

// Función para generar PDF
export async function downloadAsPDF(content: string, filename: string = "respuesta-ia.pdf") {
    const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
    })

    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 20
    const maxWidth = pageWidth - 2 * margin
    let yPosition = margin

    // Añadir logo centrado
    try {
        const logoImg = await loadImage("/Logotipo RPJ.jpg")
        const logoWidth = 50
        const logoHeight = (logoImg.height * logoWidth) / logoImg.width
        const logoX = (pageWidth - logoWidth) / 2
        doc.addImage(logoImg.src, "JPEG", logoX, yPosition, logoWidth, logoHeight)
        yPosition += logoHeight + 15
    } catch (error) {
        console.warn("No se pudo cargar el logo:", error)
    }

    // Parsear el markdown
    const sections = parseMarkdown(content)

    // Añadir contenido
    doc.setFont("helvetica")

    for (const section of sections) {
        // Verificar si necesitamos una nueva página
        if (yPosition > pageHeight - margin) {
            doc.addPage()
            yPosition = margin
        }

        if (section.type === "heading") {
            // Headers
            const fontSize = section.level === 1 ? 18 : section.level === 2 ? 14 : 12
            doc.setFontSize(fontSize)
            doc.setFont("helvetica", "bold")
            const lines = doc.splitTextToSize(section.content, maxWidth)
            doc.text(lines, margin, yPosition)
            yPosition += lines.length * 7 + 5
            doc.setFont("helvetica", "normal")
        } else if (section.type === "bullet") {
            // Bullets
            doc.setFontSize(11)
            const lines = doc.splitTextToSize("• " + section.content, maxWidth - 5)
            doc.text(lines, margin + 5, yPosition)
            yPosition += lines.length * 6 + 2
        } else if (section.type === "numbered") {
            // Numbered lists
            doc.setFontSize(11)
            const lines = doc.splitTextToSize(section.content, maxWidth - 5)
            doc.text(lines, margin + 5, yPosition)
            yPosition += lines.length * 6 + 2
        } else if (section.type === "code") {
            // Code blocks
            doc.setFontSize(9)
            doc.setFont("courier")
            doc.setFillColor(240, 240, 240)
            const codeLines = section.content.split("\n")
            const lineHeight = 5

            // Calcular altura del bloque
            const blockHeight = codeLines.length * lineHeight + 4

            // Verificar si cabe en la página
            if (yPosition + blockHeight > pageHeight - margin) {
                doc.addPage()
                yPosition = margin
            }

            // Dibujar fondo
            doc.rect(margin, yPosition - 2, maxWidth, blockHeight, "F")

            // Añadir texto
            for (const codeLine of codeLines) {
                doc.text(codeLine, margin + 2, yPosition + 2)
                yPosition += lineHeight
            }

            yPosition += 8
            doc.setFont("helvetica", "normal")
        } else {
            // Paragraphs
            doc.setFontSize(11)
            const lines = doc.splitTextToSize(section.content, maxWidth)
            doc.text(lines, margin, yPosition)
            yPosition += lines.length * 6 + 3
        }
    }

    // Descargar el PDF
    doc.save(filename)
}

// Función para generar Word (HTML convertido a DOCX)
export async function downloadAsWord(content: string, filename: string = "respuesta.docx"): Promise<void> {
    // Cargar el logo
    const logoUrl = "/Logotipo RPJ.jpg"
    let logoBase64 = ""

    try {
        const response = await fetch(logoUrl)
        if (response.ok) {
            const logoBlob = await response.blob()
            logoBase64 = await blobToBase64(logoBlob)
        }
    } catch (error) {
        console.warn("No se pudo cargar el logo:", error)
    }

    // Parsear el markdown
    const sections = parseMarkdown(content)

    // Crear HTML del documento
    let htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Respuesta IA</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 1in; }
            .logo { text-align: center; margin-bottom: 20px; }
            .logo img { max-width: 150px; }
            h1 { font-size: 18pt; margin-top: 12pt; margin-bottom: 6pt; }
            h2 { font-size: 14pt; margin-top: 10pt; margin-bottom: 5pt; }
            h3 { font-size: 12pt; margin-top: 8pt; margin-bottom: 4pt; }
            p { margin: 6pt 0; }
            ul, ol { margin: 6pt 0; padding-left: 20pt; }
            code { font-family: 'Courier New', monospace; background: #f0f0f0; padding: 2px 4px; }
            pre { font-family: 'Courier New', monospace; background: #f0f0f0; padding: 10px; }
        </style>
    </head>
    <body>
    `

    // Añadir logo si existe
    if (logoBase64) {
        htmlContent += `
        <div class="logo">
            <img src="${logoBase64}" alt="Logo RPJ" />
        </div>
        `
    }

    // Convertir secciones a HTML
    for (const section of sections) {
        if (section.type === "heading") {
            const level = section.level || 1
            htmlContent += `<h${level}>${section.content}</h${level}>\n`
        } else if (section.type === "bullet") {
            htmlContent += `<ul><li>${section.content}</li></ul>\n`
        } else if (section.type === "numbered") {
            htmlContent += `<ol><li>${section.content}</li></ol>\n`
        } else if (section.type === "code") {
            htmlContent += `<pre><code>${section.content}</code></pre>\n`
        } else {
            // Procesar formato en línea (negrita)
            let text = section.content
            text = text.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
            text = text.replace(/\*([^*]+)\*/g, "<em>$1</em>")
            htmlContent += `<p>${text}</p>\n`
        }
    }

    htmlContent += `
    </body>
    </html>
    `

    // Crear blob con formato RTF/HTML que Word puede abrir
    const blob = new Blob(
        [
            "\ufeff", // BOM UTF-8
            htmlContent,
        ],
        {
            type: "application/msword",
        }
    )

    // Descargar
    saveAs(blob, filename)
}

