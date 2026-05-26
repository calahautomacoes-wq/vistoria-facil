/**
 * Template do Laudo de Vistoria — segue o padrão dos modelos oficiais brasileiros
 * (CRECI, Jusbrasil, modelos jurídicos) com textos legais padronizados.
 * Renderizado em DOM oculto e capturado via html2canvas → jsPDF.
 * Usa apenas inline styles pois o Tailwind não é processado fora do viewport.
 */

/* ── Logo ─────────────────────────────────────────────────────────────────── */
function LogoCAHPDF() {
  return (
    <svg width="46" height="46" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="g1" cx="50%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#FFD966" />
          <stop offset="60%" stopColor="#C9A227" />
          <stop offset="100%" stopColor="#8B6914" />
        </radialGradient>
        <radialGradient id="g2" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#F0C84B" />
          <stop offset="100%" stopColor="#B8860B" />
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="48" fill="#0a0a0a" />
      <circle cx="50" cy="50" r="47" fill="none" stroke="url(#g1)" strokeWidth="3.5" />
      <text x="16" y="65" fontFamily="Arial Black, Arial" fontWeight="900" fontSize="38" fill="white">C</text>
      <text x="36" y="65" fontFamily="Arial Black, Arial" fontWeight="900" fontSize="38" fill="white">A</text>
      <polygon points="50,34 44,52 56,52" fill="url(#g2)" opacity="0.95" />
      <text x="60" y="65" fontFamily="Arial Black, Arial" fontWeight="900" fontSize="38" fill="white">H</text>
    </svg>
  )
}

/* ── Utilitários ──────────────────────────────────────────────────────────── */
function fmt(v) { return v || '—' }

function fmtData(isoDate) {
  if (!isoDate) return '—'
  return new Date(isoDate + 'T12:00:00').toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'long', year: 'numeric',
  })
}

