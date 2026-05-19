import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { supabase } from './supabase'

// A4: 210 × 297 mm  |  794 × 1123 px a 96dpi
const A4_W_MM  = 210
const A4_H_MM  = 297
const A4_W_PX  = 794   // largura de captura (equivale a 210 mm a 96 dpi)

/**
 * Baixa imagem autenticada do Supabase Storage e converte para base64.
 * Necessário porque html2canvas não envia o token de auth nas requisições de imagem.
 */
async function urlParaBase64(url) {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token
    const res = await fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const blob = await res.blob()
    return await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload  = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  } catch (err) {
    console.warn('Não foi possível carregar imagem:', url, err.message)
    return null
  }
}

async function converterImagensParaBase64(elemento) {
  const imgs = Array.from(elemento.querySelectorAll('img'))
  await Promise.all(
    imgs.map(async (img) => {
      const src = img.getAttribute('src')
      if (!src || src.startsWith('data:')) return
      const base64 = await urlParaBase64(src)
      if (base64) img.src = base64
      else img.style.display = 'none'
    })
  )
}

/**
 * Gera o PDF em formato A4 correto (210 × 297 mm).
 * @param {string}  nomeArquivo  - nome do arquivo sem extensão
 * @param {boolean} retornarBlob - se true, retorna o Blob em vez de salvar
 */
export async function gerarPDF(nomeArquivo = 'laudo-vistoria', retornarBlob = false) {
  const elemento = document.getElementById('pdf-template')
  if (!elemento) throw new Error('Template PDF não encontrado no DOM')

  // ── 1. Torna o elemento visível e define largura A4 ────────────────────────
  const estiloOriginal = elemento.style.cssText
  elemento.style.cssText = [
    'position:fixed',
    'top:0',
    'left:-9999px',
    'z-index:9999',
    'opacity:1',
    'pointer-events:none',
    `width:${A4_W_PX}px`,
    'min-height:auto',
    'background:#ffffff',
  ].join(';')

  try {
    // ── 2. Converte imagens → base64 ─────────────────────────────────────────
    await converterImagensParaBase64(elemento)

    // Aguarda 2 frames: garantia de re-render após troca de src das imagens
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))

    // ── 3. Captura com html2canvas ────────────────────────────────────────────
    const canvas = await html2canvas(elemento, {
      scale: 2,             // 2× para melhor resolução na impressão
      width: A4_W_PX,
      useCORS: false,       // já convertemos para base64
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      imageTimeout: 0,
    })

    // ── 4. Cria PDF A4 em milímetros ─────────────────────────────────────────
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',          // 210 × 297 mm
      compress: true,
    })

    const imgData = canvas.toDataURL('image/jpeg', 0.92)

    // Calcula altura total da imagem em mm (mantendo proporção)
    const totalAltMM = (canvas.height / canvas.width) * A4_W_MM

    let posicaoMM = 0
    let restanteMM = totalAltMM

    // Adiciona a imagem páginada
    pdf.addImage(imgData, 'JPEG', 0, posicaoMM, A4_W_MM, totalAltMM)
    restanteMM -= A4_H_MM

    while (restanteMM > 0) {
      posicaoMM -= A4_H_MM
      pdf.addPage()
      pdf.addImage(imgData, 'JPEG', 0, posicaoMM, A4_W_MM, totalAltMM)
      restanteMM -= A4_H_MM
    }

    // ── 5. Retorna blob ou salva ──────────────────────────────────────────────
    if (retornarBlob) {
      return pdf.output('blob')
    } else {
      pdf.save(`${nomeArquivo}.pdf`)
    }

  } finally {
    // Restaura estilo original
    elemento.style.cssText = estiloOriginal
  }
}
