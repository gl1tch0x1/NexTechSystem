import assert from 'node:assert/strict';
import { test } from 'node:test';
import ExcelJS from 'exceljs';
import { excelImportService } from './excel-import.service.js';
import { categoryRepository } from '../repositories/category.repository.js';
import { brandRepository } from '../repositories/brand.repository.js';
import { productRepository } from '../repositories/product.repository.js';
import { importRepository } from '../repositories/import.repository.js';

test('downloaded reseller template can be previewed without losing rows', async () => {
  const originals = {
    categories: categoryRepository.find,
    brands: brandRepository.find,
    products: productRepository.find,
    create: importRepository.create,
  };
  let savedReport: unknown;
  categoryRepository.find = async () => [];
  brandRepository.find = async () => [];
  productRepository.find = async () => [];
  importRepository.create = async (report) => {
    savedReport = report;
    return report;
  };
  try {
    const template = await excelImportService.generateSampleTemplateBuffer();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(template as unknown as Parameters<typeof workbook.xlsx.load>[0]);
    assert.equal(workbook.worksheets[0].getRow(1).getCell(1).text, 'Product Name');
    const preview = await excelImportService.parseAndValidateBuffer(template, 'test-reseller', 'test', 'products.xlsx');
    assert.equal(preview.totalRows, 2);
    assert.equal(preview.validRowsCount, 2);
    assert.equal(preview.rows[0].rowNumber, 2);
    assert.ok(savedReport);
    await assert.rejects(
      excelImportService.parseAndValidateBuffer(template, 'test-reseller', 'test', 'products.xls'),
      /Only .xlsx and .csv/,
    );
  } finally {
    categoryRepository.find = originals.categories;
    brandRepository.find = originals.brands;
    productRepository.find = originals.products;
    importRepository.create = originals.create;
  }
});
