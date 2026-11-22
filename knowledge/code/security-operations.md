# Operational security: accounts, devices, agents and incidents

How one person or a very small studio keeps the things around the code from being turned against it and against the people it serves: the accounts that control everything, the computer they are used from, the coding agents that act on it, the domain and its mail, client data, and what happens when one of them falls. It is written for a Mac, managed hosts and AI coding agents. The browser is [security](security.md)'s, the application and its server [security-server](security-server.md)'s, and the database, host, pipeline, packages and backups [security-platform](security-platform.md)'s. A product's own sign-in screens are [authentication](../ui/patterns/authentication.md)'s. The sections run from accounts and devices to what is done afterwards. The legal section describes EU law and is not legal advice: duties change with the role, the data and the country.

## How small businesses are breached

**What good looks like**
- [moderate] Effort follows the measured order for small businesses (under 1,000 staff): breaches began with an exploited vulnerability in 26%, abused credentials in 13% and phishing in 9% ([Verizon, *2026 DBIR*](https://www.verizon.com/business/resources/T16a/reports/2026-dbir-data-breach-investigations-report.pdf)).
- [moderate] Suppliers and people count as ways in: a third party was involved in 55% of small-business breaches and a human element in 45% ([Verizon, *2026 DBIR*](https://www.verizon.com/business/resources/T16a/reports/2026-dbir-data-breach-investigations-report.pdf)).
- [moderate] A breach is expected even at the smallest size: 42% of UK micro businesses identified a breach or attack in a year, and phishing, the commonest kind, reached 38% of businesses of all sizes ([DSIT, *Cyber Security Breaches Survey 2025/26*](https://www.gov.uk/government/statistics/cyber-security-breaches-survey-20252026/cyber-security-breaches-survey-20252026)).

**How**
- [moderate] Credentials are protected even where they are not the way in: across all organisations their abuse appeared at some point in 39% of breaches ([Verizon, *2026 DBIR*](https://www.verizon.com/business/resources/T16a/reports/2026-dbir-data-breach-investigations-report.pdf)).
- [moderate] Ransomware is not left to large firms: about 96% of victims of known size were small businesses, and 38% of victims had compromised credentials and 29% an unpatched edge device ([Verizon, *2026 DBIR*](https://www.verizon.com/business/resources/T16a/reports/2026-dbir-data-breach-investigations-report.pdf)).
- [moderate] A leaked credential is treated as early warning: 73% of the ransomware victims studied had a credential or infostealer leak within the year, and half of those had one in the 95 days before they were named as victims ([Verizon, *2026 DBIR*](https://www.verizon.com/business/resources/T16a/reports/2026-dbir-data-breach-investigations-report.pdf)).
- [moderate] The European picture for July 2024 to June 2025, weighted to public bodies, puts phishing first at 60% of intrusions and exploited vulnerabilities second at 21.3% ([ENISA, *Threat Landscape 2025*](https://www.enisa.europa.eu/sites/default/files/2026-09/ENISA%20Threat%20Landscape%202025_v1.3_September2026_0.pdf)).

**Cases**
- There is an afternoon to spend → apply waiting updates, above all on anything internet-facing, and put phishing-resistant sign-in on email and the accounts below; exploitation and credentials lead the figures.
- A supplier announces a breach → treat what that supplier held or could reach as exposed and go to *Incident response*; third parties are in over half of small-business breaches.

**Accessibility**
- [weak] None directly.

**Check**
- *Script:* none; these are the figures the other sections answer.
- *Judgement:* Which vulnerability, credential, person or supplier would get someone into production today?

**Sources:** Verizon, ENISA, DSIT as linked.

## Accounts that control everything

**What good looks like**
- [strong] Email, registrar and DNS, Git host, hosting, database and payment accounts use phishing-resistant MFA (a passkey or FIDO security key) first ([CISA, *CPG 2.0*](https://www.cisa.gov/cybersecurity-performance-goals-2-0-cpg-2-0); [NCSC, *Important online accounts*](https://www.ncsc.gov.uk/collection/small-organisations-guide-to-cyber-security/secure-your-important-online-accounts); [NIST SP 800-63B-4](https://pages.nist.gov/800-63-4/sp800-63b.html)).
- [strong] Each account has a unique password held in a password manager ([CISA, *CPG 2.0*](https://www.cisa.gov/cybersecurity-performance-goals-2-0-cpg-2-0); [NCSC, *Secure your email*](https://www.ncsc.gov.uk/collection/small-organisations-guide-to-cyber-security/secure-your-email); [NIST SP 800-63B-4](https://pages.nist.gov/800-63-4/sp800-63b.html)).
- [weak] Email is secured before the rest, because an inbox resets the passwords of the other accounts ([NCSC, *Secure your email*](https://www.ncsc.gov.uk/collection/small-organisations-guide-to-cyber-security/secure-your-email); [NCSC Ireland, *Business email compromise*](https://ncsc.gov.ie/pdfs/NCSC_BEC_Guidance.pdf)).

**How**
- [required] A one-time code, from an app or a message, is not counted as phishing-resistant ([NIST SP 800-63B-4](https://pages.nist.gov/800-63-4/sp800-63b.html)).
- [weak] Security keys held where codes failed: Google saw no targeted phishing succeed against people using only keys, while a code sent to a recovery phone stopped 76% of targeted attacks ([Google, *Basic account hygiene study*, 2019](https://security.googleblog.com/2019/05/new-research-how-effective-is-basic.html)); Cloudflare lost three passwords to phishing and no systems, because keys were required ([Cloudflare, *2022 incident*](https://blog.cloudflare.com/2022-07-sms-phishing-attacks/)).
- [moderate] SMS and voice codes are the last resort ([CISA, *CPG 2.0*](https://www.cisa.gov/cybersecurity-performance-goals-2-0-cpg-2-0); [NIST, restricted authenticator](https://pages.nist.gov/800-63-4/sp800-63b.html)).
- [weak] For high-value accounts, once two passkeys or keys work (or one and stored recovery codes), weaker MFA methods are switched off where the service allows ([CISA, *Mobile communications*](https://www.cisa.gov/sites/default/files/2024-12/guidance-mobile-communications-best-practices.pdf), written for highly targeted people).
- [required] On Vercel an authenticator app is mandatory by 20 January 2027, and a passkey can be added for phishing-resistant sign-in ([Vercel, *Two-factor authentication*](https://vercel.com/docs/two-factor-authentication)).
- [moderate] A password is changed on evidence of compromise, not on a calendar ([NIST SP 800-63B-4](https://pages.nist.gov/800-63-4/sp800-63b.html); [CNIL, *Security of personal data*, for ordinary users](https://www.cnil.fr/sites/cnil/files/2024-03/cnil_guide_securite_personnelle_ven_0.pdf)).

**Cases**
- A service offers only an authenticator app → use it, with a unique password; CISA names app prompts and codes as the [interim step](https://www.cisa.gov/sites/default/files/publications/fact-sheet-implementing-phishing-resistant-mfa-508c.pdf) for small businesses.
- The host and the Git host are entered with "Continue with" an email provider → that email account is their real key; protect it first and to the highest level.

**Accessibility**
- [weak] None directly; what a sign-in owes the person is [authentication](../ui/patterns/authentication.md)'s.

**Check**
- *Script:* could read each provider's API for MFA status where it exposes one; most need a look at the settings page.
- *Judgement:* If a perfect copy of the sign-in page asked for everything you can type, which of these accounts would fall?

**Sources:** CISA, NCSC, NIST, CNIL, Google, Cloudflare, Vercel as linked.

## Recovery and phone numbers

**What good looks like**
- [strong] Every critical account has two independent ways in, such as two keys, or a passkey and stored recovery codes ([NIST SP 800-63B-4](https://pages.nist.gov/800-63-4/sp800-63b.html); [Apple, *Security keys*](https://support.apple.com/en-us/102637); [GitHub, *2FA recovery methods*](https://docs.github.com/en/authentication/securing-your-account-with-two-factor-authentication-2fa/configuring-two-factor-authentication-recovery-methods)).
- [moderate] A phone number is treated as something that can be taken by SIM swap, so it is neither the second factor nor the recovery route where another exists ([CISA, *Scattered Spider advisory*](https://www.cisa.gov/news-events/cybersecurity-advisories/aa23-320a); [NIST, SIM change as a risk](https://pages.nist.gov/800-63-4/sp800-63b.html)).

**How**
- [moderate] Recovery codes are kept offline, outside the account they recover ([NIST SP 800-63B-4](https://pages.nist.gov/800-63-4/sp800-63b.html); [Apple, *Recovery key*](https://support.apple.com/en-us/109345)).
- [required] An Apple Account with security keys needs at least two, and losing every key and trusted device can lock it for good ([Apple, *Security keys*](https://support.apple.com/en-us/102637)).
- [weak] The mobile carrier account gets a PIN and MFA against SIM swaps ([CISA, *Mobile communications*](https://www.cisa.gov/sites/default/files/2024-12/guidance-mobile-communications-best-practices.pdf)).
- [weak] Recovery flows are read after enrolment, as some fall back to SMS ([CISA, *Mobile communications*](https://www.cisa.gov/sites/default/files/2024-12/guidance-mobile-communications-best-practices.pdf)).
- [weak] A trusted second person can reach the domain and act during an incident, through their own access ([NCSC, *Public domain names*](https://www.ncsc.gov.uk/guidance/managing-public-domain-names); [NCSC, *Prepare for incidents*](https://www.ncsc.gov.uk/collection/small-business-guidance--response-and-recovery/step-1-prepare-for-incidents)).

**Cases**
- An email says your two-factor method must be reset → open the site yourself; a [convincing 2FA-reset email](https://github.com/debug-js/debug/issues/1005) took an npm maintainer's account in 2025.
- The phone loses service without reason and reset messages arrive → call the carrier from another phone and secure email first; the number may have moved.

**Accessibility**
- [weak] None directly.

**Check**
- *Script:* none.
- *Judgement:* With the phone and the laptop both gone today, how is each critical account entered, and could a stranger use the same route?

**Sources:** NIST, CISA, NCSC, Apple, GitHub as linked.

## Sessions, tokens and access

**What good looks like**
- [strong] A signed-in session or token is guarded like the password and second factor together, because malware or a phishing proxy that steals it skips both ([CircleCI, *2023 incident report*](https://circleci.com/blog/jan-4-2023-incident-report/); [Microsoft, *AiTM phishing*](https://www.microsoft.com/en-us/security/blog/2022/07/12/from-cookie-theft-to-bec-attackers-use-aitm-phishing-sites-as-entry-point-to-further-financial-fraud/); [Google, *Device Bound Session Credentials*](https://blog.google/security/protecting-cookies-with-device-bound-session-credentials/)).
- [strong] Credentials on the computer are few, narrow and short-lived ([Microsoft, *Contagious Interview*](https://www.microsoft.com/en-us/security/blog/2026/03/11/contagious-interview-malware-delivered-through-fake-developer-job-interviews/); [NCSC, *Agentic AI*](https://www.ncsc.gov.uk/blogs/thinking-carefully-before-adopting-agentic-ai); [OWASP, *Secure coding with AI*](https://cheatsheetseries.owasp.org/cheatsheets/Secure_Coding_with_AI_Cheat_Sheet.html)).
- [strong] Who and what has access is reviewed, and what is unused is removed ([CISA, *CPG 2.0*](https://www.cisa.gov/cybersecurity-performance-goals-2-0-cpg-2-0); [NCSC, *Important online accounts*](https://www.ncsc.gov.uk/collection/small-organisations-guide-to-cyber-security/secure-your-important-online-accounts); [CNIL, *Security of personal data*](https://www.cnil.fr/sites/cnil/files/2024-03/cnil_guide_securite_personnelle_ven_0.pdf)).

**How**
- [weak] Command-line logins count as production credentials: the 2026 Nx Console compromise began with a stolen GitHub CLI token, used unseen for seven days ([Nx, *post-mortem*](https://nx.dev/blog/nx-console-v18-95-0-postmortem); [CircleCI, a stolen session](https://circleci.com/blog/jan-4-2023-incident-report/)).
- [weak] On GitHub a fine-grained personal token replaces a classic one wherever it can ([GitHub, *Personal access tokens*](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens)).
- [moderate] Connected apps are reviewed as suppliers: an employee's third-party AI tool opened the way into Vercel in 2026 ([Vercel, *April 2026 incident*](https://vercel.com/kb/bulletin/vercel-april-2026-security-incident); [GitHub, *Reviewing authorised apps*](https://docs.github.com/en/apps/using-github-apps/reviewing-and-revoking-authorization-of-github-apps)).
- [moderate] The review opens GitHub's Settings > Applications and Google's device and linked-app lists, and the equivalents at each other account ([GitHub](https://docs.github.com/en/apps/using-github-apps/reviewing-and-revoking-authorization-of-github-apps); [Google, *Devices*](https://support.google.com/accounts/answer/3067630); [Google, *Linked apps*](https://support.google.com/accounts/answer/13533235)).

**Cases**
- A password was changed after malware → disconnect that machine, then from a clean one end every session and revoke every token; a stolen session does not need the password.
- An app asks to read all mail or every repository to try one feature → decline, or grant one repository and revoke after the trial.

**Accessibility**
- [weak] None directly.

**Check**
- *Script:* could list token files and CLI logins by name, never printing values, and flag tokens with no expiry where the API reports one.
- *Judgement:* If this browser profile and home folder were copied now, what could the copy do, and for how long?

**Sources:** CircleCI, Microsoft, Google, Nx, Vercel, GitHub, CISA, NCSC, CNIL, OWASP as linked.

## Social engineering aimed at developers

**What good looks like**
- [strong] A job test, client repository or "help me debug this" project is untrusted code, since developers and freelancers are targeted through exactly these ([Microsoft, *Contagious Interview*](https://www.microsoft.com/en-us/security/blog/2026/03/11/contagious-interview-malware-delivered-through-fake-developer-job-interviews/); [ESET, *DeceptiveDevelopment*](https://www.welivesecurity.com/en/eset-research/deceptivedevelopment-targets-freelance-developers/); [Verizon, *2026 DBIR*](https://www.verizon.com/business/resources/T16a/reports/2026-dbir-data-breach-investigations-report.pdf)).
- [strong] No command from a CAPTCHA, error, meeting page, message or troubleshooting post is pasted into a terminal, however plausible it reads: this is ClickFix ([Verizon, *2026 DBIR*](https://www.verizon.com/business/resources/T16a/reports/2026-dbir-data-breach-investigations-report.pdf); [Microsoft, *ClickFix on macOS*](https://www.microsoft.com/en-us/security/blog/2026/05/06/clickfix-campaign-uses-fake-macos-utilities-lures-deliver-infostealers/); [ENISA, *Threat Landscape 2025*](https://www.enisa.europa.eu/sites/default/files/2026-09/ENISA%20Threat%20Landscape%202025_v1.3_September2026_0.pdf)).
- [strong] A change of bank details or an unusual payment is confirmed by calling a number already known ([NCA, *Invoice fraud*](https://www.nationalcrimeagency.gov.uk/who-we-are/publications/787-invoice-fraud-infosheet/file); [NCSC Ireland, *Business email compromise*](https://ncsc.gov.ie/pdfs/NCSC_BEC_Guidance.pdf); [NCSC, *Spotting cyber attacks*](https://www.ncsc.gov.uk/collection/small-organisations-guide-to-cyber-security/spotting-cyber-attacks)).

**How**
- [moderate] Untrusted projects open in a disposable virtual machine or in the editor's restricted mode, and are read before any install, task or script runs ([Microsoft, *Contagious Interview*](https://www.microsoft.com/en-us/security/blog/2026/03/11/contagious-interview-malware-delivered-through-fake-developer-job-interviews/); [VS Code, *Workspace Trust*](https://code.visualstudio.com/docs/editing/workspaces/workspace-trust)).
- [moderate] A familiar voice is no proof, as AI is used in voice impersonation: hang up and verify by another route ([NCSC Ireland](https://ncsc.gov.ie/pdfs/NCSC_BEC_Guidance.pdf); [ENISA, *Threat Landscape 2025*](https://www.enisa.europa.eu/sites/default/files/2026-09/ENISA%20Threat%20Landscape%202025_v1.3_September2026_0.pdf)).
- [weak] Calls and texts get more suspicion than email: in simulations their median click rate was about 2% in 35 non-email campaigns, against 1.4% for email ([Verizon, *2026 DBIR*](https://www.verizon.com/business/resources/T16a/reports/2026-dbir-data-breach-investigations-report.pdf)).
- [weak] A device code is never entered because someone sent it: doing so hands them a valid token through the real sign-in page ([Microsoft, *Device code phishing*](https://www.microsoft.com/en-us/security/blog/2025/02/13/storm-2372-conducts-device-code-phishing-campaign/)).
- [weak] An unexpected "allow this app" screen is refused: illicit consent gives lasting access without a password ([Microsoft, *App consent grant*](https://learn.microsoft.com/en-us/security/zero-trust/security-operations-playbook-app-consent)).

**Cases**
- A friendly approach runs for days and then needs a "missing update" for the call → leave and verify; the [axios maintainer](https://github.com/axios/axios/issues/10636) was targeted by such a campaign from about two weeks before the malicious release in 2026.
- A command was already pasted → treat the computer as compromised and go to *Incident response*.
- A client's real mailbox sends new bank details → still call; the mailbox itself may be the compromised part.

**Accessibility**
- [weak] None directly; the route for verifying a request should not depend on recognising a voice.

**Check**
- *Script:* could list tasks that run on folder open and install scripts in a cloned repository before it is trusted.
- *Judgement:* Who chose this channel, this urgency and this command: you, or the person asking?

**Sources:** Microsoft, ESET, Verizon, ENISA, NCA, NCSC, NCSC Ireland, VS Code as linked.

## The computer (macOS)

**What good looks like**
- [strong] The operating system, browser and apps update automatically and are restarted to finish; packages keep [security-platform](security-platform.md#npm-supply-chain)'s cooldown ([NCSC, *Protecting devices*](https://www.ncsc.gov.uk/collection/small-organisations-guide-to-cyber-security/protecting-your-devices); [EDPB, *Secure personal data*](https://www.edpb.europa.eu/sme/be-compliant/secure-personal-data_en); [CISA, *LummaC2 advisory*](https://www.cisa.gov/news-events/cybersecurity-advisories/aa25-141b)).
- [strong] The disk is encrypted, which on a Mac is FileVault ([CISA, *Small businesses*](https://www.cisa.gov/cyber-guidance-small-businesses); [CNIL, *Security of personal data*](https://www.cnil.fr/sites/cnil/files/2024-03/cnil_guide_securite_personnelle_ven_0.pdf); [Apple, *FileVault*](https://support.apple.com/guide/mac-help/protect-data-on-your-mac-with-filevault-mh11785/mac)).
- [strong] Software comes from official or identified sources and Gatekeeper is not overridden ([Apple, *Unknown developer*](https://support.apple.com/guide/mac-help/open-a-mac-app-from-an-unknown-developer-mh40616/mac); [NCSC, *macOS*](https://www.ncsc.gov.uk/collection/device-security-guidance/platform-guides/macos); [EDPB, *Secure personal data*](https://www.edpb.europa.eu/sme/be-compliant/secure-personal-data_en)).
- [strong] Daily work runs without administrator rights ([NCSC, *Important online accounts*](https://www.ncsc.gov.uk/collection/small-organisations-guide-to-cyber-security/secure-your-important-online-accounts); [CISA, *Small businesses*](https://www.cisa.gov/cyber-guidance-small-businesses); [CNIL, *Security of personal data*](https://www.cnil.fr/sites/cnil/files/2024-03/cnil_guide_securite_personnelle_ven_0.pdf)).
- [moderate] Remote access and admin interfaces are not exposed to the internet, and routers and other edge devices are patched first ([CISA, *Ransomware guide*](https://www.cisa.gov/stopransomware/ransomware-guide); [Verizon, *2026 DBIR*](https://www.verizon.com/business/resources/T16a/reports/2026-dbir-data-breach-investigations-report.pdf)).
- [moderate] The phone, which holds passkeys, codes and mail, is locked, updated automatically and replaced when no longer supported ([NCSC, *Protecting devices*](https://www.ncsc.gov.uk/collection/small-organisations-guide-to-cyber-security/protecting-your-devices); [CISA, *Mobile communications*](https://www.cisa.gov/sites/default/files/2024-12/guidance-mobile-communications-best-practices.pdf)).
- [moderate] Files that live only on the Mac are backed up, with a copy kept disconnected ([NCSC, *Malware and ransomware*](https://www.ncsc.gov.uk/guidance/mitigating-malware-and-ransomware-attacks); [CISA, *Ransomware guide*](https://www.cisa.gov/stopransomware/ransomware-guide)).

**How**
- [weak] "Install system data files and security updates" and Privacy & Security > Background Security Improvements > Automatically Install are on; some take effect only after a restart ([Apple, *Background updates*](https://support.apple.com/en-us/101591)).
- [required] FileVault is under System Settings > Privacy & Security, and its recovery key is kept off that disk and away from the Mac itself ([Apple, *FileVault*](https://support.apple.com/guide/mac-help/protect-data-on-your-mac-with-filevault-mh11785/mac)).
- [moderate] The firewall is on, under System Settings > Network > Firewall ([EDPB, *Secure personal data*](https://www.edpb.europa.eu/sme/be-compliant/secure-personal-data_en); [NCSC, *Protecting devices*](https://www.ncsc.gov.uk/collection/small-organisations-guide-to-cyber-security/protecting-your-devices); [Apple, *Firewall*](https://support.apple.com/guide/mac-help/block-connections-to-your-mac-with-a-firewall-mh34041/mac)).
- [moderate] The screen locks itself and asks for a secret ([CNIL, *Security of personal data*](https://www.cnil.fr/sites/cnil/files/2024-03/cnil_guide_securite_personnelle_ven_0.pdf); [EDPB, *Secure personal data*](https://www.edpb.europa.eu/sme/be-compliant/secure-personal-data_en)).
- [moderate] Browser and editor extensions are few and chosen like dependencies, since they run with broad rights and are a live attack route ([VS Code, *Extension runtime security*](https://code.visualstudio.com/docs/configure/extensions/extension-runtime-security); [ENISA, *Threat Landscape 2025*](https://www.enisa.europa.eu/sites/default/files/2026-09/ENISA%20Threat%20Landscape%202025_v1.3_September2026_0.pdf); [Nx, *post-mortem*](https://nx.dev/blog/nx-console-v18-95-0-postmortem)).
- [weak] Work traffic outside the studio is encrypted, by a VPN where private systems are reached ([CNIL](https://www.cnil.fr/sites/cnil/files/2024-03/cnil_guide_securite_personnelle_ven_0.pdf)); a personal VPN is not a general protection, as CISA advises highly targeted people against one ([CISA, *Mobile communications*](https://www.cisa.gov/sites/default/files/2024-12/guidance-mobile-communications-best-practices.pdf)).
- [required] Find My is set up before a loss; afterwards Lost Mode or a remote erase needs the Mac powered and online, and erasing ends tracking ([Apple, *Lost Mac*](https://support.apple.com/en-us/102481)).

**Cases**
- The laptop is stolen → Lost Mode, then from another device change email and other passwords, end sessions, revoke its tokens and keys, report to the police and start the breach assessment below; erase if recovery is unlikely.
- Terminal says "Possible malware, Paste blocked" → stop; macOS 26.4 and later [show this for ClickFix-style commands](https://www.microsoft.com/en-us/security/blog/2026/05/06/clickfix-campaign-uses-fake-macos-utilities-lures-deliver-infostealers/).
- An extension asks to read and change data on every site → it can [read the bank and the mail](https://support.google.com/chrome_webstore/answer/186213?hl=en); refuse it or keep it in a separate profile.
- An editor extension updates itself → a bad release arrives at once; Nx told everyone [with auto-update on during the window](https://nx.dev/blog/nx-console-v18-95-0-postmortem) to assume compromise.

**Accessibility**
- [weak] None directly.

**Check**
- *Script:* could read `fdesetup status`, the firewall state and pending updates, and list installed extensions.
- *Judgement:* If this laptop were left on a train, what could its finder read, and what would you have to prove?

**Sources:** Apple, NCSC, CISA, CNIL, EDPB, Verizon, VS Code, ENISA, Nx as linked.

## AI coding agents and MCP servers

**What good looks like**
- [strong] Anything an agent reads (issue, README, web page, tool result) can carry a prompt injection, and no model reliably tells it from an instruction ([OWASP, *LLM01*](https://raw.githubusercontent.com/GenAI-Security-Project/GenAI-LLM-Top10/main/2026/final/LLM01_PromptInjection.md); [NCSC, *Prompt injection is not SQL injection*](https://www.ncsc.gov.uk/blog-post/prompt-injection-is-not-sql-injection); [Anthropic, *How we contain Claude*](https://www.anthropic.com/research/how-we-contain-claude)).
- [strong] An agent gets least privilege: the files, tools, network and credentials of the task and no more ([OWASP, *AI agent security*](https://cheatsheetseries.owasp.org/cheatsheets/AI_Agent_Security_Cheat_Sheet.html); [NCSC, *Agentic AI*](https://www.ncsc.gov.uk/blogs/thinking-carefully-before-adopting-agentic-ai); [Anthropic, *How we contain Claude*](https://www.anthropic.com/research/how-we-contain-claude)).
- [strong] The boundary is enforced outside the model, by a sandbox, container or virtual machine with restricted network ([OWASP, *Secure coding with AI*](https://cheatsheetseries.owasp.org/cheatsheets/Secure_Coding_with_AI_Cheat_Sheet.html); [NCSC, deterministic safeguards](https://www.ncsc.gov.uk/blog-post/prompt-injection-is-not-sql-injection); [Anthropic, *How we contain Claude*](https://www.anthropic.com/research/how-we-contain-claude)).
- [moderate] A person reads and approves the exact action before anything destructive, external or irreversible ([OWASP, *LLM03*](https://raw.githubusercontent.com/GenAI-Security-Project/GenAI-LLM-Top10/main/2026/final/LLM03_ExcessiveAgency.md); [Claude Code, *Security*](https://code.claude.com/docs/en/security.md); [MCP, *Security best practices*](https://modelcontextprotocol.io/docs/2026-07-28/tutorials/security/security_best_practices)).

**How**
- [moderate] Secrets are kept out of reach, not merely out of the prompt: in Anthropic's own red-team test a pasted task made the agent send cloud credentials out in 24 of 25 tries ([Anthropic, *How we contain Claude*](https://www.anthropic.com/research/how-we-contain-claude); [OWASP, *Secure coding with AI*](https://cheatsheetseries.owasp.org/cheatsheets/Secure_Coding_with_AI_Cheat_Sheet.html)).
- [weak] Approval alone is not the control: Anthropic measured people approving about 93% of permission prompts ([Anthropic, *How we contain Claude*](https://www.anthropic.com/research/how-we-contain-claude)).
- [required] In Claude Code a `Read` deny does not bind every subprocess, and the sandbox binds only shell commands, not the Read tool, hooks or local MCP servers; a secret path is therefore denied in both, in the user's settings ([permissions](https://code.claude.com/docs/en/permissions.md); [sandboxing](https://code.claude.com/docs/en/sandboxing.md)). The block holds the `Read` rules, which match at any depth; to its `sandbox` add `credentials.files` entries with `"mode": "deny"` for the `.ssh` folder and the `.aws/credentials` file in the home folder, written with the home prefix the sandboxing page gives:

  ```json
  { "sandbox": { "enabled": true, "failIfUnavailable": true, "allowUnsandboxedCommands": false },
    "permissions": { "deny": ["Read(//**/.env)", "Read(//**/.env.*)",
      "Read(//**/.ssh/**)", "Read(//**/.aws/credentials)"] } }
  ```

- [required] Claude Code's bypass-permissions mode is only for an isolated container or VM without internet access ([Claude Code, *Permission modes*](https://code.claude.com/docs/en/permission-modes.md)).
- [weak] Cursor calls its Run Modes best-effort guardrails, not a security boundary, and ships workspace trust off; it says to open untrusted repositories in a basic editor, as restricted mode (`"security.workspace.trust.enabled": true`) breaks its AI features ([Cursor, *Agent security*](https://cursor.com/docs/agent/security)).
- [required] `claude -p` and the SDK show no trust dialog and still use a repository's hooks, `env`, helper commands and skills' `allowed-tools`, and connect its `.mcp.json` servers unasked (the SDK where it loads project settings); a session under a trusted parent folder that is not a nested repository uses the same but asks before those servers, so all those files are read first ([Claude Code, *Permissions*](https://code.claude.com/docs/en/permissions.md); [*Skills*](https://code.claude.com/docs/en/skills.md)).
- [moderate] MCP servers, plugins and skills come only from sources reviewed and trusted, and run with the least access they need ([OWASP, *MCP security*](https://cheatsheetseries.owasp.org/cheatsheets/MCP_Security_Cheat_Sheet.html); [Claude Code, *MCP*](https://code.claude.com/docs/en/mcp.md); [MCP, *Security best practices*](https://modelcontextprotocol.io/docs/2026-07-28/tutorials/security/security_best_practices)).
- [moderate] No one agent session holds private data, untrusted content and a way to send data out at once ([Willison, *The lethal trifecta*](https://simonwillison.net/2025/Jun/16/the-lethal-trifecta/); [NCSC, privileged tools](https://www.ncsc.gov.uk/blog-post/prompt-injection-is-not-sql-injection)).
- [weak] `CLAUDE.md`, `AGENTS.md`, editor rules and agent settings are reviewed like CI configuration, as they steer every later run ([OWASP, *Secure coding with AI*](https://cheatsheetseries.owasp.org/cheatsheets/Secure_Coding_with_AI_Cheat_Sheet.html)).
- [moderate] A package an agent names is checked for its page, maintainer history, downloads and creation date before install, since attackers register invented names: in 576,000 samples from 2024 models at least 5.2% of packages from commercial models did not exist ([Spracklen et al., *USENIX Security 2025*](https://www.usenix.org/conference/usenixsecurity25/presentation/spracklen); [OWASP, *Secure coding with AI*](https://cheatsheetseries.owasp.org/cheatsheets/Secure_Coding_with_AI_Cheat_Sheet.html)).

**Cases**
- A colleague sends a ready-made prompt to "just run" → read it as a script; it runs with your authority.
- An agent must look at a public issue and the production database → two sessions, the second read-only and without the issue's text.
- An MCP server's tools change after approval → review again; [OWASP calls this a rug pull](https://cheatsheetseries.owasp.org/cheatsheets/MCP_Security_Cheat_Sheet.html).

**Accessibility**
- [weak] None directly.

**Check**
- *Script:* could run a harmless canary (try to read a dummy file in a denied path, try to reach a host off the allowlist) and expect both to fail, and list MCP servers and allow rules.
- *Judgement:* If the next file it reads were written by an attacker, what is the worst this session could do without asking?

**Sources:** OWASP, NCSC, Anthropic, Claude Code, MCP, Cursor, Spracklen et al., Willison as linked.

## Domains and DNS

**What good looks like**
- [moderate] The registrar and DNS accounts have MFA, as a stolen login there can redirect the site and mail and obtain valid certificates ([NCSC, *Public domain names*](https://www.ncsc.gov.uk/guidance/managing-public-domain-names); [CISA, *ED 19-01*](https://www.cisa.gov/news-events/directives/ed-19-01-mitigate-dns-infrastructure-tampering-closed)).
- [moderate] The domain is locked against transfer, change and deletion ([ICANN, *EPP status codes*](https://www.icann.org/resources/pages/epp-status-codes-2014-06-16-en); [NCSC, *Public domain names*](https://www.ncsc.gov.uk/guidance/managing-public-domain-names)).
- [strong] No dangling record points at a service that has gone, which is how a subdomain takeover happens ([MDN, *Subdomain takeover*](https://developer.mozilla.org/en-US/docs/Web/Security/Attacks/Subdomain_takeover); [OWASP, *Subdomain takeover prevention*](https://cheatsheetseries.owasp.org/cheatsheets/Subdomain_Takeover_Prevention_Cheat_Sheet.html); [NCSC, *Public domain names*](https://www.ncsc.gov.uk/guidance/managing-public-domain-names)).

**How**
- [moderate] Ask the registrar for `clientTransferProhibited`, `clientUpdateProhibited` and `clientDeleteProhibited`, or a registry lock where offered ([ICANN, *EPP status codes*](https://www.icann.org/resources/pages/epp-status-codes-2014-06-16-en); [NCSC](https://www.ncsc.gov.uk/guidance/managing-public-domain-names)).
- [strong] On removal the DNS record goes first and the service after it ([MDN](https://developer.mozilla.org/en-US/docs/Web/Security/Attacks/Subdomain_takeover); [OWASP](https://cheatsheetseries.owasp.org/cheatsheets/Subdomain_Takeover_Prevention_Cheat_Sheet.html); [Microsoft, *Dangling DNS*](https://learn.microsoft.com/en-us/azure/security/fundamentals/subdomain-takeover)).
- [weak] The service goes only after the removed record's TTL has passed ([OWASP](https://cheatsheetseries.owasp.org/cheatsheets/Subdomain_Takeover_Prevention_Cheat_Sheet.html)).
- [weak] On creation the host is claimed before the record is added ([MDN](https://developer.mozilla.org/en-US/docs/Web/Security/Attacks/Subdomain_takeover)).
- [moderate] A CAA record on the registered domain limits who may issue certificates, since CAs must check it; list the CA of every host, proxy and service on the domain and its subdomains before publishing, or their renewals fail (`example.com. CAA 0 issue "letsencrypt.org"` allows that one alone) ([RFC 8659](https://www.rfc-editor.org/rfc/rfc8659.txt); [Let's Encrypt](https://letsencrypt.org/docs/caa/); [Cloudflare, *Certificate authorities*](https://developers.cloudflare.com/ssl/reference/certificate-authorities/)).
- [moderate] DNS records and Certificate Transparency logs are watched for changes nobody made ([NCSC, *Public domain names*](https://www.ncsc.gov.uk/guidance/managing-public-domain-names); [CISA, *ED 19-01*](https://www.cisa.gov/news-events/directives/ed-19-01-mitigate-dns-infrastructure-tampering-closed)).
- [moderate] DNSSEC is considered where DNS host and registrar support it, against forged answers and with its cost weighed; before nameservers change it is turned off at the registrar, or the domain can stop resolving ([ICANN, *DNSSEC*](https://www.icann.org/resources/pages/dnssec-what-is-it-why-important-2019-03-05-en); [NCSC](https://www.ncsc.gov.uk/guidance/managing-public-domain-names); [Cloudflare, *Setup*](https://developers.cloudflare.com/dns/zone-setups/full-setup/setup/)).
- [weak] The organisation the name represents is its registrant, with auto-renewal on and the registrar's reclaim procedure known ([NCSC, *Public domain names*](https://www.ncsc.gov.uk/guidance/managing-public-domain-names)).

**Cases**
- A client's demo at `preview.client.example` ends → delete or repoint the CNAME, wait out its TTL, then delete the deployment; the other order leaves a claimable name that may [read the main domain's cookies](https://developer.mozilla.org/en-US/docs/Web/Security/Attacks/Subdomain_takeover).
- A studio registered a client's domain in its own account → copy every DNS record and turn off DNSSEC if nameservers will change, then move it to the client's account and take delegated access.

**Accessibility**
- [weak] None directly.

**Check**
- *Script:* could resolve every record and flag targets that do not exist or serve a provider's "not found", and read the lock statuses, CAA and DS records.
- *Judgement:* Can you say what every record is for and who may change it?

**Sources:** NCSC, CISA, ICANN, MDN, OWASP, Microsoft, RFC 8659, Let's Encrypt, Cloudflare as linked.

## Email from your domain

**What good looks like**
- [strong] Every domain that sends has SPF, DKIM and DMARC ([Google, *Email sender guidelines*](https://support.google.com/mail/answer/81126?hl=en); [NCSC, *Phishing*](https://www.ncsc.gov.uk/guidance/phishing); [NCSC Ireland](https://ncsc.gov.ie/pdfs/NCSC_BEC_Guidance.pdf)).
- [moderate] A domain that sends no mail says so in DNS, and only one that also receives none says that with a null MX ([GOV.UK, *Domains that don't send email*](https://www.gov.uk/guidance/protect-domains-that-dont-send-email); [RFC 7505](https://www.rfc-editor.org/rfc/rfc7505.txt)).

**How**
- [required] Mail to personal Gmail needs SPF or DKIM from every sender and all three from bulk senders, with a DKIM key of at least 1024 bits, 2048 recommended ([Google, *Email sender guidelines*](https://support.google.com/mail/answer/81126?hl=en)).
- [required] `p=reject` never rests on SPF alone: the mail carries a valid DKIM signature aligned with the From domain ([RFC 9989](https://www.rfc-editor.org/rfc/rfc9989.txt)).
- [contested] CISA sets DMARC to `reject` ([CISA, *CPG 2.0*](https://www.cisa.gov/cybersecurity-performance-goals-2-0-cpg-2-0)); the standard says a domain whose people post to mailing lists should not, and reaches it through a month of `none` and a month of `quarantine` with reports read (`rua=mailto:…`) ([RFC 9989](https://www.rfc-editor.org/rfc/rfc9989.txt)).
- [moderate] A domain that never sends publishes `v=spf1 -all` and `v=DMARC1; p=reject` and revokes its DKIM selectors; it adds `sp=none` while a subdomain still sends, and a null MX (`MX 0 .`) only if it receives no mail either ([GOV.UK](https://www.gov.uk/guidance/protect-domains-that-dont-send-email); [RFC 7505](https://www.rfc-editor.org/rfc/rfc7505.txt)).

**Cases**
- An app sends receipts from the studio's domain → merge the provider into the one SPF record ([RFC 7208 allows no second](https://www.rfc-editor.org/rfc/rfc7208.txt)), set DKIM aligned with the From domain, read the DMARC reports, then tighten the policy.
- Contacts report odd mail from the domain → it is a [sign of an incident](https://www.ncsc.gov.uk/collection/small-business-guidance--response-and-recovery/step-2-identify-what-s-happening); look for a compromised mailbox as well as spoofing.

**Accessibility**
- [weak] None directly.

**Check**
- *Script:* could query SPF, DKIM, DMARC and MX for every domain owned, parked ones included.
- *Judgement:* Could a stranger send a believable invoice as this domain today?

**Sources:** Google, NCSC, NCSC Ireland, CISA, GOV.UK, RFC 7208, RFC 7505, RFC 9989 as linked.

## Personal and client data

**What good looks like**
- [required] Security measures fit the risk to the people in the data, with encryption, the ability to restore and "a process for regularly testing, assessing and evaluating" them included where appropriate; the law names no interval ([GDPR, Article 32](https://publications.europa.eu/resource/cellar/3e485e15-11bd-11e6-ba9a-01aa75ed71a1.0006.03/DOC_1); [UK GDPR](https://www.legislation.gov.uk/eur/2016/679/article/32)).
- [weak] Little personal data lives on the laptop, and none that the work does not need ([CNIL, *Security of personal data*](https://www.cnil.fr/sites/cnil/files/2024-03/cnil_guide_securite_personnelle_ven_0.pdf); [OWASP, data sent as agent context](https://cheatsheetseries.owasp.org/cheatsheets/Secure_Coding_with_AI_Cheat_Sheet.html)).

**How**
- [weak] Personal data is not sent unencrypted through mail or consumer messengers, and the key travels by a separate channel ([CNIL, *Security of personal data*](https://www.cnil.fr/sites/cnil/files/2024-03/cnil_guide_securite_personnelle_ven_0.pdf)).
- [required] Claude Code keeps transcripts in plain text under `.claude/projects/` in the home folder for 30 days by default (`cleanupPeriodDays`), though Desktop and Cowork sessions are exempt from that limit; on consumer plans, allowing training also means five years' retention at Anthropic ([Claude Code, *Data usage*](https://code.claude.com/docs/en/data-usage.md)).
- [moderate] What an AI tool is sent is reviewed first: source code is the type most often sent to unauthorised AI services in DLP data ([Verizon, *2026 DBIR*](https://www.verizon.com/business/resources/T16a/reports/2026-dbir-data-breach-investigations-report.pdf); [OWASP, *Secure coding with AI*](https://cheatsheetseries.owasp.org/cheatsheets/Secure_Coding_with_AI_Cheat_Sheet.html)).
- [required] When a processing contract ends, the client's personal data is deleted or returned, as the client chooses, and existing copies are deleted, unless law requires keeping it ([GDPR, Article 28(3)(g)](https://publications.europa.eu/resource/cellar/3e485e15-11bd-11e6-ba9a-01aa75ed71a1.0006.03/DOC_1)).

**Cases**
- A bug only shows on production data → reproduce with made-up rows; a dump on the laptop is in reach of every tool and agent there.
- A USB key or laptop with client data is lost → the EDPB [counts it as a breach](https://www.edpb.europa.eu/sme/assess-the-risks/data-breaches_en); assess it the day it is noticed.

**Accessibility**
- [weak] None directly.

**Check**
- *Script:* could find database dumps, exports and old transcripts by name and age, without opening them.
- *Judgement:* Whose data is on this machine today, and who agreed to it being here and at this AI provider?

**Sources:** GDPR, CNIL, EDPB, OWASP, Verizon, Claude Code as linked.

## Incident response

**What good looks like**
- [strong] A short incident response plan exists before it is needed, with contacts and account routes, readable when mail and laptop are down ([CISA, *Small businesses*](https://www.cisa.gov/cyber-guidance-small-businesses); [NCSC, *Prepare for incidents*](https://www.ncsc.gov.uk/collection/small-business-guidance--response-and-recovery/step-1-prepare-for-incidents); [EDPB, *Secure personal data*](https://www.edpb.europa.eu/sme/be-compliant/secure-personal-data_en)).
- [strong] Evidence is kept while the damage is stopped: logs, mail with headers, snapshots, and the times things were noticed ([CISA, *Ransomware guide*](https://www.cisa.gov/stopransomware/ransomware-guide); [NIST SP 800-61r3](https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-61r3.pdf); [NCSC Ireland](https://ncsc.gov.ie/pdfs/NCSC_BEC_Guidance.pdf)).
- [strong] Every secret the attacker could reach is rotated ([GitHub, *Leaked secret*](https://docs.github.com/en/code-security/tutorials/remediate-leaked-secrets/remediating-a-leaked-secret); [Vercel, *April 2026 incident*](https://vercel.com/kb/bulletin/vercel-april-2026-security-incident); [Nx, *post-mortem*](https://nx.dev/blog/nx-console-v18-95-0-postmortem)); the order is [security-platform](security-platform.md#secrets-and-tokens)'s.

**How**
- [moderate] **1. Contain:** disconnect the affected machine from every network without wiping it or switching it off (power it down only if it cannot be disconnected, as that loses evidence in memory), and work from a clean device and another channel ([CISA, *Ransomware guide*](https://www.cisa.gov/stopransomware/ransomware-guide); [NCSC, *Prepare for incidents*](https://www.ncsc.gov.uk/collection/small-business-guidance--response-and-recovery/step-1-prepare-for-incidents)).
- [moderate] **2. Preserve:** before changing anything, record forwarding rules, sessions, connected apps and security settings, export short-lived logs and snapshot cloud volumes ([CISA, *Ransomware guide*](https://www.cisa.gov/stopransomware/ransomware-guide); [NIST SP 800-61r3](https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-61r3.pdf); [NCSC Ireland](https://ncsc.gov.ie/pdfs/NCSC_BEC_Guidance.pdf)).
- [moderate] **3. Take back email:** from the clean device, remove the recorded rules you did not make and undo changed security settings, change the password, confirm you can sign in, then sign out every other device and app and set MFA ([NCSC, *Recovering a hacked account*](https://www.ncsc.gov.uk/guidance/recovering-a-hacked-account); [NCSC Ireland](https://ncsc.gov.ie/pdfs/NCSC_BEC_Guidance.pdf)).
- [moderate] **4. Rotate:** from the clean device, and only once the affected one is disconnected, revoke what was exposed in the order [security-platform](security-platform.md#secrets-and-tokens) sets, then read that account's log for misuse ([GitHub, *Leaked secret*](https://docs.github.com/en/code-security/tutorials/remediate-leaked-secrets/remediating-a-leaked-secret); [Vercel, *April 2026 incident*](https://vercel.com/kb/bulletin/vercel-april-2026-security-incident)).
- [strong] **5. Restore:** rebuild a compromised computer and restore only from backups known clean ([NIST SP 800-61r3](https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-61r3.pdf); [NCSC, *Malware and ransomware*](https://www.ncsc.gov.uk/guidance/mitigating-malware-and-ransomware-attacks); [axios, *post-mortem*](https://github.com/axios/axios/issues/10636)).
- [strong] **6. Learn:** write down what happened and change what let it ([NCSC, *Learn from the incident*](https://www.ncsc.gov.uk/collection/small-business-guidance--response-and-recovery/step-5--learn-from-the-incident); [CISA, *Ransomware guide*](https://www.cisa.gov/stopransomware/ransomware-guide); [NIST SP 800-61r3](https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-61r3.pdf)).
- [moderate] If money left, the bank is called at once to stop or recall it, then the police ([NCA, *Invoice fraud*](https://www.nationalcrimeagency.gov.uk/who-we-are/publications/787-invoice-fraud-infosheet/file); [NCSC Ireland](https://ncsc.gov.ie/pdfs/NCSC_BEC_Guidance.pdf)).

**Cases**
- Who to call → the national CSIRT or cyber helpline and the police, saved in the plan before they are needed (for example Spain's [INCIBE 017](https://www.incibe.es/linea-de-ayuda-en-ciberseguridad), the UK's [Report Fraud](https://www.ncsc.gov.uk/collection/small-business-guidance--response-and-recovery/step-4--report-the-incident-to-wider-stakeholders)); personal data goes to the [national data protection authority](https://www.edpb.europa.eu/about-edpb/our-members_en).
- A bad extension version was installed for minutes → the whole list still applies; the Nx Console release was exposed from 12:30 to 13:09 UTC and [its advice](https://nx.dev/blog/nx-console-v18-95-0-postmortem) was to treat the machine as compromised and rotate.
- A stolen token is to be revoked and the infected machine is still online → disconnect it first; the May 2026 npm payload was [reported to delete the home folder when its token was revoked](https://github.com/TanStack/router/issues/7383).

**Accessibility**
- [weak] None directly; a plan on paper or a second device must be in a form its reader can use.

**Check**
- *Script:* could keep an inventory of secret names and where each is revoked, never their values, and report any with no entry.
- *Judgement:* With the laptop off and mail untrusted, could you do the six steps from what is written down?

**Sources:** CISA, NCSC, NCSC Ireland, NCA, NIST, EDPB, GitHub, Vercel, Nx, axios, TanStack, INCIBE as linked.

## Legal duties in the EU

**What good looks like**
- [required] The role is known for each processing: a controller decides why and how, and a processor acts on a controller's instructions, so a studio is often both ([GDPR, Articles 4 and 28](https://publications.europa.eu/resource/cellar/3e485e15-11bd-11e6-ba9a-01aa75ed71a1.0006.03/DOC_1); [EDPB, *Controller or processor*](https://www.edpb.europa.eu/sme/learn-the-basics/data-controller-or-data-processor_en)).
- [required] A controller documents every personal data breach, with its facts, effects and remedy, whether or not it is reported ([GDPR, Article 33(5)](https://publications.europa.eu/resource/cellar/3e485e15-11bd-11e6-ba9a-01aa75ed71a1.0006.03/DOC_1)).

**How**
- [required] A controller notifies the authority without undue delay and, where feasible, within 72 hours of becoming aware, unless a risk to people is unlikely; a later notice gives its reasons and details may follow in phases ([GDPR, Article 33](https://publications.europa.eu/resource/cellar/3e485e15-11bd-11e6-ba9a-01aa75ed71a1.0006.03/DOC_1)).
- [required] The notice gives at least the nature and approximate scale, a contact, the likely consequences and the measures taken or proposed ([GDPR, Article 33(3)](https://publications.europa.eu/resource/cellar/3e485e15-11bd-11e6-ba9a-01aa75ed71a1.0006.03/DOC_1)).
- [required] A processor tells the controller without undue delay ([GDPR, Article 33(2)](https://publications.europa.eu/resource/cellar/3e485e15-11bd-11e6-ba9a-01aa75ed71a1.0006.03/DOC_1)).
- [weak] A processor need not assess the risk before telling the controller, who in principle counts as aware once told ([EDPB, *Guidelines 9/2022*](https://www.edpb.europa.eu/system/files/documents/2023-04/edpb_guidelines_202209_personal_data_breach_notification_v2.0_en.pdf)).
- [required] People are told without undue delay when the risk to them is likely high, unless an Article 34(3) exception applies, such as data unreadable through encryption ([GDPR, Article 34](https://publications.europa.eu/resource/cellar/3e485e15-11bd-11e6-ba9a-01aa75ed71a1.0006.03/DOC_1)).
- [required] A processor works under a contract and engages sub-processors, hosts and AI providers among them where they process that data, only with the controller's written authorisation, passes the same obligations on by contract and stays liable for them ([GDPR, Article 28(2) to (4)](https://publications.europa.eu/resource/cellar/3e485e15-11bd-11e6-ba9a-01aa75ed71a1.0006.03/DOC_1)).
- [required] A processor that decides purposes and means itself becomes a controller for that processing ([GDPR, Article 28(10)](https://publications.europa.eu/resource/cellar/3e485e15-11bd-11e6-ba9a-01aa75ed71a1.0006.03/DOC_1)).
- [required] Whoever is the manufacturer of a product with digital elements (software placed commercially on the EU market, which can include a downloadable app or plugin) reports an actively exploited vulnerability or severe incident with an early warning within 24 hours and a notification within 72, then a final report within 14 days of a corrective measure being available for a vulnerability, or a month after the 72-hour notification for an incident, since 11 September 2026 ([European Commission, *CRA reporting*](https://digital-strategy.ec.europa.eu/en/policies/cra-reporting); [*CRA summary*](https://digital-strategy.ec.europa.eu/en/policies/cra-summary)).

**Cases**
- The studio runs a client's app and finds a leak → tell the client at once with what is known; the client decides on notification, and the contract may set a shorter limit.
- The studio's own product or client list leaks → the studio is the controller and its clock started when it was [reasonably certain](https://www.edpb.europa.eu/sme/assess-the-risks/data-breaches_en) of the breach.
- Health, financial or public-sector work, or another country → check the sector and national rules; this section covers the GDPR and that one CRA duty only.

**Accessibility**
- [required] The notice to people describes the breach in clear and plain language, with a contact, likely consequences and measures ([GDPR, Article 34(2)](https://publications.europa.eu/resource/cellar/3e485e15-11bd-11e6-ba9a-01aa75ed71a1.0006.03/DOC_1)).

**Check**
- *Script:* none.
- *Judgement:* For each app you run, who is the controller, who are the sub-processors, and whom do you write to first?

**Sources:** GDPR, EDPB and the European Commission as linked.

## Recurring routine

**What good looks like**
- [moderate] Access and the plan come round on a set date; the sources read set quarterly, few-monthly and yearly intervals ([CISA, *CPG 2.0*](https://www.cisa.gov/cybersecurity-performance-goals-2-0-cpg-2-0); [NCSC, *Important online accounts*](https://www.ncsc.gov.uk/collection/small-organisations-guide-to-cyber-security/secure-your-important-online-accounts); [CNIL](https://www.cnil.fr/sites/cnil/files/2024-03/cnil_guide_securite_personnelle_ven_0.pdf)).

**How**
- [weak] **Weekly:** a check that critical system updates arrived ([EDPB, *Secure personal data*](https://www.edpb.europa.eu/sme/be-compliant/secure-personal-data_en)).
- [weak] **Every two months or so:** the incident contacts are still right ([NCSC, *Prepare for incidents*](https://www.ncsc.gov.uk/collection/small-business-guidance--response-and-recovery/step-1-prepare-for-incidents)).
- [moderate] **Quarterly:** accounts, permissions, tokens and connected apps are reviewed ([CISA, *CPG 2.0*](https://www.cisa.gov/cybersecurity-performance-goals-2-0-cpg-2-0); [NCSC, every few months](https://www.ncsc.gov.uk/collection/small-organisations-guide-to-cyber-security/secure-your-important-online-accounts)).
- [weak] **Quarterly, and after an incident or near miss:** the plan is reread and talked through once, and at least yearly drilled ([CISA, *Small businesses*](https://www.cisa.gov/cyber-guidance-small-businesses); [CISA, *CPG 2.0*](https://www.cisa.gov/cybersecurity-performance-goals-2-0-cpg-2-0)).

The legal duty to test the measures is [personal and client data](#personal-and-client-data)'s, and restore tests are [security-platform](security-platform.md#backups-and-restore-tests)'s.

**Cases**
- Someone stops working with the studio → remove access that day, not at the next review.

**Accessibility**
- [weak] None directly.

**Check**
- *Script:* could report the age of the last recorded review and restore.
- *Judgement:* When was each of these last done, and what did it find?

**Sources:** CISA, NCSC, CNIL, EDPB as linked.
