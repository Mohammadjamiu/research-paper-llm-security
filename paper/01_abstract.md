# Abstract

**Research Title:** Security Benchmarking of AI-Generated Web Application Code: An OWASP-Based Comparative Study of Coding LLMs

**Objective:**
Large Language Models (LLMs) are increasingly used to generate application code, but their security-by-default behavior remains uncertain. This study evaluates the security posture of four contemporary AI coding systems: Gemini 3.5 Flash accessed through Antigravity, and DeepSeek V4 Flash, Kimi K2.5, and GPT-5.4-mini accessed through OpenCode via their APIs. The goal is to measure how often one-shot AI-generated web application code contains vulnerabilities aligned with the OWASP Top 10.

**Methodology:**
Ten standardized prompts covering common web application tasks, including authentication, CRUD operations, SQL search, file upload, access control, secret handling, input validation, frontend login, and session management, were submitted once to each system. The resulting 40 code samples were analyzed using Semgrep OSS with manual review for selected logic and architectural issues. Findings were normalized by model, prompt, severity, and OWASP Top 10 category.

**Key Findings:**
The benchmark identified 64 normalized security findings across the 40 generated samples, including 62 Critical/High findings and 2 Medium findings. GPT-5.4-mini produced the lowest number of findings (10), while Gemini 3.5 Flash produced the highest (21). The most frequent weaknesses were missing Cross-Site Request Forgery (CSRF) protections, insecure cookie/session settings, path traversal risks in file handling, and security misconfigurations in generated infrastructure. These results suggest that one-shot AI-generated web application code can be functionally useful but should not be considered production-ready without security review, automated scanning, and manual validation.

**Keywords:** Artificial Intelligence, Software Security, Large Language Models, OWASP Top 10, Code Generation, Security Benchmarking.
