'use client'
import { useId } from 'react'
import type { AvatarState, Movement } from '@/types/chat'

type WingPose = 'rest' | 'raised-thumb' | 'raised-chin'
type EyeShape = 'open' | 'squint' | 'soft' | 'focused' | 'wink'

interface OwlAvatarProps {
  avatarState: AvatarState
  movement?: Movement
  beakOpen?: boolean
}

interface ExpressionConfig {
  leftPupil: { cx: number; cy: number }
  rightPupil: { cx: number; cy: number }
  leftBrow: string
  rightBrow: string
  eyeShape: EyeShape
  beakPath: string
  beakInside?: string
  headTilt: number
  wingRightPose: WingPose
}

// Bico fechado padrão
const BEAK_CLOSED = 'M 112,145 Q 120,138 128,145 L 120,158 Z'
// Bico aberto feliz
const BEAK_OPEN = 'M 110,143 Q 120,136 130,143 Q 125,165 120,165 Q 115,165 110,143 Z'
// Bico aberto pensativo/surpreso (menor)
const BEAK_O = 'M 114,145 Q 120,140 126,145 Q 126,155 120,155 Q 114,155 114,145 Z'

const STATE_LABEL: Record<AvatarState, string> = {
  neutral: 'neutro',
  happy: 'feliz',
  encouraging: 'encorajador',
  empathetic: 'empático',
  thoughtful: 'pensativo',
}

// Mapeamento exato baseado na folha de expressões do Ollie
const EXPRESSIONS: Record<AvatarState, ExpressionConfig> = {
  neutral: {
    leftPupil: { cx: 85, cy: 115 },
    rightPupil: { cx: 155, cy: 115 },
    leftBrow: 'M 70 85 Q 85 80 100 85',
    rightBrow: 'M 140 85 Q 155 80 170 85',
    eyeShape: 'open',
    beakPath: BEAK_CLOSED,
    headTilt: 0,
    wingRightPose: 'rest',
  },
  happy: {
    leftPupil: { cx: 85, cy: 115 },
    rightPupil: { cx: 155, cy: 115 },
    leftBrow: 'M 70 82 Q 85 72 100 85',
    rightBrow: 'M 140 85 Q 155 72 170 82',
    eyeShape: 'open', // Ollie sorri com os olhos abertos na imagem base, mas sobrancelhas altas
    beakPath: BEAK_OPEN,
    beakInside: 'M 113,148 Q 120,158 127,148 Z',
    headTilt: 0,
    wingRightPose: 'rest',
  },
  encouraging: {
    leftPupil: { cx: 85, cy: 115 },
    rightPupil: { cx: 155, cy: 115 },
    leftBrow: 'M 70 82 Q 85 72 100 85',
    rightBrow: 'M 140 85 Q 155 75 170 88',
    eyeShape: 'wink', // Olho direito piscando
    beakPath: BEAK_OPEN,
    beakInside: 'M 113,148 Q 120,158 127,148 Z',
    headTilt: -3,
    wingRightPose: 'raised-thumb',
  },
  empathetic: {
    leftPupil: { cx: 85, cy: 120 },
    rightPupil: { cx: 155, cy: 120 },
    leftBrow: 'M 65 92 Q 85 80 105 95',
    rightBrow: 'M 135 95 Q 155 80 175 92',
    eyeShape: 'soft', // Olhos fechados para baixo
    beakPath: BEAK_CLOSED,
    headTilt: 0,
    wingRightPose: 'rest',
  },
  thoughtful: {
    leftPupil: { cx: 75, cy: 108 }, // Olhando para cima/esquerda
    rightPupil: { cx: 145, cy: 108 },
    leftBrow: 'M 70 88 Q 85 82 100 88',
    rightBrow: 'M 140 85 Q 155 75 175 80', // Sobrancelha direita levantada
    eyeShape: 'open',
    beakPath: BEAK_O, // Bico fazendo "biquinho"
    headTilt: -5,
    wingRightPose: 'raised-chin',
  },
}

function renderWingLeft(uid: string) {
  return (
    <g data-testid="owl-wing-left" filter={`url(#dropShadow-${uid})`}>
      <path
        d="M 55,160 C 25,170 15,225 30,245 C 40,260 65,245 75,220 C 85,190 70,165 55,160 Z"
        fill={`url(#owlWingGrad-${uid})`}
      />
      {/* Detalhe da pena da asa */}
      <path d="M 35,220 C 45,235 55,235 65,215" stroke="#BA6500" strokeWidth="4" strokeLinecap="round" fill="none" opacity="0.5" />
    </g>
  )
}

