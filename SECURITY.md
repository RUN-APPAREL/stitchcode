# Security Policy

RUN STITCHCODE is designed to be boring in the best way: it has **no server,
no accounts and no data leaving the device**, which keeps the attack surface
very small. Security is still taken seriously.

## Supported versions

| Version | Supported |
| ------- | --------- |
| 1.x     | ✅ — receives security fixes |
| < 1.0   | ❌ — too old, please update |

## Reporting a vulnerability

**Please do not open a public issue for security problems.**

The preferred, private way:

1. Go to the repository's **Security** tab on GitHub.
2. Choose **Report a vulnerability** (private advisory).
3. Describe what you found, with steps to reproduce if you can.

If private advisories are unavailable, contact a maintainer through GitHub
direct messages and ask for a secure channel.

### What happens next

| Step | Timeframe |
|---|---|
| "We received it" reply | within **48 hours** |
| First assessment | within **7 days** |
| Fix & release (if confirmed) | as fast as safely possible |
| Public credit | in the release notes, if the reporter wants it |

## Scope notes

Because the app is fully local, typical web vulnerabilities (SQL injection,
server-side request forgery, session hijacking…) do not apply. Reports that
matter most:

- Anything that could exfiltrate user input or stored history.
- Cross-site scripting via crafted payloads rendered into the page.
- Supply-chain risks in bundled dependencies.
- Decode-test bypasses that let an unscannable code claim "✓ It works".

Thank you for helping keep the studio safe for its youngest users.
