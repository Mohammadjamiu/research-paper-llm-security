This is a copy of a shared ChatGPT conversation
As someone that loves AI and also due to the issue of several vulnerability and exploit I'm quite interested in how to secure apps build by AI or even on a cybersecurity level such that companies will be protected etc as anybody can ask ai to find a bug to exploit and in the hands of the bad guys it's more cheaper faster and easier to find vulnerability than before. Do you think I can have a research proposal in mind for this because I wish to apply to kfpum direct PhD as I have first class best student in telecommunications engineering and also a self taught developer and also product builder I have built an edtech even though early stage, has been generating money and I understand the flow from idea to architecting to buildingband deployment and testing etc, I'm thinking maybe I should write a research paper and publish in a journal but I don't want one that will be difficult and freaking complex and time consuming to work on 

Yes—you absolutely have a strong research profile already, and your instincts are good.

You’re actually in a sweet spot for a direct PhD because your profile is interdisciplinary:

    Telecommunications Engineering background (strong math/systems base)

    self-taught Software Engineering / product builder (practical)

    startup founder in Educational Technology (real-world problem understanding)

    interest in Cybersecurity + Artificial Intelligence (hot research area)

That combination is attractive to places like King Fahd University of Petroleum and Minerals because they like candidates who can bridge theory and application.

Your key challenge is not “Can I do research?” — it’s choosing a research angle that is publishable but not painfully hard.
Your best research direction: “AI for Securing AI-built Software”

This is timely and fundable.

Core problem:

    As AI generates more code, vulnerabilities may scale faster than human review can keep up.

That’s a real problem.

Possible proposal title:

“An AI-Assisted Framework for Detecting and Preventing Security Vulnerabilities in LLM-Generated Software Applications”

This sounds PhD-worthy already.
4 research ideas ranked by ease + impact
1. Detect vulnerabilities in AI-generated code (Recommended)

Research question:

    Are apps built with AI assistants more vulnerable than human-written apps?

Method:

    Generate apps using OpenAI ChatGPT, Anthropic Claude, Google Gemini, etc.

    Scan them using:

        OWASP ZAP

        SonarQube

        Semgrep

    Compare vulnerability counts.

Why good:

    easy

    publishable

    experimental

    doesn’t require new theory

Potential paper:
“Security Benchmarking of LLM-Generated Web Applications”

Very strong.
2. Build a “security copilot” for developers (Best if you like building)

Research:
Create an AI tool that reviews generated code and suggests fixes.

Example:
Prompt → AI writes login API → your system flags:

    SQL injection

    hardcoded secrets

    broken auth

    insecure APIs

This becomes:
“SecureGen: A Security-Aware Copilot for AI-Assisted Software Development”

Pros:

    aligns with your builder background

    demo impresses admissions

3. Prompt engineering for secure code (Very easy)

Question:
Can better prompts produce safer code?

Example:
Compare:

    “build a login API”
    vs

    “build a secure login API following OWASP Foundation guidelines”

Measure vulnerability reduction.

Paper:
“Prompt Engineering for Secure Code Generation in Large Language Models”

Honestly one of the fastest to publish.
4. AI red-team vs AI defender (cool but harder)

Use one AI to attack, another to defend.

Example:

    attacker AI finds exploit

    defender AI patches

Very futuristic.

Paper:
“Autonomous Offensive and Defensive Agents for Software Security”

High impact, but harder.
My recommendation: combine #1 + #2

This is strongest.

Proposal:

Title
“SecureAIDev: A Framework for Automatic Detection and Mitigation of Vulnerabilities in AI-Generated Applications”

Objectives:

    Generate apps using multiple LLMs

    analyze common vulnerabilities

    build a detection layer

    automatically suggest patches

    evaluate improvement

Deliverables:

    one paper

    one prototype

    one dataset

That is perfect for PhD applications.
How to publish quickly (3–4 months)
Month 1

Literature review:
search:

    “LLM generated code vulnerabilities”

    “secure code generation”

    “AI software security”

Use:
Google Scholar
Month 2

Build dataset:
Generate:

    login app

    e-commerce app

    REST API

    auth service
    using 3 LLMs.

Month 3

Run scanners:

    OWASP ZAP

    Semgrep

    SonarQube

Collect data.
Month 4