function renderWingRight(pose: WingPose, uid: string) {
  if (pose === 'raised-thumb') {
    return (
      <g data-testid="owl-wing-right" filter={`url(#dropShadow-${uid})`}>
        {/* Braço gordinho levantado */}
        <path
          d="M 185,160 C 215,140 230,160 215,190 C 205,210 180,205 165,185 Z"
          fill={`url(#owlWingGrad-${uid})`}
        />
        {/* Joinha (Thumb) */}
        <path
          d="M 205,155 C 205,140 225,140 220,160 Z"
          fill="#F5AA1C"
        />
      </g>
    )
  }
  if (pose === 'raised-chin') {
    return (
      <g data-testid="owl-wing-right" filter={`url(#dropShadow-${uid})`}>
        <path
          d="M 175,170 C 200,180 210,145 180,140 C 160,135 150,160 175,170 Z"
          fill={`url(#owlWingGrad-${uid})`}
        />
      </g>
    )
  }
  // Posição Rest (Padrão)
  return (
    <g data-testid="owl-wing-right" filter={`url(#dropShadow-${uid})`}>
      <path
        d="M 185,160 C 215,170 225,225 210,245 C 200,260 175,245 165,220 C 155,190 170,165 185,160 Z"
        fill={`url(#owlWingGrad-${uid})`}
      />
      {/* Detalhe da pena da asa */}
      <path d="M 205,220 C 195,235 185,235 175,215" stroke="#BA6500" strokeWidth="4" strokeLinecap="round" fill="none" opacity="0.5" />
    </g>
  )
}

