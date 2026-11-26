import assert from 'node:assert/strict';
import test from 'node:test';
import { localTutorReply } from './tutor.js';

test('guides a profit calculation without revealing the result early', () => {
  let step = localTutorReply('Modal Rp20.000, harga jual Rp25.000. Berapa untung?');
  assert.equal(step.state.phase, 'bandingkan');
  assert.match(step.reply, /mana yang lebih besar/i);
  assert.doesNotMatch(step.reply, /Rp5\.000/);

  step = localTutorReply('Harga jual lebih besar', step.state);
  assert.equal(step.state.phase, 'rumus');

  step = localTutorReply('Harga jual dikurangi harga beli', step.state);
  assert.equal(step.state.phase, 'hitung');
  assert.match(step.reply, /Rp25\.000 − Rp20\.000/);
  assert.doesNotMatch(step.reply, /Rp5\.000/);

  step = localTutorReply('5.000', step.state);
  assert.equal(step.state.phase, 'bukti');
  assert.match(step.reply, /Rp5\.000/);
});

test('wrong arithmetic answers receive hints instead of the answer', () => {
  const first = localTutorReply('Modal Rp20.000, harga jual Rp25.000. Berapa untung?');
  const formula = localTutorReply('Harga jual lebih besar', first.state);
  const calculation = localTutorReply('Harga jual dikurangi harga beli', formula.state);
  const wrongAnswer = localTutorReply('3.000', calculation.state);

  assert.equal(wrongAnswer.state.phase, 'hitung');
  assert.equal(wrongAnswer.state.hint_level, 1);
  assert.doesNotMatch(wrongAnswer.reply, /Rp5\.000/);
});

test('guides percentage questions in separate RMT stages', () => {
  let step = localTutorReply('Modal 20.000, harga jual 25.000. Berapa persen untung?');
  step = localTutorReply('Harga jual lebih besar', step.state);
  step = localTutorReply('Harga jual dikurangi harga beli', step.state);
  step = localTutorReply('5.000', step.state);
  step = localTutorReply('Karena harga jual lebih besar daripada modal', step.state);
  assert.equal(step.state.phase, 'rumus_persen');

  step = localTutorReply('Untung dibagi harga beli lalu dikali 100', step.state);
  assert.equal(step.state.phase, 'hitung_persen');
  assert.doesNotMatch(step.reply, /25%/);

  step = localTutorReply('25%', step.state);
  assert.equal(step.state.phase, 'bukti_persen');
  assert.match(step.reply, /25%/);
});
