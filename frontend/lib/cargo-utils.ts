import { Order, CargoDetails } from '@/types';

export function getEstimatedOrderWeight(order: Order): number {
  if (order.cargoDetails?.weightKg && order.cargoDetails.weightKg > 0) {
    return order.cargoDetails.weightKg;
  }
  if (!order.items || order.items.length === 0) return 2.5;

  let totalWeight = 0;
  for (const item of order.items) {
    const name = (item.productName || '').toLowerCase();
    const qty = item.quantity || 1;
    let unitWeight = 1.2;

    if (name.includes('server') || name.includes('rack') || name.includes('workstation')) {
      unitWeight = 18.5;
    } else if (name.includes('rtx') || name.includes('gpu') || name.includes('geforce') || name.includes('radeon')) {
      unitWeight = 2.4;
    } else if (name.includes('laptop') || name.includes('probook') || name.includes('thinkpad')) {
      unitWeight = 3.6;
    } else if (name.includes('motherboard') || name.includes('chassis') || name.includes('case')) {
      unitWeight = 4.2;
    } else if (name.includes('power supply') || name.includes('psu')) {
      unitWeight = 2.8;
    } else if (name.includes('ssd') || name.includes('nvme') || name.includes('ram') || name.includes('memory') || name.includes('cpu') || name.includes('processor')) {
      unitWeight = 0.35;
    }
    totalWeight += unitWeight * qty;
  }
  return Math.round(totalWeight * 10) / 10;
}

export function getDerivedCargoDetails(order: Order, index: number = 0): CargoDetails {
  const existing = order.cargoDetails || {};
  const weight = getEstimatedOrderWeight(order);
  const city = order.shippingAddress?.city || 'Dubai';
  const country = order.shippingAddress?.country || 'AE';
  const numOnly = order.orderNumber?.replace(/[^0-9]/g, '') || String(100000 + index * 37);

  // Default carrier rotation based on order ID
  const carriers = ['DHL Express', 'Aramex GCC Global', 'FedEx Freight', 'NexTech Direct Logistics'];
  const defaultCarrier = order.carrier || existing.carrier || carriers[index % carriers.length];

  // Default AWB
  const defaultAwb = order.trackingNumber || existing.trackingNumber || existing.waybillNumber || `AWB-DXB-${numOnly.slice(-6)}`;

  // Default destination hub
  let destHub = 'DXB Air Cargo Village (Terminal 2)';
  if (city.toLowerCase().includes('abu dhabi')) destHub = 'AUH Khalifa Industrial Hub (KIZAD)';
  else if (city.toLowerCase().includes('sharjah')) destHub = 'SHJ International Freight Terminal';
  else if (city.toLowerCase().includes('riyadh')) destHub = 'RUH Cargo Dry Port Terminal 4';
  else if (city.toLowerCase().includes('dammam')) destHub = 'DMM King Fahd Logistics City';

  const defaultDimensions = weight > 10 ? '75 x 55 x 45 cm' : weight > 4 ? '50 x 38 x 28 cm' : '32 x 24 x 16 cm';
  const volumetric = Math.round((weight * 1.15) * 10) / 10;

  return {
    waybillNumber: existing.waybillNumber || defaultAwb,
    trackingNumber: existing.trackingNumber || defaultAwb,
    carrier: defaultCarrier,
    cargoType: weight > 15 ? 'Heavy Freight Pallet (ESD Grounded)' : weight > 5 ? 'Priority Air Express (Insured Fragile)' : 'Secure Electronic Parcel',
    weightKg: existing.weightKg || weight,
    volumetricWeightKg: existing.volumetricWeightKg || volumetric,
    packageCount: existing.packageCount || (weight > 12 ? 2 : 1),
    dimensions: existing.dimensions || defaultDimensions,
    originHub: existing.originHub || 'NexTech Central Logistics Depot (Dubai South DWC Hub)',
    destinationHub: existing.destinationHub || destHub,
    customsStatus: existing.customsStatus || 'CLEARED',
    customsDeclarationNumber: existing.customsDeclarationNumber || `BOE-AE-2026-${numOnly.slice(-6)}`,
    driverName: existing.driverName || (defaultCarrier.includes('NexTech') ? 'Farooq Al-Marzouqi' : 'Assigned Courier Lead'),
    driverPhone: existing.driverPhone || (defaultCarrier.includes('NexTech') ? '+971 50 829 4410' : '+971 800 345'),
    vehiclePlate: existing.vehiclePlate || (defaultCarrier.includes('NexTech') ? 'DXB-Z-49210 (Reefer Van)' : 'Commercial Freight Fleet'),
    estimatedDeliveryDate: existing.estimatedDeliveryDate || new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    dispatchedAt: existing.dispatchedAt || order.createdAt,
    milestones: existing.milestones && existing.milestones.length > 0 ? existing.milestones : [
      {
        stage: 'Consignment Created & Weighed',
        location: 'Dubai South DWC Hub',
        timestamp: order.createdAt,
        completed: true,
        notes: `Weight verified at ${weight} kg. ESD compliance check passed.`,
      },
      {
        stage: 'Security & Customs Inspection',
        location: 'Dubai Customs Inspection Bay 3',
        timestamp: new Date(new Date(order.createdAt).getTime() + 3600000 * 3).toISOString(),
        completed: true,
        notes: `Declaration Cleared: BOE-AE-2026-${numOnly.slice(-6)}. High-tech export permit active.`,
      },
      {
        stage: 'Handover to Line-Haul Carrier',
        location: `${defaultCarrier} Logistics Hub`,
        timestamp: new Date(new Date(order.createdAt).getTime() + 3600000 * 7).toISOString(),
        completed: order.orderStatus === 'PROCESSING' || order.orderStatus === 'SHIPPED' || order.orderStatus === 'DELIVERED',
        notes: `Consignment sealed with tamper-evident security barcode.`,
      },
      {
        stage: 'Transit to Regional Destination Hub',
        location: destHub,
        timestamp: new Date(new Date(order.createdAt).getTime() + 3600000 * 14).toISOString(),
        completed: order.orderStatus === 'SHIPPED' || order.orderStatus === 'DELIVERED',
        notes: `Arrival scan completed. Sorting for local dispatch.`,
      },
      {
        stage: 'Final Mile Delivery to Consignee',
        location: `${city}, ${country}`,
        timestamp: new Date(new Date(order.createdAt).getTime() + 3600000 * 24).toISOString(),
        completed: order.orderStatus === 'DELIVERED',
        notes: `Proof of Delivery (POD) signature required upon hand-off.`,
      },
    ],
    notes: existing.notes || 'High-value enterprise technology hardware. Handle with ESD precautions.',
  };
}
