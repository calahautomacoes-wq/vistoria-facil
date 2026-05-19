import { create } from 'zustand'
import { uuid } from '../lib/uuid'

// ─── Helper: checklist de elementos por tipo de cômodo ───────────────────────
function getItensParaComodo(nome) {
  const n = nome.toLowerCase()
  let nomes = []

  if (n.includes('banheiro') || n.includes('lavabo') || n.includes('wc') || n.includes('toilet')) {
    nomes = [
      'Paredes', 'Teto', 'Piso', 'Azulejos', 'Pintura', 'Porta/Fechadura',
      'Pia/Lavatório', 'Vaso Sanitário', 'Descarga', 'Box/Chuveiro',
      'Torneiras/Registros', 'Ralo', 'Tomadas', 'Iluminação',
    ]
  } else if (n.includes('cozinha')) {
    nomes = [
      'Paredes', 'Teto', 'Piso', 'Azulejos', 'Pintura', 'Porta/Fechadura',
      'Janelas/Esquadrias', 'Pia/Cuba', 'Torneira', 'Ralo', 'Tomadas', 'Iluminação',
    ]
  } else if (
    n.includes('área de serviço') || n.includes('area de servico') ||
    n.includes('lavanderia') || n.includes('serviço')
  ) {
    nomes = [
      'Paredes', 'Teto', 'Piso', 'Pintura', 'Porta/Fechadura',
      'Tanque', 'Torneiras', 'Ralos', 'Tomadas', 'Iluminação',
    ]
  } else if (n.includes('garagem') || n.includes('vaga')) {
    nomes = ['Portão/Acesso', 'Piso', 'Teto/Cobertura', 'Paredes', 'Iluminação']
  } else if (n.includes('fachada')) {
    nomes = ['Pintura externa', 'Portão/Portaria', 'Calçada/Acesso', 'Paredes externas', 'Telhado/Cobertura']
  } else if (
    n.includes('área externa') || n.includes('area externa') ||
    n.includes('quintal') || n.includes('jardim') || n.includes('pátio')
  ) {
    nomes = ['Piso/Calçamento', 'Jardim/Vegetação', 'Muros/Cercas', 'Iluminação', 'Cobertura']
  } else if (n.includes('varanda') || n.includes('sacada') || n.includes('terraço')) {
    nomes = ['Paredes', 'Piso', 'Teto', 'Grades/Guarda-corpo', 'Esquadrias', 'Iluminação']
  } else if (n.includes('corredor') || n.includes('hall') || n.includes('circulação')) {
    nomes = ['Paredes', 'Teto', 'Piso', 'Pintura', 'Iluminação']
  } else {
    // Sala, quarto, suíte, escritório, etc.
    nomes = [
      'Paredes', 'Teto', 'Piso', 'Pintura', 'Porta/Fechadura',
      'Janelas/Esquadrias', 'Tomadas/Interruptores', 'Iluminação',
    ]
  }

  return nomes.map((nome) => ({ id: uuid(), nome, condicao: null, obs: '' }))
}

// ─── Estado padrão ────────────────────────────────────────────────────────────
const pessoaVazia     = () => ({ nome: '', cpf: '', rg: '', telefone: '', email: '' })
const testemunhaVazia = () => ({ nome: '', cpf: '', rg: '' })

const estadoInicial = {
  // Tipo e dados gerais
  tipo: 'entrada',
  vistoriador: '',
  dataVistoria: new Date().toISOString().split('T')[0],
  observacoes: '',
  itensNaoVistoriados: '',

  // Contrato
  numeroContrato:   '',
  valorAluguel:     '',
  dataInicio:       '',
  dataFim:          '',
  prazoContestacao: '7',

  // Imóvel
  imovel: {
    cep: '', logradouro: '', numero: '', complemento: '',
    bairro: '', cidade: '', estado: '',
    tipoImovel:  '',
    areaM2:      '',
    finalidade:  'residencial',
    mobiliado:   false,
  },

  // Pessoas
  proprietarios: [pessoaVazia()],
  inquilinos:    [pessoaVazia()],
  testemunhas:   [],

  // Vistoria
  comodos:   [],
  medidores: { agua: '', luz: '', gas: '' },
  chaves:    '',
}

