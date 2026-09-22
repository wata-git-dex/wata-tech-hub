import test from 'node:test';
import assert from 'node:assert/strict';
import { countryResults, normalizeRichProfile, richProfilePatch } from '../vendor/shared-profile/1.2.0/wata-profile-rich.js';
import { normalizeBootstrap } from '../data-adapter.js';
test('canonical name survives bootstrap and profile editing',()=>{
  const data=normalizeBootstrap({user:{id:'member'},profile:{name:'Cyrus',country:'United States'}});
  assert.equal(data.profile.name,'Cyrus');
  assert.equal(data.profile.display_name,'Cyrus');
});
test('countries can be browsed through Zimbabwe and searched beyond the first ten',()=>{
  assert.ok(countryResults().length>190);
  assert.equal(countryResults('Vietnam')[0].code,'VN');
  assert.equal(countryResults('Slovakia')[0].code,'SK');
  assert.equal(countryResults().at(-1).code,'ZW');
  assert.equal(countryResults('not a country').length,0);
});
test('rich edits preserve travel, goals, privacy, and photo alongside base profile',()=>{
  const p=normalizeRichProfile({name:'Member',countries_visited:['VN','MM'],goals:[{kind:'travel',text:'Visit friends',completed:false}],humanitarian_interests:['Clean water'],skills:['Teaching'],interests:['Music']});
  const patch=richProfilePatch({name:'Member',country:'Vietnam',about:'Hello',suite_theme:'light',suite_accent:'cyan',suite_language:'en'},p,'https://example.org/avatar.png');
  assert.deepEqual(patch.countries_visited,['VN','MM']);
  assert.equal(patch.goals[0].text,'Visit friends');
  assert.equal(patch.show_email,false);
  assert.equal(patch.about,'Hello');
  assert.equal(patch.avatar_url,'https://example.org/avatar.png');
});
