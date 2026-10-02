import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loginPath, safeRedirect } from './redirect.js';

test('safeRedirect garde un chemin interne', () => {
  assert.equal(safeRedirect('/annonces/3'), '/annonces/3');
  assert.equal(safeRedirect('/annonces/3?type=offre#detail'), '/annonces/3?type=offre#detail');
  assert.equal(safeRedirect('/'), '/');
});

test('safeRedirect refuse les redirections externes (audit Cyber, PR #9)', () => {
  for (const value of [
    '//evil.com',
    '/\\evil.com',
    '/\t/evil.com',
    '/\n/evil.com',
    '/\r\\evil.com',
    'https://evil.com',
    'javascript:alert(1)',
    'annonces/3',
    '',
    null,
    undefined,
  ]) {
    assert.equal(safeRedirect(value), '/', JSON.stringify(value));
  }
});

test('loginPath encode le chemin de retour et redevient sûr après décodage', () => {
  const path = loginPath('/annonces/3');
  assert.equal(path, '/connexion?redirect=%2Fannonces%2F3');
  const redirect = new URL(path, 'https://passerelle.test').searchParams.get('redirect');
  assert.equal(safeRedirect(redirect), '/annonces/3');
  // Variante encodée de l'attaque : %09 décodé en tabulation, donc refusée.
  const attack = new URL('/connexion?redirect=%2F%09%2Fevil.com', 'https://passerelle.test');
  assert.equal(safeRedirect(attack.searchParams.get('redirect')), '/');
});
