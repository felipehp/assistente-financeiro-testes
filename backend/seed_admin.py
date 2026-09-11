"""Cria o usuario admin inicial. Execute uma vez: python seed_admin.py"""
import getpass
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import auth


def main():
    username = input("Username do admin [admin]: ").strip() or "admin"
    password = getpass.getpass("Senha do admin: ")
    if not password:
        print("Senha nao pode ser vazia.")
        sys.exit(1)
    auth.create_user(username, password, "admin")
    print(f"Usuario '{username}' criado com role 'admin'.")


if __name__ == "__main__":
    main()
