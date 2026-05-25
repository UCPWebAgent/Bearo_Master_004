class AudioProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.bufferSize = 2048; // Reduced from 4096 for lower latency (approx 128ms at 16kHz)
    this.buffer = new Int16Array(this.bufferSize);
    this.bufferIndex = 0;
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    if (input.length > 0) {
      const inputData = input[0];
      for (let i = 0; i < inputData.length; i++) {
        // Convert Float32 to Int16
        const sample = Math.max(-1, Math.min(1, inputData[i]));
        this.buffer[this.bufferIndex++] = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;

        if (this.bufferIndex >= this.bufferSize) {
          // Send the buffer to the main thread
          this.port.postMessage(this.buffer);
          this.bufferIndex = 0;
        }
      }
    }
    return true;
  }
}

registerProcessor('audio-processor', AudioProcessor);
