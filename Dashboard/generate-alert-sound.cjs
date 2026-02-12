#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const sampleRate = 44100;
const duration = 0.8;
const numSamples = Math.floor(sampleRate * duration);

function createWavHeader(dataSize) {
  const buffer = Buffer.alloc(44);
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);
  return buffer;
}

function generateAlertSound() {
  const samples = [];
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    // Triple beep pattern: beep-beep-beep
    if (t < 0.1) {
      // First beep
      const envelope = Math.sin(Math.PI * t / 0.1);
      samples.push(Math.sin(2 * Math.PI * 1200 * t) * envelope * 0.4);
    } else if (t < 0.15) {
      samples.push(0);
    } else if (t < 0.25) {
      // Second beep
      const envelope = Math.sin(Math.PI * (t - 0.15) / 0.1);
      samples.push(Math.sin(2 * Math.PI * 1200 * t) * envelope * 0.4);
    } else if (t < 0.3) {
      samples.push(0);
    } else if (t < 0.4) {
      // Third beep
      const envelope = Math.sin(Math.PI * (t - 0.3) / 0.1);
      samples.push(Math.sin(2 * Math.PI * 1200 * t) * envelope * 0.4);
    } else {
      samples.push(0);
    }
  }
  return samples;
}

function samplesToBuffer(samples) {
  const buffer = Buffer.alloc(samples.length * 2);
  for (let i = 0; i < samples.length; i++) {
    const value = Math.floor(Math.max(-1, Math.min(1, samples[i])) * 32767);
    buffer.writeInt16LE(value, i * 2);
  }
  return buffer;
}

const samples = generateAlertSound();
const dataBuffer = samplesToBuffer(samples);
const header = createWavHeader(dataBuffer.length);
const wavFile = Buffer.concat([header, dataBuffer]);
const outputPath = path.join(__dirname, 'public', 'sounds', 'soc-alert.wav');
fs.writeFileSync(outputPath, wavFile);
console.log('✓ SOC alert sound generated:', outputPath);
