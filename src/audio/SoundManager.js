// ─────────────────────────────────────────────────────────────
// SoundManager.js — Gerenciador de Áudio Brasileiro
// 
// Gera áudio procedural com Web Audio API
// Estilos: Choro, Samba, Bossa Nova, MPB ambiente
// Efeitos sonoros culturalmente brasileiros
// ─────────────────────────────────────────────────────────────

export default class SoundManager {
    constructor(scene) {
        this.scene = scene;
        this.ctx = null;
        this.musicEnabled = true;
        this.sfxEnabled = true;
        this.currentMusic = null;
        this.masterGain = null;
        
        // Instrumentos brasileiros
        this.instruments = {
            violao: { type: 'triangle', attack: 0.02, decay: 0.3, sustain: 0.1, release: 0.5 },
            cavaquinho: { type: 'square', attack: 0.01, decay: 0.15, sustain: 0.05, release: 0.2 },
            tamborim: { type: 'sine', attack: 0.001, decay: 0.1, sustain: 0, release: 0.1 },
            pandeiro: { type: 'noise', attack: 0.001, decay: 0.2, sustain: 0, release: 0.15 },
            agogo: { type: 'square', attack: 0.001, decay: 0.3, sustain: 0, release: 0.2 },
            recoReco: { type: 'sawtooth', attack: 0.001, decay: 0.05, sustain: 0, release: 0.05 },
            flute: { type: 'sine', attack: 0.05, decay: 0.2, sustain: 0.3, release: 0.3 }
        };
        
        // Escalas brasileiras (Modos gregos e escalas nordestinas)
        this.scales = {
            maior: [0, 2, 4, 5, 7, 9, 11],
            menor: [0, 2, 3, 5, 7, 8, 10],
            dorico: [0, 2, 3, 5, 7, 9, 10],  // comum no forró
            mixolidio: [0, 2, 4, 5, 7, 9, 10],  // blues/MPB
            frevo: [0, 1, 3, 5, 7, 8, 10]  // escala diminuta
        };
        
        this.initAudio();
    }
    
