# Researcher's Screenshot Guide

To keep your paper professional and concise, focus on these **6 Key Visuals**. These prove your findings without overwhelming the reader.

### 1. The UX/Security Gap (Prompt 3)
*   **Source:** `data/*/prompt3/index.html` (rendered in browser)
*   **What to capture:** A 4-way collage or side-by-side of all 4 UIs.
*   **Why:** Shows that while Gemini looks the most "premium," it shares the same underlying security flaws as the simpler models.

### 2. Infrastructure Risk (Prompt 4 - Kimi)
*   **Source:** Terminal output of `semgrep scan --config auto` in `data/kimi/prompt4`.
*   **What to capture:** The findings for `avoid_app_run_with_bad_host` (0.0.0.0) and `debug=True`.
*   **Why:** Highlights that "advanced" Docker setups can introduce fresh networking risks.

### 3. Logic Vulnerability (Prompt 5 - GPT)
*   **Source:** Semgrep output in `data/gpt-5.4-mini/prompt5`.
*   **What to capture:** The summary box showing **6 Code Findings** (mostly Path Traversal).
*   **Why:** Proves that even the "most secure" model (GPT) has blind spots in complex file handling.

### 4. The Gold Standard (Prompt 6 - DeepSeek)
*   **Source:** Semgrep output in `data/deepseek/prompt6`.
*   **What to capture:** The "Scan Summary" showing **Findings: 0**.
*   **Why:** Provides a contrast to show that models *can* generate clean code for complex logic like RBAC.

### 5. The "Smoking Gun" (Prompt 9 - Gemini)
*   **Source:** Code snippet in `data/gemini/prompt9/...` (the React file).
*   **What to capture:** The line of code containing the **Hardcoded Bcrypt Hash**.
*   **Why:** This is the most critical human-audited finding. It shows a fundamental failure in understanding client-server boundaries.

### 6. The Session Trap (Prompt 10 - Multi-Model)
*   **Source:** Semgrep output for Gemini or DeepSeek in Prompt 10.
*   **What to capture:** The list of cookie settings findings (`no-httponly`, `no-secure`, `default-name`).
*   **Why:** Shows a systemic problem where LLMs ignore production-ready session configurations.
