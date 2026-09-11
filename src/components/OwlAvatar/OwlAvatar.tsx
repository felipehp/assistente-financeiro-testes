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

// Bico fechado padrão — sem Q para o teste beakOpen=false
const BEAK_CLOSED = 'M 114,150 L 120,144 L 126,150 L 120,161 Z'
// Bico aberto feliz — com Q para o teste beakOpen=true
const BEAK_OPEN = 'M 112,148 Q 120,141 128,148 Q 124,162 120,162 Q 116,162 112,148 Z'
// Bico aberto pensativo/surpreso (menor)
const BEAK_O = 'M 115,149 Q 120,144 125,149 Q 125,157 120,157 Q 115,157 115,149 Z'

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
    leftBrow: 'M 70 73 Q 85 68 100 73',
    rightBrow: 'M 140 73 Q 155 68 170 73',
    eyeShape: 'open',
    beakPath: BEAK_CLOSED,
    headTilt: 0,
    wingRightPose: 'rest',
  },
  happy: {
    leftPupil: { cx: 85, cy: 115 },
    rightPupil: { cx: 155, cy: 115 },
    leftBrow: 'M 70 70 Q 85 60 100 73',
    rightBrow: 'M 140 73 Q 155 60 170 70',
    eyeShape: 'open',
    beakPath: BEAK_OPEN,
    beakInside: 'M 114,152 Q 120,161 126,152 Z',
    headTilt: 0,
    wingRightPose: 'rest',
  },
  encouraging: {
    leftPupil: { cx: 85, cy: 115 },
    rightPupil: { cx: 155, cy: 115 },
    leftBrow: 'M 70 70 Q 85 60 100 73',
    rightBrow: 'M 140 73 Q 155 63 170 76',
    eyeShape: 'wink',
    beakPath: BEAK_OPEN,
    beakInside: 'M 114,152 Q 120,161 126,152 Z',
    headTilt: -3,
    wingRightPose: 'raised-thumb',
  },
  empathetic: {
    leftPupil: { cx: 85, cy: 120 },
    rightPupil: { cx: 155, cy: 120 },
    leftBrow: 'M 63 78 Q 85 66 107 81',
    rightBrow: 'M 133 81 Q 155 66 177 78',
    eyeShape: 'wink',
    beakPath: BEAK_CLOSED,
    headTilt: 5,
    wingRightPose: 'rest',
  },
  thoughtful: {
    leftPupil: { cx: 75, cy: 108 },
    rightPupil: { cx: 145, cy: 108 },
    leftBrow: 'M 70 76 Q 85 70 100 76',
    rightBrow: 'M 140 73 Q 155 63 175 68',
    eyeShape: 'open',
    beakPath: BEAK_O,
    headTilt: -5,
    wingRightPose: 'raised-chin',
  },
}

function renderWingLeft(uid: string) {
  return (
    <g data-testid="owl-wing-left" filter={`url(#dropShadow-${uid})`}>
      <path
        d="M 58,163 C 55,157 40,156 25,170 C 12,184 18,212 38,222 C 55,230 74,220 76,205 C 79,188 70,167 58,163 Z"
        fill={`url(#owlWingGrad-${uid})`}
      />
    </g>
  )
}

function renderWingRight(pose: WingPose, uid: string) {
  if (pose === 'raised-thumb') {
    return (
      <g data-testid="owl-wing-right" filter={`url(#dropShadow-${uid})`}>
        <path
          d="M 174,178 C 194,150 228,158 224,184 C 220,208 193,216 172,200 Z"
          fill={`url(#owlWingGrad-${uid})`}
        />
        {/* Joinha */}
        <path
          data-testid="owl-wing-right-thumb"
          d="M 214,152 C 216,134 232,138 226,160 C 222,162 214,156 214,152 Z"
          fill="#F5AA1C"
        />
      </g>
    )
  }
  if (pose === 'raised-chin') {
    return (
      <g data-testid="owl-wing-right" filter={`url(#dropShadow-${uid})`}>
        <path
          data-testid="owl-wing-right-chin"
          d="M 170,185 C 188,157 218,162 214,186 C 211,205 184,212 168,196 Z"
          fill={`url(#owlWingGrad-${uid})`}
        />
      </g>
    )
  }
  // Posição Rest (Padrão)
  return (
    <g data-testid="owl-wing-right" filter={`url(#dropShadow-${uid})`}>
      <path
        d="M 182,163 C 185,157 200,156 215,170 C 228,184 222,212 202,222 C 185,230 166,220 164,205 C 161,188 170,167 182,163 Z"
        fill={`url(#owlWingGrad-${uid})`}
      />
    </g>
  )
}

