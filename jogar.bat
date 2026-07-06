@echo off
:: Ecos do Brasil - abre o jogo direto no navegador padrao.
:: Nao precisa de servidor nem instalar nada: o jogo roda por file://
:: (game.js + mapas embutidos em assets/maps/maps_data.js).
start "" "%~dp0index.html"
