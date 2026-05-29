# Publication & Submission Guide

The project is now a promising pilot study with a clearer manuscript structure, but it still needs final evidence packaging before journal submission. Use this roadmap to move from draft to publishable paper.

## 1. Final "Pre-Submission" Checklist
*   **Proofread**: Check for consistent terminology (e.g., always use "one-shot prompting").
*   **Citations**: Verify every reference in `paper/07_references.md`, add missing DOIs where available, and format citations according to the target venue.
*   **Formatting**: Most journals require a specific template (IEEE or ACM). You can use **Overleaf (LaTeX)** for a professional academic look.
*   **Evidence Package**: Save scan reports, normalized result tables, prompt outputs, and manual review notes in a clean reproducibility folder.
*   **Sanitization**: Remove `node_modules`, `.env` files, local databases, logs, and any accidental secrets before public release.

## 2. Where to Publish (Nigerian Context)

### A. Academic Journals (For Formal Credibility)
*   **NIJOTECH (Nigerian Journal of Technology)**: Highly respected locally and indexed globally.
*   **IEEE Access**: An international open-access journal. They have a faster turnaround than traditional journals, though they have an APC (Article Processing Charge).
*   **NCS (Nigeria Computer Society) Journals**: Good for local networking and impact within the Nigerian tech space.

### B. Preprint Servers (To Claim Your Idea FAST)
*   **arXiv.org**: Before submitting to a journal, upload here. It gives you a permanent link/DOI and "stamps" your research so nobody can claim it later.
*   **SSRN**: Similar to arXiv, but very popular for multidisciplinary tech studies.

### C. Tech Community (For Maximum Visibility)
*   **Medium / Hashnode / Dev.to**: Write a "Plain English" version of your findings. Nigerian developers on Twitter/LinkedIn love this kind of data. It can build your personal brand significantly.
*   **GitHub Repository**: Host the `data` folder (anonymize any sensitive keys if they exist). Link this in your paper so other researchers can verify your Semgrep results.

## 3. Recommended Workflow
1.  **Move to LaTeX**: Use the IEEE conference template on Overleaf.
2.  **Add Images**: Insert the strongest figures from `screenshot_guide.md` or replace screenshots with cleaner tables/charts.
3.  **Upload to arXiv**: This is the "easiest" first step for global recognition.
4.  **Submit to a Conference or Journal**: Look for calls for papers (CFPs) in "AI Security" or "Software Engineering."
