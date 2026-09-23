import test from 'node:test';
import assert from 'node:assert/strict';
import { cropBounds } from '../vendor/shared-profile/1.2.1/profile-photo.js';
test('photo crop centers landscape and portrait images',()=>{
  assert.deepEqual(cropBounds(1200,800),{sx:200,sy:0,size:800});
  assert.deepEqual(cropBounds(800,1200),{sx:0,sy:200,size:800});
});
test('photo zoom and positioning stay inside the source image',()=>{
  assert.deepEqual(cropBounds(1200,800,2,1,0),{sx:800,sy:0,size:400});
  assert.deepEqual(cropBounds(800,800,4,-1,2),{sx:0,sy:600,size:200});
});
