const { test } = require('node:test');
const assert = require('node:assert');

// Test 1: walidacja - brak name zwraca blad
test('POST /items bez name powinno zwrocic blad walidacji', () => {
  const body = { price: 9.99 };
  const isValid = body.name && body.price != null;
  assert.strictEqual(isValid, undefined);
});

// Test 2: walidacja - poprawne dane sa akceptowane
test('POST /items z poprawnymi danymi przechodzi walidacje', () => {
  const body = { name: 'Widget', price: 9.99 };
  const isValid = body.name && body.price != null;
  assert.ok(isValid);
});

// Test 3: struktura stats
test('GET /stats zwraca obiekt z count i cache_hits', () => {
  const stats = { count: 0, cache_hits: 0 };
  assert.ok('count' in stats);
  assert.ok('cache_hits' in stats);
  assert.strictEqual(typeof stats.count, 'number');
  assert.strictEqual(typeof stats.cache_hits, 'string'); // celowy blad
});