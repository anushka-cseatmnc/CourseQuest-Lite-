const request = require('supertest');
const app = require('./server');

// Test 1: GET /api/courses
console.log('Testing GET /api/courses...');
request(app)
  .get('/api/courses?page=1&limit=10')
  .expect(200)
  .then(response => {
    console.log('✓ GET /api/courses works');
    console.log('  - Found', response.body.total, 'courses');
    console.log('  - Returned', response.body.results.length, 'results');
  })
  .catch(err => console.log('✗ GET /api/courses failed:', err.message));

// Test 2: GET /api/compare
console.log('\nTesting GET /api/compare...');
request(app)
  .get('/api/compare?ids=1,2')
  .expect(200)
  .then(response => {
    console.log('✓ GET /api/compare works');
    console.log('  - Returned', response.body.length, 'courses for comparison');
  })
  .catch(err => console.log('✗ GET /api/compare failed:', err.message));

// Test 3: POST /api/ask
console.log('\nTesting POST /api/ask...');
request(app)
  .post('/api/ask')
  .send({ question: 'online PG courses under 50000' })
  .expect(200)
  .then(response => {
    console.log('✓ POST /api/ask works');
    console.log('  - Parsed filters:', JSON.stringify(response.body.parsedFilters));
    console.log('  - Found', response.body.courses.length, 'matching courses');
  })
  .catch(err => console.log('✗ POST /api/ask failed:', err.message));

// Test 4: POST /api/ingest without token (should fail)
console.log('\nTesting POST /api/ingest security...');
request(app)
  .post('/api/ingest')
  .expect(401)
  .then(response => {
    console.log('✓ POST /api/ingest correctly rejects unauthorized requests');
  })
  .catch(err => console.log('✗ POST /api/ingest security test failed:', err.message));

console.log('\n--- Tests completed ---');
