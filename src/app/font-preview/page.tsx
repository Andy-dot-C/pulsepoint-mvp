import {
  Archivo,
  Barlow,
  Exo_2,
  IBM_Plex_Sans,
  DM_Sans,
  Inter,
  Manrope,
  Mulish,
  Outfit,
  Plus_Jakarta_Sans,
  Sora,
  Space_Grotesk
} from "next/font/google";
import { FontPreviewClient } from "@/components/font-preview-client";

const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope", display: "swap" });
const sora = Sora({ subsets: ["latin"], variable: "--font-sora", display: "swap" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-space-grotesk", display: "swap" });
const plusJakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-plus-jakarta", display: "swap" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit", display: "swap" });
const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans", display: "swap" });
const ibmPlexSans = IBM_Plex_Sans({ subsets: ["latin"], variable: "--font-ibm-plex-sans", display: "swap", weight: ["400", "500", "600", "700"] });
const archivo = Archivo({ subsets: ["latin"], variable: "--font-archivo", display: "swap", weight: ["400", "500", "600", "700"] });
const barlow = Barlow({ subsets: ["latin"], variable: "--font-barlow", display: "swap", weight: ["400", "500", "600", "700"] });
const exo2 = Exo_2({ subsets: ["latin"], variable: "--font-exo2", display: "swap", weight: ["400", "500", "600", "700"] });
const mulish = Mulish({ subsets: ["latin"], variable: "--font-mulish", display: "swap", weight: ["400", "500", "600", "700"] });

const presets = [
  {
    id: "current",
    name: "Current (Manrope + Sora)",
    bodyVar: "var(--font-manrope)",
    displayVar: "var(--font-sora)"
  },
  {
    id: "inter-space",
    name: "Inter + Space Grotesk",
    bodyVar: "var(--font-inter)",
    displayVar: "var(--font-space-grotesk)"
  },
  {
    id: "jakarta-outfit",
    name: "Plus Jakarta + Outfit",
    bodyVar: "var(--font-plus-jakarta)",
    displayVar: "var(--font-outfit)"
  },
  {
    id: "dm-space",
    name: "DM Sans + Space Grotesk",
    bodyVar: "var(--font-dm-sans)",
    displayVar: "var(--font-space-grotesk)"
  },
  {
    id: "inter-outfit",
    name: "Inter + Outfit",
    bodyVar: "var(--font-inter)",
    displayVar: "var(--font-outfit)"
  },
  {
    id: "plex-archivo",
    name: "IBM Plex Sans + Archivo",
    bodyVar: "var(--font-ibm-plex-sans)",
    displayVar: "var(--font-archivo)"
  },
  {
    id: "inter-archivo",
    name: "Inter + Archivo",
    bodyVar: "var(--font-inter)",
    displayVar: "var(--font-archivo)"
  },
  {
    id: "barlow-space",
    name: "Barlow + Space Grotesk",
    bodyVar: "var(--font-barlow)",
    displayVar: "var(--font-space-grotesk)"
  },
  {
    id: "mulish-outfit",
    name: "Mulish + Outfit",
    bodyVar: "var(--font-mulish)",
    displayVar: "var(--font-outfit)"
  },
  {
    id: "exo2-archivo",
    name: "Exo 2 + Archivo",
    bodyVar: "var(--font-exo2)",
    displayVar: "var(--font-archivo)"
  }
] as const;

export default function FontPreviewPage() {
  return (
    <div
      className={`${manrope.variable} ${sora.variable} ${inter.variable} ${spaceGrotesk.variable} ${plusJakarta.variable} ${outfit.variable} ${dmSans.variable} ${ibmPlexSans.variable} ${archivo.variable} ${barlow.variable} ${exo2.variable} ${mulish.variable}`}
    >
      <FontPreviewClient presets={[...presets]} />
    </div>
  );
}