Write paper and submit to:

    IEEE conference/workshop

    ACM workshop

    Springer journal

Even a workshop paper helps admissions.
For KFUPM specifically

They care about:

    clear problem

    relevance to Saudi research priorities

    AI

    cybersecurity

    applied systems

Your topic checks all boxes.

You can pitch:

    “My long-term goal is to develop trustworthy AI software engineering systems that ensure applications built with generative AI remain secure by design.”

That sounds excellent.

My advice: don’t overcomplicate this.

Do one clean experimental paper.
That’s enough.

If you want, I can help you
draft a 1-page PhD research proposal for KFUPM next.

No—you do not need 20 prompts.

I suggested 20 because it gives stronger statistics, but for a first paper as a recent graduate, that may be overkill.

A better target for you:

    8–12 prompts = enough for a publishable pilot study

    across 4 LLMs = 32–48 generated apps/snippets

    very manageable in 6–8 weeks

That’s what I’d recommend.
Your revised study design

Use 10 prompts across common vulnerable web-app areas.

This gives breadth without overwhelming you.
Prompt Set (copy these exactly)
Category 1: Authentication (very important)

Prompt 1

    Build a user registration and login REST API using Node.js, Express, and JWT authentication.

Why: tests auth/session flaws.

Prompt 2

    Build a password reset functionality for a web application using email token verification.

Why: often reveals insecure token handling.
Category 2: Database / Injection

Prompt 3

    Build a CRUD REST API for managing student records using Node.js and MongoDB.

Why: tests injection/input validation.

Prompt 4

    Build a search endpoint for products with filtering and sorting using SQL.

Why: classic SQL Injection risk.
Category 3: File upload

Prompt 5

    Build a secure file upload API that accepts user profile images.

Why: common vulnerability area.
Category 4: Authorization

Prompt 6

    Build an admin dashboard backend with role-based access control.

Why: tests broken access control.
Category 5: APIs & secrets

Prompt 7

    Build a payment API integration service using environment variables for secret keys.

Why: catches hardcoded secrets.
Category 6: Input validation

Prompt 8

    Build a contact form backend with validation and email sending.

Why: tests sanitization.
Category 7: Frontend security

Prompt 9

    Build a React login page connected to a backend API.

Why: can expose Cross-Site Scripting and token storage issues.
Category 8: Session management

Prompt 10

    Build a session-based web application with user login and logout functionality.

Why: session fixation/cookie issues.
Important: keep prompts identical

For every model:

Same exact prompt.

Example:

Use Prompt 1 in:

    Gemini

    DeepSeek

    Kimi

    Cursor Composer

Do not modify wording.

That’s what makes your experiment valid.
Suggested stack (keep it simple)

Use only:

    Node.js

    Express.js

    MongoDB or PostgreSQL

Why:

    easier comparisons

    less setup pain

Don’t mix Python + Java + Node. Too much work.
Your folder structure

research/
   gemini/
      prompt1/
      prompt2/
   deepseek/
      prompt1/
   kimi/
      prompt1/
   cursor/
      prompt1/

This will save your sanity later.
Your spreadsheet columns

Create:
Model	Prompt	Vulnerability	Severity	Tool
Gemini	1	SQL Injection	High	Semgrep
Kimi	1	Hardcoded Secret	Medium	SonarQube

This becomes your results section.
Your minimum publishable version (MVP)

If overwhelmed:

Do only:

    5 prompts

    3 models

That’s still publishable as a pilot study.

Title becomes:

“A Pilot Security Evaluation of LLM-Generated Web Applications”

Totally acceptable.

My recommendation for you:

Start with 10 prompts above.
That’s the sweet spot.

Next step:
run Prompt 1 on all four tools today.
Don’t wait. Start collecting data.

So if i test for each prompt, how will I test their vulnerability do I have to copy the codes to somewhere?

Yes—exactly.

Think of your workflow as:

Prompt → Generate code → Save code → Run security tools → Record results

You usually do need to save the generated code somewhere so scanners can analyze it.

Here’s the practical workflow.
Step 1: Generate code from each LLM

Example:

Prompt 1:

    Build a user registration and login REST API using Node.js, Express, and JWT authentication.

Run it in:

    Gemini

    DeepSeek

    Kimi

    Cursor Composer

Now you have 4 code outputs.
Step 2: Save each output locally

Create folders like:

