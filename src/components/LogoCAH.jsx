/**
 * Logo CAH — círculo preto com borda dourada e letras CAH.
 * O "A" tem um triângulo dourado no centro (referência ao telhado/imóvel).
 */
export default function LogoCAH({ size = 48, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <radialGradient id="goldGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#F0C84B" />
          <stop offset="100%" stopColor="#B8860B" />
        </radialGradient>
        <radialGradient id="borderGlow" cx="50%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#FFD966" />
          <stop offset="60%" stopColor="#C9A227" />
          <stop offset="100%" stopColor="#8B6914" />
        </radialGradient>
      </defs>

      {/* Fundo preto */}
      <circle cx="50" cy="50" r="48" fill="#0a0a0a" />

      {/* Borda dourada */}
      <circle cx="50" cy="50" r="47" fill="none" stroke="url(#borderGlow)" strokeWidth="3.5" />

      {/* Texto CAH */}
      {/* C */}
      <text
        x="16"
        y="65"
        fontFamily="'Arial Black', Arial, sans-serif"
        fontWeight="900"
        fontSize="38"
        fill="white"
        letterSpacing="-1"
      >C</text>

      {/* A com triângulo dourado */}
      <text
        x="36"
        y="65"
        fontFamily="'Arial Black', Arial, sans-serif"
        fontWeight="900"
        fontSize="38"
        fill="white"
        letterSpacing="-1"
      >A</text>
      {/* Triângulo dourado sobreposto ao "A" */}
      <polygon points="50,34 44,52 56,52" fill="url(#goldGlow)" opacity="0.95" />

      {/* H */}
      <text
        x="60"
        y="65"
        fontFamily="'Arial Black', Arial, sans-serif"
        fontWeight="900"
        fontSize="38"
        fill="white"
        letterSpacing="-1"
      >H</text>
    </svg>
  )
}
