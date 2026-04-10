// ─────────────────────────────────────────────────────────────
// Creditos.js — Tela de Créditos do Jogo
// 
// Apresenta a equipe de desenvolvimento e agradecimentos
// ─────────────────────────────────────────────────────────────

export default class Creditos extends Phaser.Scene {
    constructor() { super('Creditos'); }

    create() {
        const W = 320;
        const H = 200;
        
        this.cameras.main.setBackgroundColor('#1a0e2e');

        // ════════════════════════════════════════
        // TÍTULO
        // ════════════════════════════════════════
        this.add.text(W / 2, 12, '★ CRÉDITOS', {
            fontFamily: 'monospace',
            fontSize: '12px',
            color: '#EF9F27'
        }).setOrigin(0.5);

        // ════════════════════════════════════════
        // INFORMAÇÕES DO PROJETO
        // ════════════════════════════════════════
        const creditsText = [
            'ECOS DO BRASIL',
            'O Guardião da Memória',
            '',
            'Trabalho de Engenharia de Software',
            'Centro Universitário Católica de SC',
            '',
            'DESENVOLVEDORES:',
            '• Filipe da Silva Ferreira',
            '• Samuel Lucas Corrêa Silveira',
            '• Vinícius de Andrade Martins',
            '',
            'ORIENTADOR:',
            'Prof. Paulo Rogério Pires Manseira',
            '',
            'DISCIPLINA:',
            'Engenharia de Software',
            '',
            'LOCALIZAÇÃO:',
            'Joinville, Santa Catarina',
            'Brasil · 2025',
            '',
            'REFERÊNCIAS:',
            '• Professor Layton',
            '• Carmen Sandiego',
            '• Valiant Hearts',
            '',
            'AGRADECIMENTOS:',
            'Às professoras e professores',
            'que inspiraram este projeto,',
            'e a todos que mantêm viva',
            'a memória do Brasil.',
            '',
            '★ OBRIGADO POR JOGAR! ★'
        ];

        let y = 28;
        const lineHeight = 9;
        
        creditsText.forEach((line, idx) => {
            let textColor = '#F5F0E8';
            let fontSize = '5px';
            
            if (line.includes('ECOS DO BRASIL')) {
                textColor = '#EF9F27';
                fontSize = '8px';
            } else if (line.includes('Guardião')) {
                textColor = '#7F77DD';
                fontSize = '6px';
            } else if (line.includes('DESENVOLVEDORES:') || 
                       line.includes('ORIENTADOR:') ||
                       line.includes('DISCIPLINA:') ||
                       line.includes('LOCALIZAÇÃO:') ||
                       line.includes('REFERÊNCIAS:') ||
                       line.includes('AGRADECIMENTOS:')) {
                textColor = '#EF9F27';
                fontSize = '6px';
            } else if (line.includes('•') || line.includes('★')) {
                textColor = '#7F77DD';
                fontSize = '5px';
            } else if (line.includes('Católica') || line.includes('Joinville')) {
                textColor = '#7F77DD';
                fontSize = '5px';
            }
            
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
        const btnVoltar = this.add.text(W / 2, H - 18, '← VOLTAR AO MENU', {
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
