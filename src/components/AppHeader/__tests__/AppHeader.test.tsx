import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'

jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
  useRouter: jest.fn(() => ({ push: jest.fn() })),
}))
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ alt }: { alt: string }) => <img alt={alt} />,
}))
jest.mock('@/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}))

import { usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { AppHeader } from '../index'

const mockPathname = usePathname as jest.Mock
const mockAuth = useAuth as jest.Mock

beforeEach(() => {
  mockAuth.mockReturnValue({ user: { username: 'admin', role: 'admin' }, logout: jest.fn() })
})

test('exibe título Banco Aurora', () => {
  mockPathname.mockReturnValue('/chat')
  render(<AppHeader />)
  expect(screen.getByText('Banco Aurora')).toBeInTheDocument()
})

test('no /chat mostra links admin e botão Sair, sem Voltar', () => {
  mockPathname.mockReturnValue('/chat')
  render(<AppHeader />)
  expect(screen.getByText('Base de Conhecimento')).toBeInTheDocument()
  expect(screen.getByText('Sair')).toBeInTheDocument()
  expect(screen.queryByText(/Voltar ao Chat/)).toBeNull()
})

test('fora do /chat mostra ← Voltar ao Chat', () => {
  mockPathname.mockReturnValue('/ingest')
  render(<AppHeader />)
  expect(screen.getByText(/Voltar ao Chat/)).toBeInTheDocument()
  expect(screen.queryByText('Base de Conhecimento')).toBeNull()
})

test('skip link está presente e acessível', () => {
  mockPathname.mockReturnValue('/chat')
  render(<AppHeader />)
  expect(screen.getByText('Ir para o conteúdo')).toBeInTheDocument()
})

test('avatar do usuário exibe inicial do username', () => {
  mockPathname.mockReturnValue('/chat')
  render(<AppHeader />)
  expect(screen.getByLabelText('Usuário: admin')).toBeInTheDocument()
})

test('Configurações visível apenas para role admin', () => {
  mockPathname.mockReturnValue('/chat')
  mockAuth.mockReturnValue({ user: { username: 'aluno', role: 'estudante' }, logout: jest.fn() })
  render(<AppHeader />)
  expect(screen.queryByText('Configurações')).toBeNull()
})
