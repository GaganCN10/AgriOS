@echo off
title AgriOS Unified Platform Orchestrator
echo =======================================================================
echo                 AgriOS Unified Agriculture OS Launcher
echo =======================================================================
echo.

:: 1. Verify Node Modules for Server
if not exist "server\node_modules\" (
    echo [Orchestrator] Server node_modules missing. Installing dependencies...
    cd server
    call npm install
    cd ..
) else (
    echo [Orchestrator] Backend dependencies verified.
)

:: 2. Verify Node Modules for Client
if not exist "client\node_modules\" (
    echo [Orchestrator] Client node_modules missing. Installing dependencies...
    cd client
    call npm install
    cd ..
) else (
    echo [Orchestrator] Frontend dependencies verified.
)

:: 3. Bootstrap Python models if they don't exist
if not exist "ml_service\models_bin\disease_classifier.h5" (
    echo [Orchestrator] Serialized ML weight files not found.
    echo [Orchestrator] Bootstrapping sklearn and h5py models in ml_service/models_bin/...
    python ml_service/train_dummy_models.py
) else (
    echo [Orchestrator] Machine Learning serialized weights verified.
)

echo.
echo =======================================================================
echo          Launching Dual-Runtime Microservices concurrently...
echo =======================================================================
echo * Express MVC Server running on: http://localhost:5000
echo * Vite React Frontend running on: http://localhost:3000
echo * Python ML Sidecar running on:   http://localhost:8000
echo =======================================================================
echo.

:: Launch concurrent command prompts
start "AgriOS MERN Backend" cmd /k "cd server && npm run start"
start "AgriOS React Frontend" cmd /k "cd client && npm run dev"
start "AgriOS Python ML Sidecar" cmd /k "python -m uvicorn ml_service.main:app --reload --port 8000"

echo [Orchestrator] Startup sequence complete. Press any key to close launcher window...
pause > nul
