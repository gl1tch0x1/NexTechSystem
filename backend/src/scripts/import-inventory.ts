import { inventoryImportService } from '../services/inventory-import.service.js';

async function run() {
  console.log('====================================================');
  console.log('🔄 NexTech Systems | Database Inventory Importer');
  console.log('====================================================\n');

  const args = process.argv.slice(2);
  const forceUpdate = args.includes('--force');
  const noPricing = args.includes('--no-pricing');
  const pathArg = args.find(a => a.startsWith('--path='));
  const customPath = pathArg ? pathArg.split('=')[1] : undefined;

  try {
    const result = await inventoryImportService.importFromExcel({
      filePath: customPath,
      forceUpdate,
      assignPricing: !noPricing,
    });

    console.log('\n====================================================');
    console.log('✅ Inventory Import to Database Complete!');
    console.log('====================================================');
    const sanitizedExcelPath = String(result.excelPath).replace(/\n|\r/g, '');
    console.log(`📁 Source:              ${sanitizedExcelPath}`);
    console.log(`📦 Total Items Parsed:  ${result.totalParsed}`);
    console.log(`🆕 Products Created:    ${result.productsCreated}`);
    console.log(`🔁 Products Updated:    ${result.productsUpdated}`);
    console.log(`⏭️  Products Skipped:    ${result.skipped}`);
    console.log(`🏷️  Categories Created:  ${result.categoriesCreated}`);
    console.log(`🏢 Brands Created:      ${result.brandsCreated}`);
    console.log(`💾 Total Products in DB:${result.totalProductsInDb}`);
    console.log('====================================================\n');
    process.exit(0);
  } catch (err: any) {
    const safeError = String(err?.message || err).replace(/\n|\r/g, '');
    console.error('\n❌ [Inventory Import Error]: %s', safeError);
    process.exit(1);
  }
}

run();