export const useVistoriaStore = create((set) => ({
  ...estadoInicial,

  // Geral
  setTipo:                (tipo)                => set({ tipo }),
  setVistoriador:         (vistoriador)         => set({ vistoriador }),
  setDataVistoria:        (dataVistoria)        => set({ dataVistoria }),
  setObservacoes:         (observacoes)         => set({ observacoes }),
  setItensNaoVistoriados: (itensNaoVistoriados) => set({ itensNaoVistoriados }),

  // Contrato
  setNumeroContrato:   (v) => set({ numeroContrato: v }),
  setValorAluguel:     (v) => set({ valorAluguel: v }),
  setDataInicio:       (v) => set({ dataInicio: v }),
  setDataFim:          (v) => set({ dataFim: v }),
  setPrazoContestacao: (v) => set({ prazoContestacao: v }),

  // Imóvel
  setImovel: (imovel) => set({ imovel }),

  // Proprietários
  setProprietarios:   (proprietarios) => set({ proprietarios }),
  addProprietario:    () => set((s) => ({ proprietarios: [...s.proprietarios, pessoaVazia()] })),
  removeProprietario: (i) => set((s) => ({ proprietarios: s.proprietarios.filter((_, idx) => idx !== i) })),

  // Inquilinos
  setInquilinos:   (inquilinos) => set({ inquilinos }),
  addInquilino:    () => set((s) => ({ inquilinos: [...s.inquilinos, pessoaVazia()] })),
  removeInquilino: (i) => set((s) => ({ inquilinos: s.inquilinos.filter((_, idx) => idx !== i) })),

  // Testemunhas
  setTestemunhas:   (testemunhas) => set({ testemunhas }),
  addTestemunha:    () => set((s) => ({ testemunhas: [...s.testemunhas, testemunhaVazia()] })),
  removeTestemunha: (i) => set((s) => ({ testemunhas: s.testemunhas.filter((_, idx) => idx !== i) })),

  // Medidores
  setMedidores: (medidores) => set({ medidores }),
  setChaves:    (chaves)    => set({ chaves }),

  // Cômodos
  addComodo: (nome) => set((s) => ({
    comodos: [...s.comodos, {
      id:    uuid(),
      nome,
      fotos: [],
      itens: getItensParaComodo(nome),
    }],
  })),
  removeComodo: (id) => set((s) => ({ comodos: s.comodos.filter((c) => c.id !== id) })),

  addFotoComodo: (comodoId, foto) =>
    set((s) => ({ comodos: s.comodos.map((c) =>
      c.id === comodoId ? { ...c, fotos: [...c.fotos, foto] } : c) })),

  updateFotoComodo: (comodoId, fotoId, dados) =>
    set((s) => ({ comodos: s.comodos.map((c) =>
      c.id === comodoId
        ? { ...c, fotos: c.fotos.map((f) => f.id === fotoId ? { ...f, ...dados } : f) }
        : c) })),

  removeFotoComodo: (comodoId, fotoId) =>
    set((s) => ({ comodos: s.comodos.map((c) =>
      c.id === comodoId
        ? { ...c, fotos: c.fotos.filter((f) => f.id !== fotoId) }
        : c) })),

  updateItemComodo: (comodoId, itemId, dados) =>
    set((s) => ({ comodos: s.comodos.map((c) =>
      c.id === comodoId
        ? { ...c, itens: c.itens.map((item) => item.id === itemId ? { ...item, ...dados } : item) }
        : c) })),

  resetVistoria: () => set(estadoInicial),

  // ── Preenche dados de demonstração ─────────────────────────────────────────
  preencherDemo: () => set({
    tipo: 'entrada',
    vistoriador: 'Ricardo Souza',
    dataVistoria: new Date().toISOString().split('T')[0],
    observacoes: 'Imóvel entregue limpo, com pintura nova em todos os ambientes. Pequeno arranhado na porta do quarto registrado conforme acordo entre as partes.',
    itensNaoVistoriados: 'Área de telhado não vistoriada por impossibilidade de acesso seguro na data da vistoria.',

    numeroContrato:   '2024/0312',
    valorAluguel:     '2800',
    dataInicio:       '2024-06-01',
    dataFim:          '2026-05-31',
    prazoContestacao: '7',

    imovel: {
      cep:         '04538-133',
      logradouro:  'Av. Brigadeiro Faria Lima',
      numero:      '3477',
      complemento: 'Apto 82 — Torre B',
      bairro:      'Itaim Bibi',
      cidade:      'São Paulo',
      estado:      'SP',
      tipoImovel:  'Apartamento',
      areaM2:      '72',
      finalidade:  'residencial',
      mobiliado:   true,
    },

    proprietarios: [{
      nome: 'Maria Aparecida Ferreira',
      cpf:  '321.654.987-00',
      rg:   '28.456.123-4',
      telefone: '(11) 99876-5432',
      email:    'maria.ferreira@email.com',
    }],

    inquilinos: [{
      nome: 'João Pedro Almeida',
      cpf:  '123.456.789-00',
      rg:   '45.678.901-2',
      telefone: '(11) 98765-4321',
      email:    'joao.almeida@email.com',
    }],

    testemunhas: [{
      nome: 'Ana Clara Rodrigues',
      cpf:  '987.654.321-00',
      rg:   '12.345.678-9',
    }],

    comodos: [
      {
        id: uuid(), nome: 'Sala de Estar',
        fotos: [],
        itens: getItensParaComodo('sala').map((it, i) => ({
          ...it,
          condicao: ['bom','bom','bom','bom','regular','bom','bom','bom'][i] || 'bom',
          obs: i === 4 ? 'Pintura com pequena mancha próxima à janela.' : '',
        })),
      },
      {
        id: uuid(), nome: 'Quarto Principal',
        fotos: [],
        itens: getItensParaComodo('quarto').map((it) => ({ ...it, condicao: 'bom', obs: '' })),
      },
      {
        id: uuid(), nome: 'Banheiro Social',
        fotos: [],
        itens: getItensParaComodo('banheiro').map((it, i) => ({
          ...it,
          condicao: i === 3 ? 'regular' : 'bom',
          obs: i === 3 ? 'Azulejo com rejunte escurecido — necessita limpeza.' : '',
        })),
      },
      {
        id: uuid(), nome: 'Cozinha',
        fotos: [],
        itens: getItensParaComodo('cozinha').map((it) => ({ ...it, condicao: 'bom', obs: '' })),
      },
    ],

    medidores: { agua: '000147', luz: '004832', gas: '000089' },
    chaves: '2 cópias — entregues ao locatário',
  }),
}))