export default function OwlAvatar({ avatarState, movement = 'idle', beakOpen = false }: OwlAvatarProps) {
  const uid = useId().replace(/:/g, '')
  const expr = EXPRESSIONS[avatarState]
  const isBeakOpen = beakOpen && avatarState === 'neutral' ? BEAK_OPEN : expr.beakPath

  return (
    <div
      role="img"
      aria-label={`Ollie está ${STATE_LABEL[avatarState]}`}
      className={`w-48 h-48 owl-avatar owl-${avatarState} owl-${movement}`}
    >
      <svg
        viewBox="0 0 240 280"
        xmlns="http://www.w3.org/2000/svg"
        width="100%"
        height="100%"
        aria-hidden="true"
        style={{ overflow: 'visible' }}
      >
        <defs>
          {/* Sombras Universais */}
          <filter id={`dropShadow-${uid}`} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="6" stdDeviation="4" floodColor="#4A2500" floodOpacity="0.25" />
          </filter>
          
          <filter id={`innerShadow-${uid}`}>
            <feComponentTransfer in="SourceAlpha"><feFuncA type="linear" slope="0.3"/></feComponentTransfer>
            <feGaussianBlur stdDeviation="3" result="blur"/>
            <feOffset dy="4" dx="0"/>
            <feComposite operator="out" in2="SourceAlpha"/>
            <feComposite operator="in" in2="SourceGraphic"/>
            <feBlend mode="multiply" in2="SourceGraphic"/>
          </filter>

          {/* Gradientes Ollie Base */}
          <radialGradient id={`owlBodyGrad-${uid}`} cx="50%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#DE8700" />
            <stop offset="70%" stopColor="#C46E00" />
            <stop offset="100%" stopColor="#9C5200" />
          </radialGradient>

          <radialGradient id={`owlBellyGrad-${uid}`} cx="50%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="85%" stopColor="#F5EFE6" />
            <stop offset="100%" stopColor="#D9CBB0" />
          </radialGradient>

          <linearGradient id={`owlWingGrad-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#D98200" />
            <stop offset="100%" stopColor="#A85700" />
          </linearGradient>

          <linearGradient id={`hatBoardGrad-${uid}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#D68000" />
            <stop offset="100%" stopColor="#A35900" />
          </linearGradient>
        </defs>

        {/* Corpo Base */}
        <g>
          {/* Pés (3 dedinhos redondos cada) */}
          <g fill="#F3A712" filter={`url(#dropShadow-${uid})`}>
            {/* Pé Esquerdo */}
            <rect x="75" y="245" width="16" height="22" rx="8" transform="rotate(20 83 256)" />
            <rect x="88" y="248" width="16" height="22" rx="8" />
            <rect x="101" y="245" width="16" height="22" rx="8" transform="rotate(-15 109 256)" />
            {/* Pé Direito */}
            <rect x="123" y="245" width="16" height="22" rx="8" transform="rotate(15 131 256)" />
            <rect x="136" y="248" width="16" height="22" rx="8" />
            <rect x="149" y="245" width="16" height="22" rx="8" transform="rotate(-20 157 256)" />
          </g>

          {/* Asas */}
          {renderWingLeft(uid)}
          {renderWingRight(expr.wingRightPose, uid)}

          {/* Torso */}
          <path 
            d="M 65,130 C 40,190 60,255 120,255 C 180,255 200,190 175,130 Z" 
            fill={`url(#owlBodyGrad-${uid})`} 
            filter={`url(#dropShadow-${uid})`}
          />

          {/* Barriga Branca */}
          <path 
            d="M 75,150 C 65,200 80,248 120,248 C 160,248 175,200 165,150 C 150,130 90,130 75,150 Z" 
            fill={`url(#owlBellyGrad-${uid})`} 
          />

          {/* Penugem da barriga (3 linhas de escamas cinza claro) */}
          <g stroke="#C2B8A7" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.6">
            <path d="M 105,190 Q 112,198 120,190 Q 128,198 135,190" />
            <path d="M 98,210 Q 105,218 112,210 Q 120,218 128,210 Q 135,218 142,210" />
            <path d="M 105,230 Q 112,238 120,230 Q 128,238 135,230" />
          </g>
        </g>

        {/* Grupo da Cabeça (Permite inclinação) */}
        <g data-testid="owl-head-group" transform={`rotate(${expr.headTilt}, 120, 115)`}>
          
          {/* Base da Cabeça */}
          <path 
            d="M 40,110 C 40,65 65,45 120,45 C 175,45 200,65 200,110 C 200,160 170,175 120,175 C 70,175 40,160 40,110 Z" 
            fill={`url(#owlBodyGrad-${uid})`} 
            filter={`url(#dropShadow-${uid})`}
          />

          {/* Máscara Facial Branca (Estilo Goggles do Ollie) */}
          <path 
            d="M 120,70 
               C 165,65 190,85 190,120 
               C 190,150 160,165 120,145
               C 80,165 50,150 50,120 
               C 50,85 75,65 120,70 Z" 
            fill="#FFF9F0" 
            filter={`url(#dropShadow-${uid})`}
          />

          {/* Olho Esquerdo */}
          {expr.eyeShape === 'soft' ? (
             <path d="M 60,115 Q 85,135 110,115" stroke="#331A00" strokeWidth="6" strokeLinecap="round" fill="none" />
          ) : (
            <g>
              <ellipse cx="85" cy="115" rx="28" ry="32" fill="white" />
              <g clipPath="url(#eyeClip)">
                <ellipse cx={expr.leftPupil.cx} cy={expr.leftPupil.cy} rx="20" ry="24" fill="#1C1814" />
                <circle cx={expr.leftPupil.cx + 6} cy={expr.leftPupil.cy - 8} r="8" fill="white" />
                <circle cx={expr.leftPupil.cx - 6} cy={expr.leftPupil.cy + 8} r="3" fill="white" />
              </g>
            </g>
          )}

          {/* Olho Direito */}
          {expr.eyeShape === 'wink' ? (
            <path d="M 135,115 Q 155,95 175,115" stroke="#331A00" strokeWidth="7" strokeLinecap="round" fill="none" />
          ) : expr.eyeShape === 'soft' ? (
            <path d="M 130,115 Q 155,135 180,115" stroke="#331A00" strokeWidth="6" strokeLinecap="round" fill="none" />
          ) : (
            <g>
              <ellipse cx="155" cy="115" rx="28" ry="32" fill="white" />
              <g clipPath="url(#eyeClip)">
                <ellipse cx={expr.rightPupil.cx} cy={expr.rightPupil.cy} rx="20" ry="24" fill="#1C1814" />
                <circle cx={expr.rightPupil.cx + 6} cy={expr.rightPupil.cy - 8} r="8" fill="white" />
                <circle cx={expr.rightPupil.cx - 6} cy={expr.rightPupil.cy + 8} r="3" fill="white" />
              </g>
            </g>
          )}

          {/* Sobrancelhas (Grossas e Arredondadas) */}
          <path d={expr.leftBrow} stroke="#4A2B00" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <path d={expr.rightBrow} stroke="#4A2B00" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" fill="none" />

          {/* Bico (3D Fleshy) */}
          <g filter={`url(#dropShadow-${uid})`}>
             <path 
              d={isBeakOpen} 
              fill="#F7AB14" 
              stroke="#D68000"
              strokeWidth="1"
            />
            {/* Interior do Bico (se aberto) */}
            {expr.beakInside && (
               <path d={expr.beakInside} fill="#7A1D00" />
            )}
            {/* Brilho do Bico */}
            <path d="M 116,141 Q 120,138 124,141 Z" fill="#FFE299" opacity="0.8"/>
          </g>

          {/* Chapéu de Formatura (Ollie Style) */}
          <g filter={`url(#dropShadow-${uid})`}>
            {/* Base Cilíndrica e Chevron Branco */}
            <path d="M 70,45 Q 120,65 170,45 L 165,58 Q 120,80 75,58 Z" fill="#C46E00" />
            <path d="M 72,50 Q 120,72 168,50 L 166,54 Q 120,76 74,54 Z" fill="#FFFFFF" opacity="0.95" />
            
            {/* Espessura do Topo */}
            <path d="M 30,30 L 120,55 L 210,30 L 210,36 L 120,61 L 30,36 Z" fill="#A85700" />
            
            {/* Superfície do Topo */}
            <path d="M 120,5 L 210,30 L 120,55 L 30,30 Z" fill={`url(#hatBoardGrad-${uid})`} />
            
            {/* Botão Superior */}
            <ellipse cx="120" cy="30" rx="6" ry="4" fill="#F3A712" />
            
            {/* Tassel (Cordinha e Franja) à Esquerda */}
            <path d="M 120,30 Q 70,30 55,50" fill="none" stroke="#F3A712" strokeWidth="2.5" />
            <path d="M 55,50 C 65,70 45,70 55,50 Z" fill="#F3A712" />
            <path d="M 52,60 L 48,80 M 55,60 L 55,82 M 58,60 L 62,80" stroke="#F3A712" strokeWidth="2" strokeLinecap="round" fill="none" />
          </g>

        </g>
      </svg>
    </div>
  )
}