const BEAK_INTERIOR_DEFAULT = 'M 114,152 Q 120,161 126,152 Z'

export default function OwlAvatar({ avatarState, movement = 'idle', beakOpen = false }: OwlAvatarProps) {
  const uid = useId().replace(/:/g, '')
  const expr = EXPRESSIONS[avatarState]
  const isBeakOpen = beakOpen && avatarState === 'neutral' ? BEAK_OPEN : expr.beakPath
  // Show mouth interior either from expression config OR when beakOpen forces it open
  const beakInsidePath = expr.beakInside ?? (beakOpen && avatarState === 'neutral' ? BEAK_INTERIOR_DEFAULT : undefined)

  return (
    <div
      role="img"
      aria-label={`AURA está ${STATE_LABEL[avatarState]}`}
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

          <radialGradient id={`owlWingGrad-${uid}`} cx="35%" cy="25%" r="72%">
            <stop offset="0%" stopColor="#E09200" />
            <stop offset="55%" stopColor="#C57200" />
            <stop offset="100%" stopColor="#8C4C00" />
          </radialGradient>

          <linearGradient id={`hatBoardGrad-${uid}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#D68000" />
            <stop offset="100%" stopColor="#A35900" />
          </linearGradient>

          <clipPath id={`eyeClipLeft-${uid}`}>
            <ellipse cx="85" cy="115" rx="32" ry="36" />
          </clipPath>
          <clipPath id={`eyeClipRight-${uid}`}>
            <ellipse cx="155" cy="115" rx="32" ry="36" />
          </clipPath>
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
            d="M 58,135 C 32,188 52,255 120,255 C 188,255 208,188 182,135 Z"
            fill={`url(#owlBodyGrad-${uid})`}
            filter={`url(#dropShadow-${uid})`}
          />

          {/* Barriga Branca */}
          <path
            d="M 70,152 C 58,202 74,250 120,250 C 166,250 182,202 170,152 C 153,130 87,130 70,152 Z"
            fill={`url(#owlBellyGrad-${uid})`}
          />

          {/* Penugem da barriga */}
          <g stroke="#C2B8A7" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.6">
            <path d="M 103,192 Q 111,200 120,192 Q 129,200 137,192" />
            <path d="M 95,212 Q 103,221 111,212 Q 120,221 129,212 Q 137,221 145,212" />
            <path d="M 103,232 Q 111,241 120,232 Q 129,241 137,232" />
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

          {/* Máscara Facial — dois goggles conectados com dip central */}
          <path
            d="M 88,70 C 62,65 50,88 50,120 C 50,150 80,165 120,147 C 160,165 190,150 190,120 C 190,88 178,65 152,70 C 141,66 131,73 120,77 C 109,73 99,66 88,70 Z"
            fill="#FFF9F0"
            filter={`url(#dropShadow-${uid})`}
          />

          {/* Tufos de Orelha (sobre a máscara, acima dos olhos) */}
          <path
            d="M 66,80 C 66,70 72,62 79,65 C 80,58 88,57 91,65 C 93,59 100,61 101,71 L 101,80 Z"
            fill="#4A2B00"
          />
          <path
            d="M 139,80 L 139,71 C 140,61 147,59 149,65 C 152,57 160,58 161,65 C 168,62 174,70 174,80 Z"
            fill="#4A2B00"
          />

          {/* Olho Esquerdo */}
          {expr.eyeShape === 'soft' ? (
            <path d="M 57,115 Q 85,138 113,115" stroke="#331A00" strokeWidth="6" strokeLinecap="round" fill="none" />
          ) : (
            <g>
              <ellipse cx="85" cy="115" rx="32" ry="36" fill="white" />
              <g clipPath={`url(#eyeClipLeft-${uid})`}>
                <ellipse cx={expr.leftPupil.cx} cy={expr.leftPupil.cy} rx="22" ry="26" fill="#1C1814" />
                <circle cx={expr.leftPupil.cx + 7} cy={expr.leftPupil.cy - 9} r="9" fill="white" />
                <circle cx={expr.leftPupil.cx - 6} cy={expr.leftPupil.cy + 9} r="4" fill="white" />
              </g>
            </g>
          )}

          {/* Olho Direito */}
          {expr.eyeShape === 'wink' ? (
            <path data-testid="owl-eye-right-wink" d="M 130,115 Q 155,93 180,115" stroke="#331A00" strokeWidth="7" strokeLinecap="round" fill="none" />
          ) : expr.eyeShape === 'soft' ? (
            <path data-testid="owl-right-eye" d="M 127,115 Q 155,138 183,115" stroke="#331A00" strokeWidth="6" strokeLinecap="round" fill="none" />
          ) : (
            <g data-testid="owl-right-eye">
              <ellipse cx="155" cy="115" rx="32" ry="36" fill="white" />
              <g clipPath={`url(#eyeClipRight-${uid})`}>
                <ellipse cx={expr.rightPupil.cx} cy={expr.rightPupil.cy} rx="22" ry="26" fill="#1C1814" />
                <circle cx={expr.rightPupil.cx + 7} cy={expr.rightPupil.cy - 9} r="9" fill="white" />
                <circle cx={expr.rightPupil.cx - 6} cy={expr.rightPupil.cy + 9} r="4" fill="white" />
              </g>
            </g>
          )}

          {/* Sobrancelhas (Grossas e Arredondadas) */}
          <path d={expr.leftBrow} stroke="#4A2B00" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <path d={expr.rightBrow} stroke="#4A2B00" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" fill="none" />

          {/* Bico (3D Fleshy) */}
          <g filter={`url(#dropShadow-${uid})`}>
             <path
              data-testid="owl-beak-lower"
              d={isBeakOpen}
              fill="#F7AB14"
              stroke="#D68000"
              strokeWidth="1"
            />
            {/* Interior do Bico (se aberto) */}
            {beakInsidePath && (
               <path data-testid="owl-mouth-interior" d={beakInsidePath} fill="#7A1D00" />
            )}
            {/* Brilho do Bico */}
            <path d="M 116,145 Q 120,142 124,145 Z" fill="#FFE299" opacity="0.8"/>
          </g>

          {/* Chapéu de Formatura */}
          <g filter={`url(#dropShadow-${uid})`}>
            {/* Banda cilíndrica (anel que encaixa na cabeça) */}
            <path d="M 68,48 Q 120,68 172,48 L 167,63 Q 120,85 73,63 Z" fill="#B86400" />
            {/* Chevron branco na banda */}
            <path d="M 70,51 Q 120,70 170,51 L 168,57 Q 120,76 72,57 Z" fill="#FFFFFF" opacity="0.95" />

            {/* Borda frontal do board — cria profundidade 3D */}
            <path d="M 32,32 L 120,56 L 208,32 L 208,40 L 120,65 L 32,40 Z" fill="#7A3D00" />

            {/* Superfície superior do board */}
            <path d="M 120,7 L 208,32 L 120,56 L 32,32 Z" fill={`url(#hatBoardGrad-${uid})`} />

            {/* Botão central */}
            <ellipse cx="120" cy="32" rx="7" ry="5" fill="#F5C030" />

            {/* Tassel completo — cordão + pompom + franja */}
            <g data-testid="owl-hat-tassel">
              <path d="M 120,32 C 98,32 76,35 62,52" fill="none" stroke="#F5C030" strokeWidth="4" strokeLinecap="round" />
              <circle cx="61" cy="57" r="9" fill="#F5C030" />
              <g stroke="#F5C030" strokeWidth="3" strokeLinecap="round" fill="none">
                <line x1="51" y1="66" x2="45" y2="88" />
                <line x1="57" y1="67" x2="53" y2="89" />
                <line x1="62" y1="67" x2="61" y2="89" />
                <line x1="67" y1="67" x2="69" y2="88" />
                <line x1="72" y1="66" x2="76" y2="86" />
              </g>
            </g>
          </g>

        </g>
      </svg>
    </div>
  )
}