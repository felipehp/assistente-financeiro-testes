import '@testing-library/jest-dom'
import { render, screen, cleanup } from '@testing-library/react'
import OwlAvatar from './OwlAvatar'

describe('OwlAvatar', () => {
  it('renderiza com role img e aria-label descrevendo estado', () => {
    render(<OwlAvatar avatarState="neutral" movement="idle" />)
    const img = screen.getByRole('img')
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute('aria-label', expect.stringContaining('neutro'))
  })

  it('grupo da cabeça não inclina no neutral', () => {
    render(<OwlAvatar avatarState="neutral" movement="idle" beakOpen={false} />)
    expect(screen.getByTestId('owl-head-group')).toHaveAttribute(
      'transform',
      'rotate(0, 120, 115)',
    )
  })

  it('aplica classe de movimento owl-talking quando movement=talking', () => {
    const { container } = render(<OwlAvatar avatarState="neutral" movement="talking" />)
    expect(container.querySelector('.owl-talking')).toBeInTheDocument()
  })

  it('aplica classe de movimento owl-thinking quando movement=thinking', () => {
    const { container } = render(<OwlAvatar avatarState="neutral" movement="thinking" />)
    expect(container.querySelector('.owl-thinking')).toBeInTheDocument()
  })

  it('bico inferior usa path com curva quando beakOpen=true', () => {
    render(<OwlAvatar avatarState="neutral" movement="idle" beakOpen={true} />)
    expect(screen.getByTestId('owl-beak-lower').getAttribute('d')).toMatch(/Q/)
  })

  it('bico inferior usa path reto de neutral quando beakOpen=false', () => {
    render(<OwlAvatar avatarState="neutral" movement="idle" beakOpen={false} />)
    expect(screen.getByTestId('owl-beak-lower').getAttribute('d')).not.toMatch(/Q/)
  })

  it('interior da boca presente quando beakOpen=true', () => {
    render(<OwlAvatar avatarState="neutral" movement="idle" beakOpen={true} />)
    expect(screen.getByTestId('owl-mouth-interior')).toBeInTheDocument()
  })

  it('interior da boca ausente quando beakOpen=false em estado neutral', () => {
    render(<OwlAvatar avatarState="neutral" movement="idle" beakOpen={false} />)
    expect(screen.queryByTestId('owl-mouth-interior')).not.toBeInTheDocument()
  })

  it('interior da boca presente no estado happy mesmo sem beakOpen', () => {
    render(<OwlAvatar avatarState="happy" movement="idle" beakOpen={false} />)
    expect(screen.getByTestId('owl-mouth-interior')).toBeInTheDocument()
  })

  it('interior da boca presente no estado encouraging mesmo sem beakOpen', () => {
    render(<OwlAvatar avatarState="encouraging" movement="idle" beakOpen={false} />)
    expect(screen.getByTestId('owl-mouth-interior')).toBeInTheDocument()
  })

  it('chapéu mortarboard com tassel presente no SVG', () => {
    render(<OwlAvatar avatarState="neutral" movement="idle" />)
    expect(screen.getByTestId('owl-hat-tassel')).toBeInTheDocument()
  })

  it('grupo da cabeça inclina diferente entre estados com tilt diferente', () => {
    render(<OwlAvatar avatarState="neutral" movement="idle" />)
    const neutralTransform = screen.getByTestId('owl-head-group').getAttribute('transform')
    expect(neutralTransform).toBe('rotate(0, 120, 115)')

    cleanup()

    render(<OwlAvatar avatarState="empathetic" movement="idle" />)
    const empatheticTransform = screen.getByTestId('owl-head-group').getAttribute('transform')
    expect(empatheticTransform).not.toBe('rotate(0, 120, 115)')
  })

  it('estado empathetic renderiza wink no olho direito', () => {
    render(<OwlAvatar avatarState="empathetic" movement="idle" />)
    expect(screen.getByTestId('owl-eye-right-wink')).toBeInTheDocument()
    expect(screen.queryByTestId('owl-right-eye')).not.toBeInTheDocument()
  })

  it('estado encouraging renderiza asa direita com joinha', () => {
    render(<OwlAvatar avatarState="encouraging" movement="idle" />)
    expect(screen.getByTestId('owl-wing-right-thumb')).toBeInTheDocument()
  })

  it('estado thoughtful renderiza asa direita no queixo', () => {
    render(<OwlAvatar avatarState="thoughtful" movement="idle" />)
    expect(screen.getByTestId('owl-wing-right-chin')).toBeInTheDocument()
  })

  it('estados neutral/happy/empathetic/thoughtful não têm joinha', () => {
    for (const state of ['neutral', 'happy', 'empathetic', 'thoughtful'] as const) {
      const { unmount } = render(<OwlAvatar avatarState={state} movement="idle" />)
      expect(screen.queryByTestId('owl-wing-right-thumb')).not.toBeInTheDocument()
      unmount()
    }
  })
})
