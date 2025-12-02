import sys
import os

# Adiciona o diretório "pai" (frontend) ao caminho do Python
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.append(parent_dir)

# Importa do arquivo main.py
from backend.app.main import app