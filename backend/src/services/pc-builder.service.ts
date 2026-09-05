import { Product, PCBuilderCompatibilityResult, CompatibilityIssue, PCBuilderCategorySlots } from '../types/index.js';
import { productRepository } from '../repositories/product.repository.js';

export class PCBuilderService {
  async evaluateCompatibility(slots: PCBuilderCategorySlots): Promise<PCBuilderCompatibilityResult> {
    const issues: CompatibilityIssue[] = [];
    let estimatedWattage = 75; // Baseline motherboard, fans, chipset, SSDs
    let totalPrice = 0;

    // Calculate total price
    for (const prod of Object.values(slots)) {
      if (prod) {
        totalPrice += prod.salePrice || prod.price;
      }
    }

    const { cpu, motherboard, ram, gpu, psu, cooler, case: pcCase } = slots;

    // 1. CPU Wattage & Socket
    let cpuSocket: string | null = null;
    let cpuTdp = 65;
    if (cpu) {
      cpuSocket = cpu.specifications?.socket || null;
      const wattageStr = cpu.specifications?.wattage || '125';
      const parsedW = parseInt(wattageStr.replace(/[^0-9]/g, ''), 10);
      if (!isNaN(parsedW)) cpuTdp = parsedW;
      estimatedWattage += cpuTdp;
    }

    // 2. Motherboard Socket & RAM Type
    let mbSocket: string | null = null;
    let mbRamType: string | null = null;
    if (motherboard) {
      mbSocket = motherboard.specifications?.socket || null;
      mbRamType = motherboard.specifications?.ramType || motherboard.specifications?.memoryType || null;
    }

    // Check CPU <-> Motherboard Socket Match
    if (cpu && motherboard && cpuSocket && mbSocket) {
      const cleanCpuSocket = cpuSocket.toUpperCase().replace(/\s+/g, '');
      const cleanMbSocket = mbSocket.toUpperCase().replace(/\s+/g, '');
      if (cleanCpuSocket !== cleanMbSocket) {
        issues.push({
          type: 'ERROR',
          category: 'CPU_MOTHERBOARD_SOCKET',
          message: `CPU Socket (${cpuSocket}) does not match Motherboard Socket (${mbSocket}). They are physically incompatible.`,
          affectedComponents: ['CPU', 'Motherboard'],
        });
      }
    }

    // 3. RAM Type Match (DDR4 vs DDR5)
    let ramType: string | null = null;
    if (ram) {
      ramType = ram.specifications?.ramType || ram.specifications?.memoryType || (ram.name.includes('DDR5') ? 'DDR5' : ram.name.includes('DDR4') ? 'DDR4' : null);
      estimatedWattage += 15;
    }

    if (motherboard && ram && mbRamType && ramType) {
      const cleanMbRam = mbRamType.toUpperCase();
      const cleanRam = ramType.toUpperCase();
      if (!cleanMbRam.includes(cleanRam) && !cleanRam.includes(cleanMbRam)) {
        issues.push({
          type: 'ERROR',
          category: 'RAM_MOTHERBOARD_GENERATION',
          message: `Motherboard requires ${mbRamType} memory, but selected RAM is ${ramType}.`,
          affectedComponents: ['Motherboard', 'RAM'],
        });
      }
    }

    // 4. GPU Wattage & Case Clearance
    let gpuWattage = 0;
    if (gpu) {
      const wattageStr = gpu.specifications?.wattage || (gpu.name.includes('4090') ? '450' : gpu.name.includes('4080') ? '320' : gpu.name.includes('4070') ? '220' : '200');
      const parsedW = parseInt(String(wattageStr).replace(/[^0-9]/g, ''), 10);
      if (!isNaN(parsedW)) gpuWattage = parsedW;
      estimatedWattage += gpuWattage;
    }

    // 5. PSU Wattage Check
    const recommendedPsuWattage = Math.ceil((estimatedWattage * 1.3) / 50) * 50; // 30% safety headroom
    if (psu) {
      const psuWattageStr = psu.specifications?.wattage || psu.name;
      const match = psuWattageStr.match(/(\d{3,4})\s*W/i);
      const psuWattage = match ? parseInt(match[1], 10) : 650;

      if (psuWattage < estimatedWattage) {
        issues.push({
          type: 'ERROR',
          category: 'PSU_INSUFFICIENT_WATTAGE',
          message: `Selected PSU (${psuWattage}W) cannot supply system peak power (${estimatedWattage}W). System will shut down under load.`,
          affectedComponents: ['Power Supply'],
        });
      } else if (psuWattage < recommendedPsuWattage) {
        issues.push({
          type: 'WARNING',
          category: 'PSU_TIGHT_HEADROOM',
          message: `Selected PSU (${psuWattage}W) provides minimal headroom above estimated ${estimatedWattage}W. Recommended: ${recommendedPsuWattage}W+.`,
          affectedComponents: ['Power Supply'],
        });
      }
    }

    // 6. Cooler Compatibility
    if (cooler && cpu && cpuTdp > 200) {
      const coolerType = cooler.specifications?.coolerType || cooler.name;
      if (!coolerType.includes('360') && !coolerType.includes('280') && !coolerType.includes('Liquid') && !coolerType.includes('AIO')) {
        issues.push({
          type: 'WARNING',
          category: 'COOLER_THERMAL_CAPACITY',
          message: `High-TDP processor (${cpu.name}, ~${cpuTdp}W) may thermal-throttle with a basic air cooler. 280mm/360mm AIO recommended.`,
          affectedComponents: ['CPU', 'CPU Cooler'],
        });
      }
    }

    const hasErrors = issues.some(i => i.type === 'ERROR');

    return {
      isCompatible: !hasErrors,
      totalEstimatedWattage: estimatedWattage,
      recommendedPsuWattage,
      issues,
      totalPrice: Math.round(totalPrice * 100) / 100,
    };
  }

