import '@testing-library/jest-dom'
import { render, screen, fireEvent } from '@testing-library/react'
import { ChatInput } from '../index'

const baseProps = {
  onSend: jest.fn(),
  disabled: false,
  isListening: false,
  isSpeaking: false,
  speechSupported: true,
  onToggleListen: jest.fn(),
  onToggleSpeak: jest.fn(),
}

test('renderiza campo de texto e botão enviar', () => {
  render(<ChatInput {...baseProps} />)
  expect(screen.getByRole('textbox')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /enviar/i })).toBeInTheDocument()
})

test('renderiza botão microfone quando voz suportada', () => {
  render(<ChatInput {...baseProps} />)
  expect(screen.getByRole('button', { name: /microfone/i })).toBeInTheDocument()
})

test('não renderiza botão microfone quando não suportado', () => {
  render(<ChatInput {...baseProps} speechSupported={false} />)
  expect(screen.queryByRole('button', { name: /microfone/i })).toBeNull()
})

test('chama onSend ao submeter', () => {
  const onSend = jest.fn()
  render(<ChatInput {...baseProps} onSend={onSend} />)
  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'oi' } })
  fireEvent.click(screen.getByRole('button', { name: /enviar/i }))
  expect(onSend).toHaveBeenCalledWith('oi')
})

test('botões de voz têm tamanho mínimo de 44px', () => {
  render(<ChatInput {...baseProps} />)
  const micBtn = screen.getByRole('button', { name: /microfone/i })
  expect(micBtn).toHaveClass('w-11')
})
