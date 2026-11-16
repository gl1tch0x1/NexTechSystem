import { test } from 'node:test';
import assert from 'node:assert/strict';
import { inventoryImportService } from '../src/services/inventory-import.service.js';
import { adminController } from '../src/controllers/admin.controller.js';

test('inventory importer CWE-022 path traversal defense', async (t) => {
  await t.test('resolves default safe inventory file successfully', () => {
    const resolved = inventoryImportService.resolveExcelPath();
    assert.ok(resolved.endsWith('.xls') || resolved.endsWith('.xlsx'));
  });

  await t.test('resolves valid inventory filename within safe directory', () => {
    const resolved = inventoryImportService.resolveExcelPath('ComNet_Inventory.xls');
    assert.ok(resolved.endsWith('ComNet_Inventory.xls'));
  });

  await t.test('rejects path traversal attempt with unauthorized extension', () => {
    assert.throws(
      () => inventoryImportService.resolveExcelPath('../../../../windows/system32/cmd.exe'),
      /Invalid file extension/i
    );
  });

  await t.test('rejects path traversal attempting to reach outside safe directory', () => {
    assert.throws(
      () => inventoryImportService.resolveExcelPath('../../../../nonexistent.xlsx'),
      /not found in safe directory/i
    );
  });

  await t.test('adminController.importInventory returns 400 for directory traversal payload', async () => {
    let statusCode: number | null = null;
    let responseBody: any = null;

    const mockReq: any = {
      body: { filePath: '../../etc/shadow.xls' },
      user: { id: 'admin_1', email: 'admin@nextech.ae', role: 'ADMIN' },
    };

    const mockRes: any = {
      status(code: number) {
        statusCode = code;
        return this;
      },
      json(body: any) {
        responseBody = body;
        return this;
      },
    };

    await adminController.importInventory(mockReq, mockRes);
    assert.equal(statusCode, 400);
    assert.equal(responseBody.error.code, 'INVALID_PATH');
  });

  await t.test('adminController.importInventory returns 400 for forbidden file extension', async () => {
    let statusCode: number | null = null;
    let responseBody: any = null;

    const mockReq: any = {
      body: { filePath: 'payload.exe' },
      user: { id: 'admin_1', email: 'admin@nextech.ae', role: 'ADMIN' },
    };

    const mockRes: any = {
      status(code: number) {
        statusCode = code;
        return this;
      },
      json(body: any) {
        responseBody = body;
        return this;
      },
    };

    await adminController.importInventory(mockReq, mockRes);
    assert.equal(statusCode, 400);
    assert.equal(responseBody.error.code, 'INVALID_FILE_TYPE');
  });

  await t.test('strips newline and carriage return characters to prevent CWE-117 log injection', () => {
    // If a valid filename contains CRLF sequences, resolveExcelPath sanitizes them without crashing or forging lines
    const resolved = inventoryImportService.resolveExcelPath('ComNet_Inventory.xls\r\n');
    assert.ok(resolved.endsWith('ComNet_Inventory.xls'));
    assert.ok(!resolved.includes('\r') && !resolved.includes('\n'));
  });
});