  async getComponentsByCategory(): Promise<Record<string, Product[]>> {
    const products = await productRepository.find({
      where: [
        { field: 'isActive', operator: '==', value: true },
        { field: 'approvalStatus', operator: '==', value: 'APPROVED' },
      ],
    });

    const grouped: Record<string, Product[]> = {
      cpu: [],
      motherboard: [],
      ram: [],
      gpu: [],
      storage: [],
      psu: [],
      case: [],
      cooler: [],
    };

    for (const p of products) {
      const name = p.name.toLowerCase();
      const cat = p.categoryName.toLowerCase();

      if (cat.includes('processor') || cat.includes('cpu') || name.includes('core i') || name.includes('ryzen')) {
        grouped.cpu.push(p);
      } else if (cat.includes('motherboard') || name.includes('z790') || name.includes('b650') || name.includes('x670') || name.includes('motherboard')) {
        grouped.motherboard.push(p);
      } else if (cat.includes('ram') || cat.includes('memory') || name.includes('ddr4') || name.includes('ddr5')) {
        grouped.ram.push(p);
      } else if (cat.includes('gpu') || cat.includes('graphics') || name.includes('geforce') || name.includes('radeon') || name.includes('rtx')) {
        grouped.gpu.push(p);
      } else if (cat.includes('storage') || cat.includes('ssd') || cat.includes('nvme') || name.includes('ssd') || name.includes('990 pro')) {
        grouped.storage.push(p);
      } else if (cat.includes('power') || cat.includes('psu') || name.includes('power supply') || name.includes('corsair rm') || name.includes('850w')) {
        grouped.psu.push(p);
      } else if (cat.includes('case') || name.includes('chassis') || name.includes('tower') || name.includes('h9 flow') || name.includes('o11')) {
        grouped.case.push(p);
      } else if (cat.includes('cooler') || name.includes('kraken') || name.includes('liquid') || name.includes('noctua')) {
        grouped.cooler.push(p);
      }
    }

    return grouped;
  }
}

export const pcBuilderService = new PCBuilderService();
