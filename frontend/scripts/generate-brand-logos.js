const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, '..', 'public', 'brands');
fs.mkdirSync(targetDir, { recursive: true });

const brands = {
  'intel.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 40" fill="none">
    <path d="M14 11h4v18h-4zM22 15h4v14h-4zM22 11h4v2.5h-4zM30 18h4v11h-4zM30 15h4v1.8h-4zM38 13h4v16h-4z" fill="#0068B5"/>
    <text x="46" y="27" font-family="'Segoe UI', -apple-system, sans-serif" font-weight="900" font-size="20" fill="#0071C5" letter-spacing="-0.5">intel</text>
    <circle cx="70" cy="14" r="2.2" fill="#00C7FD"/>
  </svg>`,
  'nvidia.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 130 40" fill="none">
    <path d="M12 24c4.5-5.5 11.5-6.5 17-2.5 3 2.2 4.5 5 4.5 5s-2.5 2-6.5.5c-3-1.1-6.5-.5-9 2.5-2.2 2.6-2.5 5.5-2.5 5.5s-4-4.5-3.5-11z" fill="#76B900"/>
    <path d="M18 20c3-3.7 7.5-4.3 11-1.6 2 1.4 3 3.3 3 3.3s-1.6 1.3-4.3.3c-2-.7-4.3-.3-6 1.7-1.4 1.7-1.6 3.6-1.6 3.6s-2.6-3-2.1-7.3z" fill="#5A8F00"/>
    <text x="38" y="26" font-family="'Arial Black', Impact, sans-serif" font-weight="900" font-size="17" fill="#76B900" letter-spacing="0.5">NVIDIA</text>
  </svg>`,
  'amd.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 110 40" fill="none">
    <path d="M10 12h8l-4 4h-4v-4zm9 0h8v8l-4-4h-4v-4zm4 7.5l4 4.5V20h-4zM10 19.5l4 4.5h-4v-4.5z" fill="#ED1C24"/>
    <path d="M15 25l3 3h-8v-8l4 4v1h1zm12-3v8h-8l3-3h1v-1l4-4z" fill="#00A376"/>
    <text x="34" y="27" font-family="'Arial Black', sans-serif" font-weight="900" font-size="20" fill="#ED1C24" letter-spacing="1">AMD</text>
  </svg>`,
  'asus.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 110 40" fill="none">
    <text x="10" y="27" font-family="'Arial Black', Helvetica, sans-serif" font-weight="900" font-size="22" fill="#00539B" letter-spacing="2">ASUS</text>
    <rect x="10" y="19" width="90" height="2" fill="#00539B" opacity="0.35"/>
  </svg>`,
  'dell.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 40" fill="none">
    <circle cx="50" cy="20" r="16" stroke="#007DB8" stroke-width="3" fill="none"/>
    <text x="50" y="26" text-anchor="middle" font-family="'Segoe UI', Arial, sans-serif" font-weight="900" font-size="16" fill="#007DB8" letter-spacing="1">DELL</text>
  </svg>`,
  'hpe.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 40" fill="none">
    <rect x="8" y="9" width="32" height="22" rx="2" stroke="#01A982" stroke-width="3" fill="none"/>
    <text x="46" y="27" font-family="'Arial Black', sans-serif" font-weight="900" font-size="21" fill="#01A982" letter-spacing="1">HPE</text>
  </svg>`,
  'lenovo.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 40" fill="none">
    <rect x="6" y="9" width="108" height="22" rx="3" fill="#E2231A"/>
    <text x="18" y="25" font-family="'Segoe UI', Arial, sans-serif" font-weight="800" font-size="16" fill="#FFFFFF" letter-spacing="0.5">Lenovo</text>
  </svg>`,
  'cisco.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 110 40" fill="none">
    <rect x="8" y="18" width="3" height="5" rx="1.5" fill="#049FD9"/>
    <rect x="13" y="14" width="3" height="9" rx="1.5" fill="#049FD9"/>
    <rect x="18" y="11" width="3" height="12" rx="1.5" fill="#049FD9"/>
    <rect x="23" y="14" width="3" height="9" rx="1.5" fill="#049FD9"/>
    <rect x="28" y="18" width="3" height="5" rx="1.5" fill="#049FD9"/>
    <text x="38" y="26" font-family="'Segoe UI', sans-serif" font-weight="900" font-size="18" fill="#049FD9" letter-spacing="1">CISCO</text>
  </svg>`,
  'samsung.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 40" fill="none">
    <ellipse cx="60" cy="20" rx="55" ry="13" fill="#1428A0"/>
    <text x="19" y="24.5" font-family="'Arial Black', sans-serif" font-weight="900" font-size="13" fill="#FFFFFF" letter-spacing="1.2">SAMSUNG</text>
  </svg>`,
  'kingston.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 130 40" fill="none">
    <circle cx="18" cy="20" r="11" fill="#E31837"/>
    <path d="M14 16l4 8 4-8" stroke="#FFFFFF" stroke-width="2.5" stroke-linejoin="round" fill="none"/>
    <text x="34" y="26" font-family="'Arial Black', sans-serif" font-weight="900" font-size="16" fill="#E31837" letter-spacing="0.5">Kingston</text>
  </svg>`,
  'seasonic.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 40" fill="none">
    <circle cx="18" cy="20" r="10" fill="#0066B3"/>
    <path d="M14 23c2 2 6 2 8-1s-2-5-4-5-4-2-2-4 5-1 7 1" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" fill="none"/>
    <text x="33" y="26" font-family="'Segoe UI', sans-serif" font-weight="800" font-size="17" fill="#0066B3" letter-spacing="0.5">SeaSonic</text>
  </svg>`,
  'corsair.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 130 40" fill="none">
    <path d="M10 27l5-15 5 15-5-3z M15 11l5 16 5-16-5 3z" fill="#EAB308"/>
    <text x="34" y="26" font-family="'Arial Black', sans-serif" font-weight="900" font-size="15" fill="#EAB308" letter-spacing="1">CORSAIR</text>
  </svg>`,
  'supermicro.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 130 40" fill="none">
    <circle cx="16" cy="20" r="9" stroke="#007F3E" stroke-width="2.5" fill="none"/>
    <path d="M10 20a6 6 0 0 1 12 0" stroke="#00549E" stroke-width="2.5" fill="none"/>
    <text x="30" y="25.5" font-family="'Arial Black', sans-serif" font-weight="900" font-size="12.5" fill="#007F3E" letter-spacing="0.5">SUPERMICRO</text>
  </svg>`,
  'wd.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 40" fill="none">
    <rect x="6" y="10" width="28" height="20" rx="4" fill="#005092"/>
    <text x="10" y="25" font-family="'Arial Black', sans-serif" font-weight="900" font-size="13" fill="#FFFFFF">WD</text>
    <text x="40" y="25" font-family="'Segoe UI', sans-serif" font-weight="800" font-size="13" fill="#005092" letter-spacing="-0.3">Western Digital</text>
  </svg>`,
  'seagate.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 40" fill="none">
    <circle cx="18" cy="20" r="10" stroke="#00A34A" stroke-width="3" stroke-dasharray="12 4" fill="none"/>
    <text x="34" y="26" font-family="'Segoe UI', sans-serif" font-weight="900" font-size="16" fill="#00A34A" letter-spacing="1">SEAGATE</text>
  </svg>`,
  'gigabyte.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 40" fill="none">
    <path d="M10 14l10-4 4 10-14-6z" fill="#F05023"/>
    <text x="28" y="26" font-family="'Arial Black', sans-serif" font-weight="900" font-size="15" fill="#F05023" letter-spacing="1">GIGABYTE</text>
  </svg>`,
  'msi.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 110 40" fill="none">
    <rect x="8" y="10" width="20" height="20" rx="3" fill="#ED1C24"/>
    <path d="M12 24l6-8 6 8" stroke="#FFFFFF" stroke-width="2.5" stroke-linejoin="round" fill="none"/>
    <text x="34" y="27" font-family="'Arial Black', sans-serif" font-weight="900" font-size="20" fill="#ED1C24" letter-spacing="1.5">msi</text>
  </svg>`,
  'synology.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 40" fill="none">
    <circle cx="12" cy="17" r="3" fill="#0070BA"/>
    <circle cx="19" cy="23" r="3" fill="#0070BA"/>
    <circle cx="26" cy="17" r="3" fill="#0070BA"/>
    <text x="34" y="26" font-family="'Segoe UI', sans-serif" font-weight="800" font-size="16" fill="#0070BA" letter-spacing="0.5">Synology</text>
  </svg>`,
  'fortinet.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 40" fill="none">
    <rect x="8" y="12" width="6" height="6" rx="1" fill="#EE3124"/>
    <rect x="16" y="12" width="6" height="6" rx="1" fill="#EE3124"/>
    <rect x="12" y="20" width="6" height="6" rx="1" fill="#EE3124"/>
    <rect x="20" y="20" width="6" height="6" rx="1" fill="#EE3124"/>
    <text x="32" y="26" font-family="'Arial Black', sans-serif" font-weight="900" font-size="15" fill="#EE3124" letter-spacing="1">FORTINET</text>
  </svg>`,
  'crucial.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 40" fill="none">
    <circle cx="18" cy="20" r="10" stroke="#0072CE" stroke-width="3" stroke-dasharray="30 15" fill="none"/>
    <text x="34" y="26" font-family="'Segoe UI', sans-serif" font-weight="900" font-size="17" fill="#0072CE" letter-spacing="0.5">crucial</text>
  </svg>`
};

for (const [filename, content] of Object.entries(brands)) {
  fs.writeFileSync(path.join(targetDir, filename), content.trim());
}

console.log(`Generated ${Object.keys(brands).length} brand SVG icons into ${targetDir}`);
