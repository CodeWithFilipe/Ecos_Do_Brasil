/**
 * AudioManager — música de fundo + efeitos sonoros.
 *
 * Regras de segurança:
 *  - Autoplay: navegadores bloqueiam áudio antes do primeiro gesto do usuário.
 *    unlock() é chamado no primeiro keydown; até lá a música fica pendente.
 *  - Arquivo faltando/corrompido: warning único no console, jogo segue mudo.
 *  - Todo play() tem .catch — nenhuma falha de áudio interrompe o jogo.
 *  - Mute (tecla M) persistido em localStorage.
 */
const MUTE_KEY = 'ecos_do_brasil_muted';

const TRACKS = {
    musica_biblioteca : './assets/audio/musica_biblioteca.mp3',
    musica_templo     : './assets/audio/musica_templo.mp3',
    musica_vila_rica  : './assets/audio/musica_vila_rica.mp3',
    musica_rio        : './assets/audio/musica_rio.mp3',
    musica_sao_paulo  : './assets/audio/musica_sao_paulo.mp3',
    musica_vitoria    : './assets/audio/musica_vitoria.mp3',
    sfx_blip          : './assets/audio/sfx_blip.mp3',
    sfx_confirm       : './assets/audio/sfx_confirm.mp3',
    sfx_collect       : './assets/audio/sfx_collect.mp3',
    sfx_portal        : './assets/audio/sfx_portal.mp3',
    sfx_error         : './assets/audio/sfx_error.mp3',
};

const MUSIC_VOLUME = 0.55;
const SFX_VOLUME   = 0.7;
const FADE_MS      = 600;

export class AudioManager {
    constructor() {
        this.unlocked     = false;
        this.pendingMusic = null;
        this.current      = null;   // { name, el }
        this.broken       = new Set();
        this.elements     = {};
        this._fadeTimer   = null;

        try {
            this.muted = localStorage.getItem(MUTE_KEY) === '1';
        } catch (_) {
            this.muted = false;
        }
    }

    _get(name) {
        if (this.broken.has(name)) return null;
        if (!TRACKS[name]) { console.warn(`🔇 Faixa desconhecida: ${name}`); return null; }
        if (!this.elements[name]) {
            try {
                const el = new Audio(TRACKS[name]);
                el.preload = 'auto';
                el.addEventListener('error', () => {
                    if (!this.broken.has(name)) {
                        console.warn(`🔇 Áudio não carregou (jogo segue sem ele): ${TRACKS[name]}`);
                        this.broken.add(name);
                    }
                });
                this.elements[name] = el;
            } catch (_) {
                this.broken.add(name);
                return null;
            }
        }
        return this.elements[name];
    }

    /** Chamado no primeiro gesto do usuário (keydown). */
    unlock() {
        if (this.unlocked) return;
        this.unlocked = true;
        if (this.pendingMusic) {
            const name = this.pendingMusic;
            this.pendingMusic = null;
            this.playMusic(name);
        }
    }

    /** Toca música em loop, com crossfade se já houver outra tocando. */
    playMusic(name) {
        if (!name) return;
        if (!this.unlocked) { this.pendingMusic = name; return; }
        if (this.current && this.current.name === name) return;

        const el = this._get(name);

        // Fade-out da faixa atual (mesmo que a nova tenha falhado)
        const old = this.current;
        this.current = el ? { name, el } : null;
        if (this._fadeTimer) { clearInterval(this._fadeTimer); this._fadeTimer = null; }

        if (el) {
            el.loop = true;
            el.volume = 0;
            el.currentTime = 0;
            el.muted = this.muted;
            el.play().catch(() => { /* autoplay bloqueado ou arquivo ruim — segue mudo */ });
        }

        const steps = 12;
        let step = 0;
        this._fadeTimer = setInterval(() => {
            step++;
            const t = step / steps;
            try {
                if (old && old.el) old.el.volume = Math.max(0, MUSIC_VOLUME * (1 - t));
                if (el) el.volume = Math.min(MUSIC_VOLUME, MUSIC_VOLUME * t);
            } catch (_) { /* noop */ }
            if (step >= steps) {
                clearInterval(this._fadeTimer);
                this._fadeTimer = null;
                if (old && old.el) { try { old.el.pause(); } catch (_) {} }
            }
        }, FADE_MS / steps);
    }

    /** Toca um efeito sonoro curto (pode sobrepor). */
    playSfx(name) {
        if (!this.unlocked || this.muted) return;
        const el = this._get(name);
        if (!el) return;
        try {
            const clone = el.cloneNode();
            clone.volume = SFX_VOLUME;
            clone.play().catch(() => { /* noop */ });
        } catch (_) { /* noop */ }
    }

    toggleMute() {
        this.muted = !this.muted;
        if (this.current && this.current.el) {
            try { this.current.el.muted = this.muted; } catch (_) {}
        }
        try { localStorage.setItem(MUTE_KEY, this.muted ? '1' : '0'); } catch (_) {}
        console.log(this.muted ? '🔇 Som desligado (M para ligar)' : '🔊 Som ligado');
        return this.muted;
    }
}
