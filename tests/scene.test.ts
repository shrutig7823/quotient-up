import assert from 'node:assert/strict';
import { test } from 'node:test';

import { dist, sample, smooth, winding, type Pt } from '../src/scene/path';

const route: Pt[] = [[200, 1400], [120, 1280], [260, 1160], [150, 1040]];

test('trail passes exactly through every stop', () => {
  const samples = sample(smooth(winding(route, 30)), 10);
  for (const [x, y] of route) {
    const nearest = Math.min(...samples.map((p) => dist(p, { x, y })));
    assert.ok(nearest < 0.001, `stop ${x},${y} is ${nearest} from the trail`);
  }
});

test('trail starts and ends at the first and last stop', () => {
  const samples = sample(smooth(winding(route, 30)), 10);
  assert.deepEqual([samples[0].x, samples[0].y], route[0]);
  const last = samples[samples.length - 1];
  assert.deepEqual([last.x, last.y], route[route.length - 1]);
});

test('winding adds one detour point between each pair of stops', () => {
  assert.equal(winding(route, 30).length, route.length * 2 - 1);
});
