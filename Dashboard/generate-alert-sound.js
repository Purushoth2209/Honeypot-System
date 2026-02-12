#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Generate a professional dual-tone alert sound using Web Audio API data
// This creates a WAV file with a short, sharp dual-beep alert

const sampleRate = 44100;
const duration = 0.8; // 800ms
const numSamples = Math.floor(sampleRate * duration);

// Create WAV header
function createWavHeader(dataSize) {
  const buffer = Buffer.alloc(44);
  
  // RIFF header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  
  // fmt chunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // chunk size
  buffer.writeUInt16LE(1, 20); // audio format (PCM)
  buffer.writeUInt16LE(1, 22); // num channels (mono)
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28); // byte rate
  buffer.writeUInt16LE(2, 32); // block align
  buffer.writeUInt16LE(16, 34); // bits per sample
  
  // data chunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);
  
  return buffer;
}

// Generate dual-tone alert (800Hz + 1000Hz)
function generateAlertSound() {
  const samples = [];
  
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    
    // First beep (0-0.15s)
    if (t < 0.15) {
      const freq = 800;
      const envelope = Math.sin(Math.PI * t / 0.15);
      samples.push(Math.sin(2 * Math.PI * freq * t) * envelope * 0.3);
    }
    // Silence (0.15-0.25s)
    else if (t < 0.25) {
      samples.push(0);
    }
    // Second beep (0.25-0.4s)
    else if (t < 0.4) {
      const freq = 1000;
      const envelope = Math.sin(Math.PI * (t - 0.25) / 0.15);
      samples.push(Math.sin(2 * Math.PI * freq * t) * envelope * 0.3);
    }
    // Fade out
    else {
      samples.push(0);
    }
  }
  
  return samples;
}

// Convert samples to 16-bit PCM
function samplesToBuffer(samples) {
  const buffer = Buffer.alloc(samples.length * 2);
  
  for (let i = 0; i < samples.length; i++) {
    const sample = Math.max(-1, Math.min(1, samples[i]));
    const value = Math.floor(sample * 32767);
    buffer.writeInt16LE(value, i * 2);
  }
  
  return buffer;
}

// Generate and save the alert sound
const samples = generateAlertSound();
const dataBuffer = samplesToBuffer(samples);
const header = createWavHeader(dataBuffer.length);
const wavFile = Buffer.concat([header, dataBuffer]);

const outputPath = path.join(__dirname, 'public', 'sounds', 'soc-alert.wav');
fs.writeFileSync(outputPath, wavFile);

console.log('✓ Professional SOC alert sound generated:', outputPath);
console.log('  Duration: 800ms');
console.log('  Type: Dual-tone beep (800Hz + 1000Hz)');
