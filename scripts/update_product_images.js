const fs = require('fs');
const path = require('path');

function resolveProductImage(p) {
  const existing = p.primaryImage || p.thumbnail || (p.images && p.images[0]);
  if (existing && typeof existing === 'string' && existing.trim() && 
      !existing.includes('DEFAULT_PRODUCT_PLACEHOLDER') && 
      !existing.includes('data:image/svg') &&
      !existing.includes('CHOSEN_COVER_ASSET') &&
      !existing.includes('AUTHENTIC_HP_OMEN_14_TRANSCEND') &&
      !existing.includes('TEST_VECTOR_IMAGE')) {
    return existing.trim();
  }

  const name = (p.name || p.title || '').toLowerCase();
  const cat = (p.categoryName || '').toLowerCase();
  const brand = (p.brandName || '').toLowerCase();

  // 1. Processors (CPUs)
  if (name.includes('14900k') || name.includes('13900k') || name.includes('11900k') || (cat.includes('processor') && brand.includes('intel'))) {
    return '/images/intel_i9_14900k.jpg';
  }
  if (name.includes('ryzen') || (cat.includes('processor') && brand.includes('amd'))) {
    return '/images/amd_ryzen_7950x.jpg';
  }

  // 2. Dedicated GPUs & Graphics Cards
  if (name.includes('rtx') || name.includes('geforce') || cat.includes('graphic') || cat.includes('gpu')) {
    return '/images/hero_rtx4090.webp';
  }

  // 3. Motherboards
  if (name.includes('motherboard') || name.includes('z790') || cat.includes('motherboard')) {
    return '/products/asus-dark-hero.webp';
  }

  // 4. Power Supplies
  if (name.includes('power supply') || name.includes('seasonic') || cat.includes('power supply') || cat.includes('psu')) {
    return '/products/seasonic-tx1600.webp';
  }

  // 5. Enterprise Servers & Rackmount
  if (name.includes('poweredge') || name.includes('rackmount') || name.includes('server r760') || cat.includes('server')) {
    return '/products/dell-r760.webp';
  }

  // 6. UPS & Power Backups
  if (name.includes('ups') || name.includes('apc') || cat.includes('ups')) {
    return '/images/products/apc-ups.webp';
  }

  // 7. Networking & Switches
  if (name.includes('switch') || name.includes('sg350') || name.includes('cisco') || name.includes('mikrotik') || cat.includes('network')) {
    return '/images/products/network-switch.webp';
  }

  // 8. Gaming Laptops (specific by brand)
  if (cat.includes('gaming laptop') || name.includes('alienware') || name.includes('legion') || name.includes('rog') || name.includes('predator') || name.includes('vector') || name.includes('katana') || name.includes('omen')) {
    if (name.includes('alienware') || brand.includes('alienware')) return '/images/products/alienware-laptop.webp';
    if (name.includes('rog') || name.includes('strix') || brand.includes('asus')) return '/images/products/asus-rog-laptop.webp';
    if (name.includes('legion') || brand.includes('lenovo')) return '/images/products/gaming-laptop.webp';
    if (name.includes('msi') || brand.includes('msi')) return '/images/products/msi-gaming.webp';
    if (name.includes('omen') || brand.includes('hp')) return '/images/products/gaming-laptop.webp';
    return '/images/products/gaming-laptop.webp';
  }

  // 9. Laptops & Ultrabooks (specific by brand/model)
  if (cat.includes('laptop') || name.includes('laptop') || name.includes('notebook') || name.includes('book')) {
    if (name.includes('macbook') || brand.includes('apple')) return '/images/products/macbook-pro.webp';
    if (name.includes('thinkpad') || (brand.includes('lenovo') && name.includes('think'))) return '/images/products/thinkpad.webp';
    if (name.includes('surface') || brand.includes('microsoft')) return '/images/products/surface-laptop.webp';
    if (name.includes('xps') || name.includes('latitude') || name.includes('inspiron') || brand.includes('dell')) return '/images/products/dell-xps.webp';
    if (name.includes('zenbook') || name.includes('expertbook') || name.includes('vivobook') || brand.includes('asus')) return '/images/products/asus-zenbook.webp';
    if (name.includes('probook') || name.includes('elitebook') || name.includes('envy') || name.includes('pavilion') || brand.includes('hp')) return '/images/products/hp-probook.webp';
    if (name.includes('aspire') || brand.includes('acer')) return '/images/products/acer-laptop.webp';
    return '/images/products/hp-probook.webp';
  }

  // 10. Desktops & All-in-Ones
  if (name.includes('all in one') || name.includes('aio') || cat.includes('all-in-one')) {
    return '/images/products/all-in-one-pc.webp';
  }
  if (cat.includes('desktop') || name.includes('desktop') || name.includes('tower')) {
    return '/images/products/desktop-tower.webp';
  }

  // 11. Storage: NVMe SSDs vs. 3.5" Enterprise HDDs vs. 2.5" SATA SSDs
  if (cat.includes('storage') || name.includes('ssd') || name.includes('hdd') || name.includes('drive')) {
    if (name.includes('nvme') || name.includes('990') || name.includes('m.2') || name.includes('sn850') || name.includes('p3')) {
      return '/images/samsung_990_pro.jpg';
    }
    if (name.includes('hdd') || name.includes('hard drive') || name.includes('ironwolf') || name.includes('barracuda') || name.includes('wd blue') || name.includes('3.5')) {
      return '/images/products/hdd-enterprise.webp';
    }
    return '/images/products/ssd-sata.webp';
  }

  // 12. RAM Memory Modules & Components
  if (cat.includes('component') || name.includes('ram') || name.includes('ddr4') || name.includes('ddr5') || name.includes('memory') || brand.includes('crucial')) {
    return '/images/products/ram-module.webp';
  }

  // 13. Monitors & Displays
  if (cat.includes('monitor') || cat.includes('display') || name.includes('monitor')) {
    if (name.includes('gaming') || name.includes('curved') || name.includes('g600')) {
      return '/images/products/monitor-gaming.webp';
    }
    return '/images/products/monitor-ultrawide.webp';
  }

  // 14. Peripherals: Mice & Keyboards
  if (name.includes('mouse') || name.includes('basilisk') || name.includes('mx') || name.includes('cestus')) {
    if (name.includes('gaming') || name.includes('razer') || name.includes('cestus')) {
      return '/images/products/mouse-gaming.webp';
    }
    return '/images/products/mouse-ergonomic.webp';
  }
  if (name.includes('keyboard') || name.includes('adesso') || name.includes('keypad')) {
    return '/images/products/keyboard-mechanical.webp';
  }

  // 15. Audio & Headsets
  if (cat.includes('audio') || cat.includes('headset') || name.includes('headphone') || name.includes('wh-1000') || name.includes('tune 770') || name.includes('sound')) {
    return '/images/products/headphones-anc.webp';
  }

  // 16. Bags, Sleeves & Cases
  if (cat.includes('bag') || cat.includes('case') || name.includes('backpack') || name.includes('tucano') || name.includes('sleeve')) {
    return '/images/products/laptop-backpack.webp';
  }

  // 17. Docks, Hubs & Accessories
  if (cat.includes('accessor') || name.includes('dock') || name.includes('hub') || name.includes('adapter') || name.includes('cable')) {
    return '/images/products/usb-c-dock.webp';
  }

  return '/images/products/hp-probook.webp';
}

function processFile(filePath) {
  const fullPath = path.resolve(filePath);
  const data = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
  let updatedCount = 0;
  data.forEach(p => {
    const resolved = resolveProductImage(p);
    p.primaryImage = resolved;
    p.thumbnail = resolved;
    p.image = resolved;
    if (!Array.isArray(p.images) || p.images.length === 0 || !p.images[0]) {
      p.images = [resolved];
    } else {
      p.images[0] = resolved;
    }
    updatedCount++;
  });
  fs.writeFileSync(fullPath, JSON.stringify(data, null, 2) + '\n', 'utf8');
  console.log('Successfully updated', updatedCount, 'products in', fullPath);
}

processFile('./backend/data_store/products.json');
processFile('./frontend/data/products.json');