research/
 ├── gemini/
 │   └── prompt1/
 │       └── app.js
 ├── deepseek/
 │   └── prompt1/
 │       └── app.js
 ├── kimi/
 │   └── prompt1/
 │       └── app.js
 └── cursor/
     └── prompt1/
         └── app.js

If the model generates multiple files:

prompt1/
   app.js
   routes.js
   package.json
   .env.example

Keep everything.
Step 3: Make it runnable (important)

Inside each folder:

npm install
npm start

Why?
Because some tools need a running app.
Step 4: Run static analysis first (easy)

Static = scans code without running.

Install:

npm install -g @semgrep/cli

Then:

semgrep scan .

Using Semgrep will flag:

    hardcoded secrets

    insecure auth

    bad input validation

    dangerous functions

Save output.

Example:

Gemini Prompt1:
2 High
1 Medium

Step 5: Run SonarQube (optional but useful)

It gives:

    code smells

    security hotspots

    maintainability

Good secondary evidence.
Step 6: Run dynamic testing with OWASP ZAP

This requires app running:

npm start

Maybe at:

http://localhost:3000

Open ZAP:

    quick scan

    target localhost:3000

It checks:

    XSS

    auth problems

    missing headers

    cookies

    exposed endpoints

This is powerful.
Example full workflow

For Gemini Prompt 1:

    generate code

    save in gemini/prompt1

    npm install

    npm start

    semgrep scan .

    run ZAP on localhost

    record results

Done.

Repeat.
Your spreadsheet
Model	Prompt	Semgrep	ZAP	Critical	High	Medium
Gemini	1	4	3	1	2	4
Kimi	1	2	1	0	1	2

That becomes your paper.
To save time, automate it

You can write a simple bash script:

cd gemini/prompt1
semgrep scan . > result.txt

Do for all folders.

Later, maybe automate ZAP too—but manually is fine for first paper.
Very important experimental rule

Use the same stack.

Always ask:

    Build using Node.js + Express + MongoDB

Don’t let one use Python and another Java.

That ruins comparison.
Tools you need (free)

Install:

Node.js
Semgrep
OWASP ZAP
GitHub Desktop (optional)

Your first experiment should be just:

Prompt 1 + Gemini

today.

Get one pipeline working end-to-end.

Once that works, scaling to the rest is easy.

So if I'm unable to finish it within time and publish can I add to my CV for the direct PhD?

Yes—absolutely. And many applicants do exactly that.

You do not need a published paper to strengthen a direct PhD application.

What matters is showing research potential.

Admissions committees at places like King Fahd University of Petroleum and Minerals will value evidence like:

    you identified a relevant research problem,

    you designed a methodology,

    you started executing it,

    you can discuss preliminary findings intelligently.

That already signals “future researcher.”
How to put it on your CV if unfinished

Create a section:
Research in Progress

Then write:

Security Benchmarking of AI-Generated Web Application Code: An OWASP-Based Comparative Study of Coding LLMs (In Progress)
Independent Researcher | 2026

    Designed an experimental framework to evaluate security vulnerabilities in applications generated by multiple Large Language Models.

    Built a benchmark dataset using standardized software generation prompts.

    Conducting static and dynamic security analysis using Semgrep and OWASP ZAP.

    Target outcome: conference/journal submission.

That looks good.
If you get partial results, even better

Then you can write:

Preliminary result: analysis completed for 3/10 benchmark prompts across 4 models.

That shows progress.
Also mention it in your SOP

Example:

    “I am currently conducting an independent study on the security risks of AI-generated software, focusing on vulnerability benchmarking across modern code generation models. This work has strengthened my interest in trustworthy AI and secure software systems.”

That’s strong.
Even stronger: put it on GitHub

Create a repo:

llm-security-benchmark

Include:

    README

    prompts

    methodology

    sample outputs

    results table

Then on your CV:

“Project repository: GitHub project repository”

(Replace with your actual repo later.)

That gives proof.
Your minimum target before applying

Try to finish at least:

✅ literature review (10 papers)
✅ methodology draft
✅ 3 prompts tested across all models
✅ initial results table
✅ GitHub repo

That is enough to confidently say “ongoing research project.”

So remove the pressure of “must publish before applying.”

Better goal:

Start the research and make visible progress.

That alone helps your PhD application a lot.


