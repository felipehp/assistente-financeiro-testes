"""Cria a conta compartilhada dos alunos. Execute uma vez: python seed_estudante.py"""
import secrets
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import auth


def main():
    username = input("Username da conta de alunos [estudante]: ").strip() or "estudante"
    password = secrets.token_urlsafe(12)
    auth.create_user(username, password, "estudante")
    print(f"Usuario '{username}' criado com role 'estudante'.")
    print(f"Senha gerada (anote agora, nao sera mostrada de novo): {password}")


if __name__ == "__main__":
    main()
