# Introduction

The software development landscape is changing rapidly as Large Language Models (LLMs) become embedded in developer workflows. Systems such as Gemini, DeepSeek, Kimi, and GPT-based coding assistants can generate functions, APIs, frontend components, and application boilerplate from short natural language prompts. This capability can improve development speed and lower the barrier to software creation, but it also creates a security risk when generated code is copied into applications without review.

The central challenge is that LLM-generated code may appear complete and functional while omitting important security controls. Common web application vulnerabilities such as injection flaws, Cross-Site Scripting (XSS), insecure authentication, broken access control, path traversal, missing CSRF protection, and unsafe session configuration can be introduced when models prioritize minimal working examples over production-grade security. Because developers may over-trust generated code, evaluating the security posture of AI-generated web applications is an important software engineering and cybersecurity problem.

This research addresses the following critical questions:
1. **RQ1:** To what extent do modern LLMs generate code with OWASP Top 10 vulnerabilities?
2. **RQ2:** Which LLM produces the most secure code for web applications?
3. **RQ3:** Does the specific category of web functionality (e.g., auth vs. file upload) significantly impact the security of the AI-generated code?

This paper makes three contributions:
1. It defines a small, reproducible benchmark of 10 web application generation prompts covering common security-sensitive tasks.
2. It compares the vulnerability profiles of 40 generated samples across four AI coding systems.
3. It maps observed weaknesses to OWASP Top 10 categories [R10] and identifies recurring security-by-default gaps in one-shot generated code.

The study is intended as a pilot empirical evaluation rather than a definitive ranking of all LLMs. The results should be interpreted as evidence of security tendencies under a controlled one-shot prompting setup.

## Related Work

Prior research has examined software vulnerability detection using traditional static analysis, deep learning, and LLM-based methods. Static Application Security Testing (SAST) has long been used to identify vulnerabilities before deployment. Kaur and Nayyar compared multiple static code analysis tools for C/C++ and Java and showed that detection coverage and false positives vary significantly across tools [R1]. Kubiuk and Kyselov reviewed deep-learning approaches for source code vulnerability detection and highlighted the importance of intermediate code representations for language-independent analysis [R9]. This supports the need to treat SAST findings as useful but not automatically definitive.

Recent work has investigated whether LLMs can detect, classify, or repair vulnerabilities. Yarema and Zagorodna compared Roslyn Analyzers with DeepSeek and Grok for C# vulnerability detection and found that hybrid SAST-plus-LLM analysis improved performance over standalone tools [R2]. Similarly, Firouzi and Ghafari evaluated Semgrep and CodeQL against human-validated LLM-generated code samples and found meaningful disagreement between tool reports and ground truth [R3]. DeepSeek-AI also evaluated open LLMs on vulnerability detection and CWE classification, showing that models may detect vulnerable code more effectively than they classify specific vulnerability types [R4].

Other work has focused on LLM-generated code security and runtime validation. Pearce et al. assessed the security of GitHub Copilot code contributions and found that AI-generated suggestions can introduce exploitable weaknesses [R5]. Perry et al. studied whether users write more insecure code with AI assistants, highlighting the human factors involved in AI-assisted secure development [R6]. In smart contract security, Germano and Duarte benchmarked LLM-generated patches using executable Solidity exploit replay, demonstrating the value of runtime validation beyond manual or static checks [R7]. Hybrid detection work such as AESIDF combines LLM reasoning with fuzzing for SQL injection detection, suggesting that LLMs may be most useful when combined with conventional security testing rather than used alone [R8].

This study differs from prior work by focusing specifically on one-shot generation of small web application components across multiple contemporary coding systems, then comparing their observed vulnerability profiles using OWASP Top 10 categories.
