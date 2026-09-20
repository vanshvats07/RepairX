import test from 'node:test';
import assert from 'node:assert/strict';
import { buildPilotMetricSummary, buildV1ReadinessReport, summarizePatterns } from '../src/services/productLearningService.js';

test('pilot metrics include sample sizes and definitions without inventing data', () => {
  const summary = buildPilotMetricSummary({
    requestsCreated: 12,
    completedRepairs: 8,
    quotesCreated: 10,
    quotesApproved: 6,
    quotesRejected: 2,
    qualityChecksPassed: 7,
  });

  assert.equal(summary.metrics.requestsCreated.value, 12);
  assert.equal(summary.metrics.completedRepairs.value, 8);
  assert.equal(summary.metrics.quotesApproved.n, 6);
  assert.equal(summary.metrics.qualityChecksPassed.definition.includes('Quality checks'), true);
});

test('product learning patterns keep evidence and status without fabricating a score', () => {
  const patterns = summarizePatterns([
    { category: 'AI', observation: 'AI underperformed on ambiguous evidence.', sourceCaseIds: ['RX-1', 'RX-2'], status: 'OBSERVED', evidence: ['case 1', 'case 2'] },
    { category: 'WORKSHOP', observation: 'Workshop acceptance delay', sourceCaseIds: ['RX-3'], status: 'INVESTIGATING', evidence: ['case 3'] },
  ]);

  assert.equal(patterns.length, 2);
  assert.equal(patterns[0].category, 'AI');
  assert.equal(patterns[0].count, 2);
  assert.equal(patterns[1].status, 'INVESTIGATING');
});

test('readiness report uses evidence-based dimension statuses', () => {
  const readiness = buildV1ReadinessReport({
    hasCustomerFlow: true,
    hasWorkshopFlow: true,
    hasTechnicianFlow: true,
    hasDeviceIntelligence: false,
    hasRepairDna: false,
    hasAi: true,
  });

  assert.equal(readiness.dimensions.CUSTOMER_EXPERIENCE, 'READY');
  assert.equal(readiness.dimensions.DEVICE_INTELLIGENCE, 'INSUFFICIENT_DATA');
  assert.equal(readiness.summary.includes('single composite score'), true);
});