    initAudio() {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.value = 0.3;
            this.masterGain.connect(this.ctx.destination);
        } catch (e) {
            console.warn('Web Audio API não suportada:', e);
        }
    }
    
    resumeAudio() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }
    
    // ════════════════════════════════════════
    // MÚSICAS TEMA (por cena/fase)
    // ════════════════════════════════════════
    
    playMenuMusic() {
        // Tema do menu: Choro suave (Pixinga-style)
        this.stopMusic();
        if (!this.musicEnabled || !this.ctx) return;
        
        this.currentMusic = {
            type: 'choro',
            key: 'A',
            scale: this.scales.menor,
            tempo: 90,
            pattern: this.generateChoroPattern()
        };
        
        this.loopMusic(4000);
    }
    
    playHubMusic() {
        // Tema do Hub: Bossa Nova ambiente (Tom Jobim style)
        this.stopMusic();
        if (!this.musicEnabled || !this.ctx) return;
        
        this.currentMusic = {
            type: 'bossa',
            key: 'C',
            scale: this.scales.maior,
            tempo: 70,
            pattern: this.generateBossaPattern()
        };
        
        this.loopMusic(6000);
    }
    
    playVilaRicaMusic() {
        // Tema colonial: Moda de viola caipira
        this.stopMusic();
        if (!this.musicEnabled || !this.ctx) return;
        
        this.currentMusic = {
            type: 'caipira',
            key: 'G',
            scale: this.scales.maior,
            tempo: 80,
            pattern: this.generateCaipiraPattern()
        };
        
        this.loopMusic(5000);
    }
    
    playRioMusic() {
        // Tema Rio: Samba-choro (anos 1880-1904)
        this.stopMusic();
        if (!this.musicEnabled || !this.ctx) return;
        
        this.currentMusic = {
            type: 'samba',
            key: 'D',
            scale: this.scales.maior,
            tempo: 100,
            pattern: this.generateSambaPattern()
        };
        
        this.loopMusic(4500);
    }
    
    playSaoPauloMusic() {
        // Tema SP: Industrial/operário (som mais tenso)
        this.stopMusic();
        if (!this.musicEnabled || !this.ctx) return;
        
        this.currentMusic = {
            type: 'tense',
            key: 'E',
            scale: this.scales.menor,
            tempo: 60,
            pattern: this.generateTensePattern()
        };
        
        this.loopMusic(7000);
    }
    
    playEpilogueMusic() {
        // Tema final: Esperança/renovação
        this.stopMusic();
        if (!this.musicEnabled || !this.ctx) return;
        
        this.currentMusic = {
            type: 'hopeful',
            key: 'F',
            scale: this.scales.maior,
            tempo: 75,
            pattern: this.generateHopefulPattern()
        };
        
        this.loopMusic(6000);
    }
    
    loopMusic(interval) {
        if (!this.currentMusic) return;
        
        this.playMusicPattern();
        
        this.musicInterval = setInterval(() => {
            if (this.currentMusic) {
                this.playMusicPattern();
            }
        }, interval);
    }
    
    stopMusic() {
        if (this.musicInterval) {
            clearInterval(this.musicInterval);
            this.musicInterval = null;
        }
        this.currentMusic = null;
    }
    
    // ════════════════════════════════════════
    // PADRÕES MUSICAIS BRASILEIROS
    // ════════════════════════════════════════
    
    generateChoroPattern() {
        // Padrão de choro: violão + cavaquinho + flauta
        return () => {
            const now = this.ctx.currentTime;
            const baseFreq = this.getFrequency('A', 3);
            
            // Violão: arpejos em Lá menor
            this.playNote(baseFreq * 1, 'violao', now, 0.3);
            this.playNote(baseFreq * 1.2, 'violao', now + 0.15, 0.3);
            this.playNote(baseFreq * 1.5, 'violao', now + 0.3, 0.3);
            this.playNote(baseFreq * 1.2, 'violao', now + 0.45, 0.3);
            
            // Cavaquinho: contracanto
            this.playNote(baseFreq * 1.5, 'cavaquinho', now + 0.2, 0.15);
            this.playNote(baseFreq * 2, 'cavaquinho', now + 0.5, 0.15);
            
            // Pandeiro: ritmo suave
            this.playPercussion('pandeiro', now, 0.1);
            this.playPercussion('pandeiro', now + 0.25, 0.1);
            this.playPercussion('pandeiro', now + 0.5, 0.1);
            this.playPercussion('pandeiro', now + 0.75, 0.1);
        };
    }
    
    generateBossaPattern() {
        // Padrão de bossa nova
        return () => {
            const now = this.ctx.currentTime;
            const baseFreq = this.getFrequency('C', 3);
            
            // Violão: padrão bossa (baixo + acorde)
            this.playNote(baseFreq, 'violao', now, 0.4);
            this.playNote(baseFreq * 1.25, 'violao', now + 0.2, 0.3);
            this.playNote(baseFreq * 1.5, 'violao', now + 0.4, 0.3);
            this.playNote(baseFreq * 2, 'violao', now + 0.6, 0.3);
            
            // Pandeiro: suave
            this.playPercussion('pandeiro', now, 0.08);
            this.playPercussion('pandeiro', now + 0.33, 0.08);
            this.playPercussion('pandeiro', now + 0.66, 0.08);
        };
    }
    
    generateCaipiraPattern() {
        // Viola caipira
        return () => {
            const now = this.ctx.currentTime;
            const baseFreq = this.getFrequency('G', 3);
            
            // Viola: rasqueado
            this.playNote(baseFreq, 'violao', now, 0.2);
            this.playNote(baseFreq * 1.33, 'violao', now + 0.1, 0.2);
            this.playNote(baseFreq * 1.5, 'violao', now + 0.2, 0.2);
            this.playNote(baseFreq * 2, 'violao', now + 0.3, 0.3);
            
            // Reco-reco
            this.playPercussion('recoReco', now, 0.05);
            this.playPercussion('recoReco', now + 0.25, 0.05);
        };
    }
    
    generateSambaPattern() {
        // Samba brasileiro
        return () => {
            const now = this.ctx.currentTime;
            const baseFreq = this.getFrequency('D', 3);
            
            // Surdo (grave)
            this.playNote(baseFreq * 0.5, 'tamborim', now, 0.3);
            this.playNote(baseFreq * 0.5, 'tamborim', now + 0.5, 0.3);
            
            // Tamborim
            this.playPercussion('tamborim', now, 0.1);
            this.playPercussion('tamborim', now + 0.25, 0.1);
            this.playPercussion('tamborim', now + 0.5, 0.1);
            this.playPercussion('tamborim', now + 0.75, 0.1);
            
            // Agogô
            this.playPercussion('agogo', now + 0.125, 0.1);
            this.playPercussion('agogo', now + 0.625, 0.1);
        };
    }
    
    generateTensePattern() {
        // Música tensa para momentos dramáticos
        return () => {
            const now = this.ctx.currentTime;
            const baseFreq = this.getFrequency('E', 3);
            
            // Notas graves, espaçadas
            this.playNote(baseFreq * 0.75, 'violao', now, 0.5);
            this.playNote(baseFreq * 0.8, 'violao', now + 1, 0.5);
            this.playNote(baseFreq * 0.75, 'violao', now + 2, 0.5);
        };
    }
    
    generateHopefulPattern() {
        // Música de esperança
        return () => {
            const now = this.ctx.currentTime;
            const baseFreq = this.getFrequency('F', 3);
            
            // Arpejos ascendentes
            this.playNote(baseFreq, 'flute', now, 0.4);
            this.playNote(baseFreq * 1.25, 'flute', now + 0.3, 0.4);
            this.playNote(baseFreq * 1.5, 'flute', now + 0.6, 0.4);
            this.playNote(baseFreq * 2, 'flute', now + 0.9, 0.5);
        };
    }
    
    playMusicPattern() {
        if (this.currentMusic && this.currentMusic.pattern) {
            this.currentMusic.pattern();
        }
    }
    
    // ════════════════════════════════════════
    // EFEITOS SONOROS (SFX)
    // ════════════════════════════════════════
    
    playClick() {
        // Som de clique: tamborim curto
        if (!this.sfxEnabled || !this.ctx) return;
        this.playPercussion('tamborim', this.ctx.currentTime, 0.05);
    }
    
    playCollect() {
        // Som de coleta de item: som brilhante (tipo triângulo)
        if (!this.sfxEnabled || !this.ctx) return;
        const now = this.ctx.currentTime;
        const freq = this.getFrequency('C', 5);
        this.playNote(freq, { type: 'sine', attack: 0.001, decay: 0.2, sustain: 0, release: 0.3 }, now, 0.3);
        this.playNote(freq * 1.5, { type: 'sine', attack: 0.001, decay: 0.2, sustain: 0, release: 0.3 }, now + 0.1, 0.3);
    }
    
    playDialogueNext() {
        // Som suave de avanço de diálogo
        if (!this.sfxEnabled || !this.ctx) return;
        const now = this.ctx.currentTime;
        const freq = this.getFrequency('G', 4);
        this.playNote(freq, { type: 'sine', attack: 0.001, decay: 0.05, sustain: 0, release: 0.05 }, now, 0.08);
    }
    
    playStep() {
        // Passo suave (opcional, pode ser desativado)
        // Não implementado para não poluir o áudio
    }
    
    playTransition() {
        // Som de transição entre cenas
        if (!this.sfxEnabled || !this.ctx) return;
        const now = this.ctx.currentTime;
        const baseFreq = this.getFrequency('C', 4);
        
        // Arpejo descendente
        this.playNote(baseFreq * 2, { type: 'sine', attack: 0.01, decay: 0.3, sustain: 0, release: 0.3 }, now, 0.4);
        this.playNote(baseFreq * 1.5, { type: 'sine', attack: 0.01, decay: 0.3, sustain: 0, release: 0.3 }, now + 0.15, 0.4);
        this.playNote(baseFreq, { type: 'sine', attack: 0.01, decay: 0.3, sustain: 0, release: 0.3 }, now + 0.3, 0.4);
    }
    
    playFragmentCollect() {
        // Som especial ao coletar fragmento de memória
        if (!this.sfxEnabled || !this.ctx) return;
        const now = this.ctx.currentTime;
        const baseFreq = this.getFrequency('A', 4);
        
        // Acorde mágico
        this.playNote(baseFreq, { type: 'sine', attack: 0.01, decay: 0.4, sustain: 0.2, release: 0.5 }, now, 0.6);
        this.playNote(baseFreq * 1.25, { type: 'sine', attack: 0.01, decay: 0.4, sustain: 0.2, release: 0.5 }, now + 0.1, 0.6);
        this.playNote(baseFreq * 1.5, { type: 'sine', attack: 0.01, decay: 0.4, sustain: 0.2, release: 0.5 }, now + 0.2, 0.6);
    }
    
    // ════════════════════════════════════════
    // UTILITÁRIOS DE ÁUDIO
    // ════════════════════════════════════════
    
    getFrequency(note, octave) {
        const notes = { 'C': 261.63, 'C#': 277.18, 'D': 293.66, 'D#': 311.13, 'E': 329.63, 'F': 349.23, 'F#': 369.99, 'G': 392.00, 'G#': 415.30, 'A': 440.00, 'A#': 466.16, 'B': 493.88 };
        const baseFreq = notes[note] || 440;
        const multiplier = Math.pow(2, octave - 4);
        return baseFreq * multiplier;
    }
    
    playNote(freq, instrument, time, duration) {
        if (!this.ctx) return;
        
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = instrument.type || 'sine';
        osc.frequency.value = freq;
        
        // Envelope ADSR
        const attack = instrument.attack || 0.01;
        const decay = instrument.decay || 0.1;
        const sustain = instrument.sustain || 0.3;
        const release = instrument.release || 0.3;
        
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(0.3, time + attack);
        gain.gain.linearRampToValueAtTime(0.3 * sustain, time + attack + decay);
        gain.gain.linearRampToValueAtTime(0, time + duration + release);
        
        osc.connect(gain);
        gain.connect(this.masterGain);
        
        osc.start(time);
        osc.stop(time + duration + release + 0.1);
    }
    
    playPercussion(instrument, time, duration) {
        if (!this.ctx) return;
        
        if (instrument === 'noise') {
            // Ruído branco para percussão
            const bufferSize = this.ctx.sampleRate * duration;
            const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }
            
            const noise = this.ctx.createBufferSource();
            noise.buffer = buffer;
            
            const gain = this.ctx.createGain();
            gain.gain.setValueAtTime(0.15, time);
            gain.gain.exponentialRampToValueAtTime(0.01, time + duration);
            
            noise.connect(gain);
            gain.connect(this.masterGain);
            noise.start(time);
        } else {
            // Oscilador para percussão tonal
            this.playNote(400 + Math.random() * 200, this.instruments[instrument] || this.instruments.tamborim, time, duration);
        }
    }
    
    setMusicVolume(volume) {
        this.musicEnabled = volume > 0;
        if (this.masterGain) {
            this.masterGain.gain.value = volume * 0.3;
        }
    }
    
    setSFXVolume(volume) {
        this.sfxEnabled = volume > 0;
    }
}
