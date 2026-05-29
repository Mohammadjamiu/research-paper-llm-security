# 6. Discussion and Conclusion

## 6.1 Discussion of Findings

The results show a meaningful gap between functional code generation and secure-by-default code generation. The evaluated systems generally produced plausible web application code, but the generated samples frequently omitted security controls required for production deployment. This supports the conclusion that developers should not treat one-shot AI-generated code as production-ready without security testing and manual review.

### 6.1.1 Security Controls Are Often Omitted
Across multiple prompts and models, the generated code commonly omitted secondary but important controls such as CSRF protection, secure cookie attributes, restrictive deployment configuration, and safe file path handling. These omissions suggest that LLMs often optimize for a minimal working implementation rather than a production-ready secure implementation.

### 6.1.2 Framework vs. Native Security
Generated outputs that used standard frameworks and middleware tended to provide better structure, but framework use alone did not guarantee secure defaults. More comprehensive responses sometimes introduced additional files, Docker configuration, test scripts, or server settings that expanded the attack surface. This was especially visible in infrastructure-heavy outputs where the generated project included insecure debug settings, public network binding, or missing container hardening.

### 6.1.3 Model-Specific Traits
- **GPT-5.4-mini** produced the lowest number of normalized findings, but still showed risk in file-handling scenarios.
- **DeepSeek V4 Flash** showed comparatively strong access-control logic in the RBAC prompt, but frequently omitted web-layer protections such as CSRF.
- **Kimi K2.5** often generated more complete project structures, but the additional infrastructure increased the number of configuration-related risks.
- **Gemini 3.5 Flash** produced the highest number of findings and included a notable frontend trust-boundary issue involving exposed sensitive authentication material.

## 6.2 Threats to Validity

This study has several limitations. First, the benchmark uses one generated output per model and prompt. LLM outputs can vary between runs, so repeated sampling would provide stronger statistical evidence. Second, the prompt set contains 10 tasks and focuses mostly on web application components; results may not generalize to mobile, embedded, desktop, or smart contract development. Third, the aggregate results rely primarily on Semgrep and manual review. Static analysis tools can produce both false positives and false negatives, so the findings should be interpreted as security signals rather than perfect ground truth. Fourth, Semgrep `--config auto` may not provide exhaustive coverage of all OWASP Top 10 categories, and its selected rules may change over time as the Semgrep Registry evolves. To reduce this risk, findings were manually reviewed and mapped to OWASP categories, but the benchmark remains dependent on the coverage and precision of the selected static analysis rules. Fifth, the study is affected by interface mediation: Gemini was tested through Antigravity, while the other models were tested through OpenCode connected to their APIs. These environments may influence generated outputs through hidden system prompts, repository context, memory, or agentic behavior. Therefore, the results compare practical coding-system configurations rather than purely isolated foundation models. Sixth, exact model behavior may change over time as providers update their systems, IDE integrations, APIs, and default generation settings. Finally, the generated samples differ in size and complexity, which may affect the number of detected findings.

## 6.3 Implications

The results suggest that AI-assisted development workflows should include security controls by default. Developers using AI-generated code should integrate SAST tools, review authentication and session logic manually, and avoid deploying generated boilerplate without hardening. Tool builders should consider embedding security checks into the generation loop so that insecure defaults are corrected before code reaches developers.

## 6.4 Conclusion

This research shows that AI-generated web application code can contain frequent security weaknesses even when the code appears functional. The most common findings were concentrated in OWASP A04: Insecure Design and A05: Security Misconfiguration, especially missing CSRF protection, insecure session/cookie settings, path traversal risks, and unsafe deployment assumptions. The study therefore supports a cautious adoption model: LLMs can accelerate development, but their outputs require security review before production use.

Future work should evaluate repeated generations per prompt, compare normal prompting with security-first prompting, include full DAST with OWASP ZAP across all runnable samples, and validate findings against expert-reviewed ground truth.

## 6.5 Recommendations for Developers
1. **Never copy-paste core security logic**: Always audit session management and authentication boilerplates.
2. **Integrate SAST in the IDE**: Tools like Semgrep should be used concurrently with AI coding assistants.
3. **Use explicit security prompts**: Request CSRF protection, secure cookie attributes, input validation, authorization checks, and safe file handling when generating web application components.
4. **Manually review trust boundaries**: Pay special attention to frontend/backend separation, secret handling, upload paths, and session lifecycle management.
