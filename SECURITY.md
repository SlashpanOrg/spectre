# Security Policy

## Reporting a Vulnerability

Please report security vulnerabilities to sr@slashpan.com.

## Security Measures

- API keys are encrypted locally using AES encryption
- No data is sent to third parties without explicit consent
- All AI provider communication uses HTTPS
- Configuration files are stored in user's home directory

## Data Handling

- API keys: Encrypted at rest with `crypto-js` AES
- Indexed code: Stored locally in Qdrant and SQLite
- Query history: Stored locally in SQLite
- No cloud storage of any kind

---

Built by Slashpan Technologies Private Limited
