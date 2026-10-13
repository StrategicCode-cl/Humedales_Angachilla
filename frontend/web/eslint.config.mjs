import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // Componentes portados tal cual desde la maqueta: sincronizan estado en efectos.
    // Se dejan como advertencias hasta refactorizarlos al conectar el backend;
    // el código nuevo mantiene estas reglas como errores.
    files: [
      "src/components/{CommunityGallery,MapNavigation,NoticeBoard,QRScannerModal,WetlandWeatherWidget}.tsx",
      "src/hooks/usePWAInstall.ts",
    ],
    rules: {
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/immutability": "warn",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
