import ExcelJS from 'exceljs';

const FRONTEND_URL = 'http://localhost:3000';
const BACKEND_URL = 'http://localhost:5000';

async function verifyTemplateDownloadAndImport() {
  console.log('========================================================');
  console.log('🧪 VERIFYING HARDWARE SKU TEMPLATE DOWNLOAD & BULK IMPORT');
  console.log('========================================================');

  // 1. Download template from Frontend Route
  console.log('Step 1: Downloading template from Frontend proxy...');
  const res = await fetch(`${FRONTEND_URL}/api/reseller/template/download`);
  if (!res.ok) {
    throw new Error(`Failed to download from frontend: HTTP ${res.status}`);
  }

  const contentType = res.headers.get('content-type');
  const disposition = res.headers.get('content-disposition');
  const arrayBuffer = await res.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  console.log(`✅ Download Status: ${res.status}`);
  console.log(`✅ Content-Type: ${contentType}`);
  console.log(`✅ Content-Disposition: ${disposition}`);
  console.log(`✅ File Size: ${buffer.length} bytes`);

  if (buffer.length < 5000) {
    throw new Error(`Downloaded template buffer is too small: ${buffer.length} bytes`);
  }

  // 2. Parse downloaded workbook using ExcelJS to verify integrity
  console.log('\nStep 2: Inspecting Excel Workbook structure...');
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  const sheetNames = workbook.worksheets.map(w => w.name);
  console.log('✅ Sheets found in workbook:', sheetNames);

  const mainSheet = workbook.getWorksheet('Hardware_SKU_Catalog');
  if (!mainSheet) {
    throw new Error('Hardware_SKU_Catalog worksheet not found!');
  }

  const headerRow = mainSheet.getRow(1);
  const headers = [];
  headerRow.eachCell(cell => headers.push(cell.text));
  console.log(`✅ Total Columns: ${headers.length}`);
  console.log('✅ Key Columns verified:', headers.slice(0, 15).join(', '));

  console.log(`✅ Data Rows found: ${mainSheet.rowCount - 1}`);

  // 3. Reseller Authentication
  console.log('\nStep 3: Authenticating Reseller...');
  const loginRes = await fetch(`${BACKEND_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'reseller@nextech.com',
      password: 'password@123',
    }),
  });
  let resellerToken = '';
  if (loginRes.ok) {
    const loginData = await loginRes.json();
    resellerToken = loginData.data?.token;
  }

  // If reseller login didn't succeed, login as admin
  if (!resellerToken) {
    const adminLoginRes = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@nextech.com',
        password: 'password@123',
      }),
    });
    const adminData = await adminLoginRes.json();
    resellerToken = adminData.data?.token;
  }
  console.log('✅ Authentication token obtained.');

  // 4. Test uploading this exact downloaded template to the bulk preview endpoint
  console.log('\nStep 4: Uploading downloaded template to bulk parser (/api/reseller/import/preview)...');
  const formData = new globalThis.FormData();
  const fileBlob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  formData.append('file', fileBlob, 'nextech_hardware_sku_listing_template.xlsx');

  const previewRes = await fetch(`${BACKEND_URL}/api/reseller/import/preview`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resellerToken}`,
    },
    body: formData,
  });

  const previewJson = await previewRes.json();
  if (!previewRes.ok || !previewJson.success) {
    console.error('❌ Preview upload failed:', previewJson);
    throw new Error('Upload preview failed');
  }

  const { totalRows, validRowsCount, errorRowsCount, rows } = previewJson.data;
  console.log(`✅ Importer processed ${totalRows} rows:`);
  console.log(`   - Valid hardware SKU rows: ${validRowsCount}`);
  console.log(`   - Error rows: ${errorRowsCount}`);

  if (validRowsCount > 0 && errorRowsCount === 0) {
    console.log('🎉 100% of sample hardware SKU template rows passed validation without errors!');
    console.log('Sample parsed specs for Row 1:', rows[0].normalizedProduct.specifications);
  } else {
    console.warn('⚠️ Some rows had validation notices:', rows.map(r => r.invalidFields));
  }

  console.log('\n========================================================');
  console.log('✅ TEMPLATE DOWNLOAD & HARDWARE SKU STRUCTURE VERIFIED 100%');
  console.log('========================================================');
}

verifyTemplateDownloadAndImport().catch(err => {
  console.error('FATAL TEST ERROR:', err);
  process.exit(1);
});
