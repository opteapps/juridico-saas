import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow, isToday, isTomorrow, isYesterday } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatarData(data: string | Date) {
  return format(new Date(data), 'dd/MM/yyyy', { locale: ptBR })
}

export function formatarDataHora(data: string | Date) {
  return format(new Date(data), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
}

export function formatarDataRelativa(data: string | Date) {
  const dataNormalizada = new Date(data)
  if (isToday(dataNormalizada)) return 'Hoje'
  if (isTomorrow(dataNormalizada)) return 'Amanhã'
  if (isYesterday(dataNormalizada)) return 'Ontem'
  return formatDistanceToNow(dataNormalizada, { addSuffix: true, locale: ptBR })
}

export function formatarMoeda(valor: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor)
}

export function formatarCPF(cpf: string) {
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

export function formatarCNPJ(cnpj: string) {
  return cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
}

export function formatarNumeroCNJ(numero: string) {
  const numeroLimpo = numero.replace(/\D/g, '')
  if (numeroLimpo.length !== 20) return numero
  return `${numeroLimpo.slice(0, 7)}-${numeroLimpo.slice(7, 9)}.${numeroLimpo.slice(9, 13)}.${numeroLimpo.slice(13, 14)}.${numeroLimpo.slice(14, 16)}.${numeroLimpo.slice(16)}`
}

export const AREAS_ATUACAO = [
  'Cível',
  'Trabalhista',
  'Criminal',
  'Tributário',
  'Empresarial',
  'Família e Sucessões',
  'Imobiliário',
  'Previdenciário',
  'Administrativo',
  'Ambiental',
  'Digital e Tecnologia',
  'Propriedade Intelectual',
  'Internacional',
  'Consumidor',
  'Bancário',
]

export const STATUS_PROCESSO = {
  ativo: { label: 'Ativo', color: 'bg-green-100 text-green-800' },
  suspenso: { label: 'Suspenso', color: 'bg-yellow-100 text-yellow-800' },
  encerrado: { label: 'Encerrado', color: 'bg-gray-100 text-gray-800' },
  arquivado: { label: 'Arquivado', color: 'bg-red-100 text-red-800' },
}

export const ROLES = {
  super_admin: 'Super Admin',
  admin_escritorio: 'Administrador',
  advogado: 'Advogado',
  estagiario: 'Estagiário',
  financeiro: 'Financeiro',
  secretaria: 'Secretária',
  cliente: 'Cliente',
}