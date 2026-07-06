@echo off
:: ============================================================
::  Ecos do Brasil - Instalar certificado de confianca
:: ------------------------------------------------------------
::  Faz o Windows confiar no executavel assinado (EcosDoBrasil-
::  portable-1.0.0.exe), removendo o aviso de "editor desconhecido".
::
::  IMPORTANTE: clique com o botao DIREITO neste arquivo e
::  escolha "Executar como administrador".
:: ============================================================
echo.
echo Instalando o certificado "Ecos do Brasil" nas lojas de confianca...
echo.
certutil -addstore -f "Root" "%~dp0ecos-codesign.cer"
certutil -addstore -f "TrustedPublisher" "%~dp0ecos-codesign.cer"
echo.
echo Pronto. Agora o Windows deve abrir o jogo sem avisos de seguranca.
echo (Se aparecer erro de "Acesso negado", rode este .bat como administrador.)
echo.
pause