function fmtMoeda(v) {
  if (!v) return null
  const n = parseFloat(v)
  return isNaN(n) ? null : n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function prazoExtenso(p) {
  const m = { 3: 'três', 5: 'cinco', 7: 'sete', 10: 'dez', 15: 'quinze' }
  return m[Number(p)] || String(p)
}

const COND = {
  bom:     { bg: '#dcfce7', color: '#15803d', label: 'Bom'     },
  regular: { bg: '#fef9c3', color: '#a16207', label: 'Regular' },
  ruim:    { bg: '#fee2e2', color: '#b91c1c', label: 'Ruim'    },
  na:      { bg: '#f3f4f6', color: '#6b7280', label: 'N/A'     },
}

/* ── Componente principal ─────────────────────────────────────────────────── */
export default function PDFTemplate({ vistoria, imovel, pessoas, testemunhas, comodos, medidores }) {
  const locadores      = pessoas?.filter((p) => p.papel === 'proprietario') || []
  const locatarios     = pessoas?.filter((p) => p.papel === 'inquilino')    || []
  const testemunhasList = testemunhas || []

  const tipoVistoria = vistoria?.tipo === 'entrada' ? 'ENTRADA' : 'SAÍDA'
  const dataVistoria = fmtData(vistoria?.data_vistoria)
  const prazo        = vistoria?.prazo_contestacao || 7
  const numVias      = testemunhasList.length >= 2 ? '03 (três)' : '02 (duas)'

  const endereco = imovel ? [
    imovel.logradouro && imovel.numero
      ? `${imovel.logradouro}, nº ${imovel.numero}`
      : imovel.logradouro || '',
    imovel.complemento,
    imovel.bairro,
  ].filter(Boolean).join(', ') : '—'

  const cidadeUf = imovel
    ? [imovel.cidade, imovel.estado].filter(Boolean).join('/')
    : ''

  const enderecoCompleto = [endereco, cidadeUf, imovel?.cep ? `CEP ${imovel.cep}` : null]
    .filter(Boolean).join(' — ')

  /* ── Estilos ── */
  const f = 'Arial, Helvetica, sans-serif'
  const s = {
    page: {
      width: '794px',
      fontFamily: f,
      fontSize: '10.5px',
      color: '#0a0a0a',
      background: '#ffffff',
      padding: '40px 52px 48px',
      lineHeight: '1.55',
    },
    /* Cabeçalho */
    header: {
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      paddingBottom: '12px', marginBottom: '12px', borderBottom: '2.5px solid #0a0a0a',
    },
    brandName: { fontSize: '18px', fontWeight: '900', color: '#0a0a0a', margin: 0, letterSpacing: '-0.3px' },
    brandSub:  { fontSize: '10px', color: '#C9A227', margin: '2px 0 0', fontWeight: '700', letterSpacing: '0.5px' },
    tipoTag: {
      padding: '4px 12px', borderRadius: '4px', fontWeight: '800',
      fontSize: '11px', background: '#0a0a0a', color: '#C9A227', letterSpacing: '1px',
    },
    /* Título do documento */
    docTitle: {
      textAlign: 'center', margin: '0 0 16px',
      fontSize: '15px', fontWeight: '900', textTransform: 'uppercase',
      letterSpacing: '0.1em', color: '#0a0a0a',
    },
    /* Bloco de partes */
    partesGrid: {
      display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0',
      border: '1.5px solid #0a0a0a', borderRadius: '4px',
      marginBottom: '10px', overflow: 'hidden',
    },
    parteBloco: { padding: '8px 10px', borderRight: '1px solid #d4d0c8' },
    parteBlocoRight: { padding: '8px 10px' },
    parteLabel: {
      fontSize: '7.5px', fontWeight: '800', color: '#7a7a7a',
      textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 3px',
    },
    parteNome: { fontWeight: '800', fontSize: '11.5px', margin: '0 0 2px', color: '#0a0a0a' },
    parteDetalhe: { fontSize: '9px', color: '#3a3a3a', margin: 0, lineHeight: '1.5' },
    /* Imóvel */
    imovelBox: {
      border: '1.5px solid #0a0a0a', borderRadius: '4px',
      padding: '8px 10px', marginBottom: '14px', background: '#fafaf8',
    },
    imovelTitulo: {
      fontSize: '7.5px', fontWeight: '800', color: '#7a7a7a',
      textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 4px',
    },
    imovelEndereco: { fontWeight: '700', fontSize: '11px', margin: '0 0 3px', color: '#0a0a0a' },
    imovelSub: { fontSize: '9.5px', color: '#3a3a3a', margin: 0 },
    /* Divisor de seção */
    divider: {
      height: '1px', background: '#0a0a0a',
      margin: '12px 0', borderRadius: '1px',
    },
    secTitulo: {
      fontSize: '8px', fontWeight: '800', color: '#0a0a0a',
      textTransform: 'uppercase', letterSpacing: '0.15em',
      margin: '0 0 6px', paddingBottom: '3px', borderBottom: '1px solid #0a0a0a',
    },
    /* Texto de cláusulas */
    clausula: {
      fontSize: '10px', color: '#1a1a1a', lineHeight: '1.7',
      margin: '0 0 8px', textAlign: 'justify',
    },
    clausulaBox: {
      padding: '8px 10px', border: '1px solid #d4d0c8',
      borderRadius: '4px', background: '#fafaf8', marginBottom: '8px',
    },
    /* Tabela de checklist */
    table: { width: '100%', borderCollapse: 'collapse', marginBottom: '8px', fontSize: '9.5px' },
    th: {
      padding: '3px 7px', background: '#0a0a0a', color: '#fff',
      textAlign: 'left', fontWeight: '700', fontSize: '8px',
      textTransform: 'uppercase', letterSpacing: '0.05em',
    },
    td: { padding: '3.5px 7px', borderBottom: '1px solid #ececea', verticalAlign: 'top', fontSize: '9.5px' },
    badge: (cond) => ({
      display: 'inline-block', padding: '1px 6px', borderRadius: '8px',
      fontSize: '8.5px', fontWeight: '700',
      background: cond && COND[cond] ? COND[cond].bg : '#f3f4f6',
      color:      cond && COND[cond] ? COND[cond].color : '#6b7280',
    }),
    /* Fotos */
    fotoRow: {
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      marginBottom: '12px', padding: '8px',
      border: '1px solid #d4d0c8', borderRadius: '4px',
    },
    fotoImg: {
      width: '100%', maxHeight: '220px', objectFit: 'contain',
      borderRadius: '3px', border: '1px solid #d4d0c8',
      background: '#f8f8f6', display: 'block',
    },
    /* Medidores */
    medGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '4px', marginBottom: '8px' },
    medItem: { padding: '5px 7px', border: '1px solid #d4d0c8', borderRadius: '4px', background: '#fafaf8' },
    medLabel: { fontSize: '8px', color: '#7a7a7a', margin: '0 0 1px', display: 'block' },
    medValor: { fontWeight: '700', fontSize: '10px', margin: 0 },
    /* Assinaturas */
    sigArea: { marginTop: '24px' },
    sigGrid: { display: 'flex', gap: '14px', flexWrap: 'wrap', marginTop: '32px' },
    sigBloco: { flex: '1', minWidth: '135px' },
    sigLine:  { borderTop: '1.5px solid #0a0a0a', paddingTop: '5px', marginTop: '36px' },
    sigTipo:  { fontSize: '8px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#7a7a7a', margin: 0 },
    sigNome:  { fontSize: '9.5px', fontWeight: '700', color: '#0a0a0a', margin: '2px 0 0' },
    sigCpf:   { fontSize: '8.5px', color: '#7a7a7a', margin: '1px 0 0' },
    /* Rodapé */
    footer: {
      marginTop: '24px', paddingTop: '8px', borderTop: '1px solid #d4d0c8',
      textAlign: 'center', fontSize: '8px', color: '#9a9690',
    },
  }

  /* ── Renderização ── */
  return (
    <div id="pdf-template" style={s.page}>

      {/* ════ CABEÇALHO ════ */}
      <div style={s.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <LogoCAHPDF />
          <div>
            <p style={s.brandName}>CAH</p>
            <p style={s.brandSub}>VISTORIA FÁCIL</p>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={s.tipoTag}>VISTORIA DE {tipoVistoria}</span>
          <p style={{ margin: '5px 0 0', fontSize: '9px', color: '#3a3a3a' }}>
            Data: <strong>{dataVistoria}</strong>
            {vistoria?.vistoriador ? `  ·  Vistoriador: ${vistoria.vistoriador}` : ''}
          </p>
          {vistoria?.numero_contrato && (
            <p style={{ margin: '1px 0 0', fontSize: '9px', color: '#3a3a3a' }}>
              Contrato nº: <strong>{vistoria.numero_contrato}</strong>
            </p>
          )}
        </div>
      </div>

      {/* ════ TÍTULO ════ */}
      <p style={s.docTitle}>Laudo de Vistoria de Imóvel</p>

      {/* ════ QUALIFICAÇÃO DAS PARTES ════ */}
      {/* Locadores */}
      {locadores.map((p, i) => (
        <div key={i} style={s.partesGrid}>
          <div style={s.parteBloco}>
            <p style={s.parteLabel}>
              Locador(a){locadores.length > 1 ? ` — ${i + 1}º` : ''}
            </p>
            <p style={s.parteNome}>{fmt(p.nome)}</p>
            <p style={s.parteDetalhe}>
              {[p.cpf && `CPF: ${p.cpf}`, p.rg && `RG: ${p.rg}`].filter(Boolean).join('   ')}
            </p>
            {(p.telefone || p.email) && (
              <p style={s.parteDetalhe}>
                {[p.telefone, p.email].filter(Boolean).join('   ·   ')}
              </p>
            )}
          </div>
          {/* Par: locatário(a) do mesmo índice ou o primeiro */}
          {(() => {
            const loc = locatarios[i] || locatarios[0]
            if (!loc) return <div style={s.parteBlocoRight} />
            return (
              <div style={s.parteBlocoRight}>
                <p style={s.parteLabel}>
                  Locatário(a){locatarios.length > 1 ? ` — ${i + 1}º` : ''}
                </p>
                <p style={s.parteNome}>{fmt(loc.nome)}</p>
                <p style={s.parteDetalhe}>
                  {[loc.cpf && `CPF: ${loc.cpf}`, loc.rg && `RG: ${loc.rg}`].filter(Boolean).join('   ')}
                </p>
                {(loc.telefone || loc.email) && (
                  <p style={s.parteDetalhe}>
                    {[loc.telefone, loc.email].filter(Boolean).join('   ·   ')}
                  </p>
                )}
              </div>
            )
          })()}
        </div>
      ))}

      {/* Locatários extras (quando há mais locatários que locadores) */}
      {locatarios.slice(locadores.length).map((p, i) => (
        <div key={`extra-${i}`} style={s.partesGrid}>
          <div style={s.parteBloco}>
            <p style={s.parteLabel}>Locatário(a) — {locadores.length + i + 1}º</p>
            <p style={s.parteNome}>{fmt(p.nome)}</p>
            <p style={s.parteDetalhe}>
              {[p.cpf && `CPF: ${p.cpf}`, p.rg && `RG: ${p.rg}`].filter(Boolean).join('   ')}
            </p>
          </div>
          <div style={s.parteBlocoRight} />
        </div>
      ))}

      {/* ════ IMÓVEL OBJETO DA LOCAÇÃO ════ */}
      <div style={s.imovelBox}>
        <p style={s.imovelTitulo}>Imóvel Objeto da Locação</p>
        <p style={s.imovelEndereco}>{enderecoCompleto}</p>
        <p style={s.imovelSub}>
          {[
            imovel?.tipo_imovel,
            imovel?.area_m2 ? `${imovel.area_m2} m²` : null,
            imovel?.finalidade === 'residencial' ? 'Uso residencial' : imovel?.finalidade === 'comercial' ? 'Uso comercial' : imovel?.finalidade ? 'Uso misto' : null,
            imovel?.mobiliado ? 'Mobiliado' : 'Não mobiliado',
            comodos?.length ? `${comodos.length} ambiente${comodos.length > 1 ? 's' : ''} vistoriado${comodos.length > 1 ? 's' : ''}` : null,
          ].filter(Boolean).join('   ·   ')}
        </p>
        {(vistoria?.valor_aluguel || vistoria?.data_inicio || vistoria?.data_fim) && (
          <p style={{ ...s.imovelSub, marginTop: '3px' }}>
            {[
              fmtMoeda(vistoria?.valor_aluguel) ? `Aluguel: ${fmtMoeda(vistoria.valor_aluguel)}/mês` : null,
              vistoria?.data_inicio ? `Início: ${fmtData(vistoria.data_inicio)}` : null,
              vistoria?.data_fim    ? `Término: ${fmtData(vistoria.data_fim)}`   : null,
            ].filter(Boolean).join('   ·   ')}
          </p>
        )}
      </div>

      {/* ════ TERMO DE VISTORIA (declaração de abertura) ════ */}
      <div style={{ margin: '0 0 12px' }}>
        <div style={s.divider} />
        <p style={{ ...s.clausula, fontWeight: '600' }}>
          Pelo presente instrumento, <strong>LOCADOR(A)</strong> e <strong>LOCATÁRIO(A)</strong> acima
          identificados declaram que, nesta data, procederam à vistoria do imóvel acima descrito,
          constatando que o mesmo se encontra nas condições registradas neste <strong>LAUDO DE
          VISTORIA</strong>, que passa a integrar o Contrato de Locação firmado entre as partes.
        </p>
        <p style={s.clausula}>
          O presente laudo tem por finalidade registrar o estado de conservação do imóvel no momento
          da {vistoria?.tipo === 'entrada' ? 'entrega das chaves ao(à) LOCATÁRIO(A)' : 'devolução das chaves pelo(a) LOCATÁRIO(A)'},
          servindo como parâmetro para a restituição do bem ao final da locação, nos termos do
          Art. 22, inciso V e Art. 23, inciso III da <strong>Lei nº 8.245/1991</strong>.
        </p>
        <div style={s.divider} />
      </div>

      {/* ════ RELATÓRIO DE VISTORIA POR AMBIENTE ════ */}
      <p style={{ ...s.secTitulo, marginBottom: '10px' }}>Relatório de Vistoria por Ambiente</p>

      {(!comodos || comodos.length === 0) && (
        <p style={{ fontStyle: 'italic', color: '#9a9690', fontSize: '10px', marginBottom: '12px' }}>
          Nenhum ambiente registrado.
        </p>
      )}

      {comodos?.map((comodo, ci) => (
        <div key={comodo.id} style={{ marginBottom: '16px' }}>
          <p style={{ ...s.secTitulo, background: '#f0f0ec', padding: '3px 7px', borderBottom: 'none', borderRadius: '3px' }}>
            {String(ci + 1).padStart(2, '0')}. {comodo.nome}
          </p>

          {/* Tabela de condições */}
          {comodo.itens?.filter(i => i.condicao !== null || i.obs).length > 0 && (
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={{ ...s.th, width: '36%' }}>Elemento</th>
                  <th style={{ ...s.th, width: '14%' }}>Condição</th>
                  <th style={{ ...s.th }}>Observação</th>
                </tr>
              </thead>
              <tbody>
                {comodo.itens
                  .filter(i => i.condicao !== null || i.obs)
                  .map((item) => (
                    <tr key={item.id}
                      style={{ background: item.condicao === 'ruim' ? '#fff8f8' : 'transparent' }}>
                      <td style={s.td}>{item.nome}</td>
                      <td style={s.td}>
                        <span style={s.badge(item.condicao)}>
                          {item.condicao ? (COND[item.condicao]?.label || '—') : '—'}
                        </span>
                      </td>
                      <td style={{ ...s.td, color: '#3a3a3a', fontSize: '9px' }}>
                        {item.obs || '—'}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}

          {/* Fotos */}
          {comodo.fotos?.length > 0 ? (
            comodo.fotos.map((foto, fi) => (
              <div key={foto.id} style={s.fotoRow}>
                <img
                  src={foto.url_publica || foto.preview}
                  alt={`Foto ${fi + 1} — ${comodo.nome}`}
                  style={s.fotoImg}
                  crossOrigin="anonymous"
                />
                <div style={{ width: '100%', marginTop: '6px' }}>
                  <p style={{ margin: '0 0 2px', fontSize: '8.5px', fontWeight: '800', color: '#0a0a0a', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'center' }}>
                    Foto {fi + 1}
                  </p>
                  <p style={{ margin: 0, fontSize: '10px', color: '#2a2a2a', lineHeight: '1.6', textAlign: 'justify' }}>
                    {foto.descricao_editada || foto.descricao_ia || '—'}
                  </p>
                </div>
              </div>
            ))
          ) : (
            comodo.itens?.every(i => i.condicao === null && !i.obs) && (
              <p style={{ margin: '4px 0 0', fontStyle: 'italic', color: '#9a9690', fontSize: '9.5px' }}>
                Nenhuma foto ou condição registrada neste ambiente.
              </p>
            )
          )}
        </div>
      ))}

      {/* ════ MEDIDORES E CHAVES ════ */}
      {medidores && (medidores.agua || medidores.luz || medidores.gas || medidores.chaves) && (
        <div style={{ marginBottom: '14px' }}>
          <p style={s.secTitulo}>Leituras de Medidores e Chaves</p>
          <div style={s.medGrid}>
            {medidores.agua   && <MedItem label="Hidrômetro (água)"  valor={`${medidores.agua} m³`}  s={s} />}
            {medidores.luz    && <MedItem label="Relógio (energia)"  valor={`${medidores.luz} kWh`}  s={s} />}
            {medidores.gas    && <MedItem label="Medidor (gás)"      valor={`${medidores.gas} m³`}   s={s} />}
            {medidores.chaves && <MedItem label="Chaves entregues"   valor={medidores.chaves}         s={s} span />}
          </div>
        </div>
      )}

      {/* ════ ITENS NÃO VISTORIADOS ════ */}
      {vistoria?.itens_nao_vistoriados && (
        <div style={{ marginBottom: '14px' }}>
          <p style={s.secTitulo}>Itens Não Vistoriados</p>
          <div style={{ ...s.clausulaBox, background: '#fffbeb', borderColor: '#fde68a' }}>
            <p style={{ ...s.clausula, margin: 0, fontSize: '10px' }}>
              {vistoria.itens_nao_vistoriados}
            </p>
          </div>
        </div>
      )}

      {/* ════ OBSERVAÇÕES GERAIS ════ */}
      {vistoria?.observacoes && (
        <div style={{ marginBottom: '14px' }}>
          <p style={s.secTitulo}>Observações Gerais</p>
          <p style={{ ...s.clausula, margin: 0 }}>{vistoria.observacoes}</p>
        </div>
      )}

      {/* ════ DECLARAÇÕES E ASSINATURAS ════ */}
      <div style={s.sigArea}>
        <div style={s.divider} />
        <p style={{ ...s.secTitulo, marginBottom: '8px' }}>Declarações Finais</p>

        {/* Declaração de estado */}
        <div style={s.clausulaBox}>
          <p style={{ ...s.clausula, margin: 0 }}>
            Declaram as partes que o imóvel se encontra no estado acima descrito,
            comprometendo-se o(a) <strong>LOCATÁRIO(A)</strong> a devolvê-lo, ao final da locação,
            nas mesmas condições em que o recebeu, ressalvadas as deteriorações decorrentes do uso
            normal, nos termos do <strong>Art. 23, inciso III da Lei nº 8.245/1991</strong>.
          </p>
        </div>

        {/* Cláusula de contestação */}
        <div style={s.clausulaBox}>
          <p style={{ ...s.clausula, margin: 0 }}>
            <strong>Cláusula de Contestação:</strong> Qualquer divergência ou impugnação quanto às
            informações constantes neste laudo deverá ser comunicada ao(à){' '}
            <strong>LOCADOR(A)</strong>, por escrito, no prazo de{' '}
            <strong>{prazo} ({prazoExtenso(prazo)}) dias corridos</strong> a contar da assinatura
            deste documento, sob pena de aceitação integral da vistoria realizada.
          </p>
        </div>

        {/* Integração contratual */}
        <p style={{ ...s.clausula, marginBottom: '4px' }}>
          Por estarem de acordo, firmam o presente laudo em{' '}
          <strong>{numVias} vias de igual teor e forma</strong>, para que produza seus efeitos
          legais e jurídicos.
        </p>

        {/* Local e data */}
        <p style={{ textAlign: 'right', fontSize: '10px', color: '#3a3a3a', margin: '8px 0 0' }}>
          {imovel?.cidade ? `${imovel.cidade}${imovel.estado ? `/${imovel.estado}` : ''}, ` : ''}
          {dataVistoria}
        </p>

        {/* Bloco de assinaturas — Locadores e Locatários */}
        <div style={s.sigGrid}>
          {locadores.map((p, i) => (
            <SigBloco key={`l-${i}`}
              tipo={`Locador(a)${locadores.length > 1 ? ` — ${i + 1}º` : ''}`}
              nome={p.nome} cpf={p.cpf} s={s} />
          ))}
          {locatarios.map((p, i) => (
            <SigBloco key={`t-${i}`}
              tipo={`Locatário(a)${locatarios.length > 1 ? ` — ${i + 1}º` : ''}`}
              nome={p.nome} cpf={p.cpf} s={s} />
          ))}
          <SigBloco tipo="Vistoriador(a)" nome={vistoria?.vistoriador} s={s} />
        </div>

        {/* Testemunhas */}
        {testemunhasList.length > 0 && (
          <div style={{ marginTop: '20px' }}>
            <p style={{ fontSize: '8px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#7a7a7a', margin: '0 0 0' }}>
              Testemunhas
            </p>
            <div style={s.sigGrid}>
              {testemunhasList.map((t, i) => (
                <SigBloco key={i} tipo={`Testemunha ${i + 1}`} nome={t.nome} cpf={t.cpf} s={s} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ════ RODAPÉ ════ */}
      <div style={s.footer}>
        CAH Vistoria Fácil · Gerado em {new Date().toLocaleDateString('pt-BR')} ·
        Documento elaborado nos termos da Lei nº 8.245/1991 (Lei do Inquilinato) ·
        Este laudo é parte integrante do Contrato de Locação firmado entre as partes.
      </div>

    </div>
  )
}

/* ── Sub-componentes ──────────────────────────────────────────────────────── */
function MedItem({ label, valor, s, span }) {
  return (
    <div style={{ ...s.medItem, gridColumn: span ? 'span 2' : undefined }}>
      <span style={s.medLabel}>{label}</span>
      <p style={s.medValor}>{valor}</p>
    </div>
  )
}

function SigBloco({ tipo, nome, cpf, s }) {
  return (
    <div style={s.sigBloco}>
      <div style={s.sigLine}>
        <p style={s.sigTipo}>{tipo}</p>
        {nome && <p style={s.sigNome}>{nome}</p>}
        {cpf  && <p style={s.sigCpf}>CPF: {cpf}</p>}
      </div>
    </div>
  )
}
