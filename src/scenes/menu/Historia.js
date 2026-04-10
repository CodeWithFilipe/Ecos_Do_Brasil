// ─────────────────────────────────────────────────────────────
// Historia.js — Tela de História do Jogo
// 
// Apresenta o contexto histórico e narrativa do jogo
// ─────────────────────────────────────────────────────────────

export default class Historia extends Phaser.Scene {
    constructor() { super('Historia'); }

    create() {
        const W = 800;
        const H = 600;
        
        this.cameras.main.setBackgroundColor('#1a0e2e');

        // ════════════════════════════════════════
        // TÍTULO
        // ════════════════════════════════════════
        this.add.text(W / 2, 15, '📖 HISTÓRIA', {
            fontFamily: 'monospace',
            fontSize: '12px',
            color: '#EF9F27'
        }).setOrigin(0.5);

        // ════════════════════════════════════════
        // TEXTO DA HISTÓRIA (scrolling)
        // ════════════════════════════════════════
        const storyText = [
            'O ano é 2025. Alex, um estudante do 8º ano,',
            'precisa fazer um trabalho de história sobre',
            'o Brasil. Mas há algo estranho no ar...',
            '',
            'Uma Névoa misteriosa está apagando as',
            'memórias do passado brasileiro. Pessoas',
            'estão esquecendo a verdadeira história.',
            '',
            'Na biblioteca da escola, Alex encontra',
            'um livro antigo que o transporta para',
            'uma dimensão entre tempos: o Templo da',
            'Memória.',
            '',
            'Lá, conhece Clio, a Guardião da Memória,',
            'que explica: apenas restaurando os',
            'fragmentos das memórias históricas',
            'poderá salvar o passado do esquecimento.',
            '',
            'Sua jornada:',
            '• Vila Rica, 1789 — A Inconfidência',
            '• Rio de Janeiro, 1889 — A República',
            '• São Paulo, 1888 — A Abolição',
            '• Rio de Janeiro, 1904 — A Revolta',
            '',
            'Cada época guarda um fragmento.',
            'Cada fragmento revela uma verdade.',
            'Mas cuidado: a Névoa distorce tudo...'
        ];

        let y = 30;
        const lineHeight = 10;
        
        storyText.forEach((line, idx) => {
            const isTitle = line.includes('•') || line.includes('Sua jornada:');
            const textColor = isTitle ? '#EF9F27' : '#F5F0E8';
            const fontSize = isTitle ? '7px' : '6px';
            
            this.add.text(W / 2, y, line, {
                fontFamily: 'monospace',
                fontSize: fontSize,
                color: textColor,
                align: 'center'
            }).setOrigin(0.5, 0);
            
            y += lineHeight;
        });

        // ════════════════════════════════════════
        // BOTÃO VOLTAR
        // ════════════════════════════════════════
        const btnVoltar = this.add.text(W / 2, H - 20, '← VOLTAR AO MENU', {
            fontFamily: 'monospace',
            fontSize: '9px',
            color: '#F5F0E8',
            backgroundColor: '#3C3489',
            padding: { x: 10, y: 5 }
        }).setOrigin(0.5).setInteractive();

        btnVoltar.on('pointerdown', () => {
            this.cameras.main.fadeOut(400, 0, 0, 0);
            this.time.delayedCall(400, () => {
                this.scene.start('MenuPrincipal');
            });
        });

        btnVoltar.on('pointerover', () => {
            btnVoltar.setBackgroundColor('#534AB7');
        });

        btnVoltar.on('pointerout', () => {
            btnVoltar.setBackgroundColor('#3C3489');
        });

        // Fade in
        this.cameras.main.fadeIn(600);
    }
}
