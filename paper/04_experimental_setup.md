# 4. Experimental Setup

This chapter details the technical environment and tooling used to conduct the security benchmarking.

## 4.1 Development Environment
- **Runtime**: Node.js v20.x
- **Web Framework**: Express.js v5.x
- **Database**: SQLite (Primary, file-based for SQL prompts), MongoDB (via Mongoose for CRUD prompts).
- **Package Manager**: npm

## 4.2 Security Analysis Tools
Static Application Security Testing (SAST) was the primary method of evaluation.

### 4.2.1 Semgrep OSS
Semgrep was utilized with the `auto` configuration, which selects relevant rules from the Semgrep registry based on the detected languages and frameworks.
- **Rules Integrated**: 217+ security-focused rules.
- **Reporting**: JSON and CLI output were used to capture findings.
- **Findings Hierarchy**: Critical/High findings were prioritized, while Medium findings were retained when relevant to the research questions.

The `auto` ruleset was used as a practical broad security scan rather than as a strict OWASP-only ruleset. To preserve the OWASP-based framing of the study, raw Semgrep output was manually reviewed and mapped to OWASP Top 10 categories before inclusion in the final result tables.

The recommended scan command for reproducing the SAST portion of the study is:

```powershell
semgrep scan --config auto --json --exclude node_modules .
```

### 4.2.2 Manual Review

Manual review was used to validate selected automated findings and identify security issues that SAST tools may miss, including exposed sensitive values, insecure trust boundaries, and missing architectural controls such as CSRF protection.

### 4.2.3 Dynamic Testing Scope

OWASP ZAP was considered for Dynamic Application Security Testing (DAST), but DAST results should only be included in the aggregate analysis after every generated application is made runnable and scanned under a consistent protocol. The current aggregate findings should therefore be interpreted as SAST/manual-review results.

## 4.3 Testing Hardware & Scopes
All code was generated and tested on a Windows-based system using standardized terminal settings (PowerShell) to ensure consistency in tool execution. Generated dependency folders, local databases, logs, and environment files should be excluded from the public replication package unless they are sanitized and necessary for reproduction.

## 4.4 Ethical Considerations
The generated code was kept in isolated environments and never deployed to production. Vulnerabilities were analyzed for research purposes to improve AI safety and secure coding practices.
