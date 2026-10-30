import { test } from 'node:test';
import assert from 'node:assert/strict';
import { productImageUrl } from '../lib/product-image-url';

test('preserves signed and percent-encoded product images on repeated validation', () => {
  const url = 'https://firebasestorage.googleapis.com/v0/b/shop/o/products%2Fcpu%20box.png?alt=media&token=a%2Bb%3D';
  assert.equal(productImageUrl(url), url);
  assert.equal(productImageUrl(productImageUrl(url)), url);
  assert.equal(productImageUrl(' https://cdn.example.com/cpu photo.png '), 'https://cdn.example.com/cpu%20photo.png');
  assert.equal(productImageUrl('/products/cpu%20box.webp'), '/products/cpu%20box.webp');
});
test('rejects executable, insecure and malformed image URLs without substituting a stock image', () => {
  for (const url of ['javascript:alert(1)', 'data:image/svg+xml,<svg/>', '//other.example/a.png', 'http://other.example/a.png', 'https://user:password@example.com/a.png', 'https://example.com/\\evil', 'not a url', '']) {
    assert.equal(productImageUrl(url), null, url);
  }
});
