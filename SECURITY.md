# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 2.x     | Yes                |
| 1.x     | No                 |

## Reporting a Vulnerability

If you discover a security vulnerability in Lumnicode, please report it responsibly.

**Do NOT open a public GitHub issue for security vulnerabilities.**

Instead, please email: **security@lumnicode.dev**

Include:

- A description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

## Response Timeline

- **Acknowledgment:** Within 48 hours
- **Assessment:** Within 1 week
- **Fix & Disclosure:** Within 30 days for critical issues

## Scope

The following are in scope:

- Authentication and authorization bypasses
- SQL injection, XSS, CSRF
- API key exposure or leakage
- Path traversal or file access vulnerabilities
- S3/MinIO access control issues
- WebSocket security issues

The following are out of scope:

- Issues in third-party dependencies (report upstream)
- Social engineering attacks
- Denial of service attacks
- Issues requiring physical access

## Security Best Practices for Contributors

- Never commit API keys, secrets, or credentials
- Use environment variables for all sensitive configuration
- Validate and sanitize all user input
- Use parameterized queries (SQLAlchemy handles this)
- Follow the principle of least privilege for database access
