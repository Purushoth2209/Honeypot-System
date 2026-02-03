# Attack Simulator

Python script to simulate various attacks against the honeypot system for testing purposes.

## Prerequisites

```bash
pip install requests
```

## Usage

1. **Start the honeypot first:**
```bash
cd ../honey-pot
npm start
```

2. **Run the attack simulator:**
```bash
python3 simulate_attacks.py
```

## What It Tests

- **SQL Injection**: Various SQL injection payloads
- **Admin Login**: Credential stuffing attempts
- **SSH Brute-Force**: Common username/password combinations
- **XSS Attacks**: Cross-site scripting patterns

## Output

All attacks are logged to `../honey-pot/logs/honeypot.log.json`

View logs:
```bash
cat ../honey-pot/logs/honeypot.log.json | python3 -m json.tool
```
