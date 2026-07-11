# 🧠 Hermes Multi-Agent Setup — Cloud VPS Edition

*Adaptation of the Mac Mini guide for a cloud Linux server. Last updated: July 2026*

---

## What Changes vs. the Mac Mini Guide

Hermes Agent officially supports Linux with the exact same one-line installer, and everything in the original guide — profiles, skills, the Telegram gateway, cron jobs — works headless on a server. The differences are:

| Topic | Mac Mini | Cloud VPS |
|---|---|---|
| Hardware | ~$600 upfront | ~€5/month, cancel anytime |
| OS | macOS | Ubuntu 24.04 LTS |
| Access | Sit at it / Screen Sharing | SSH from your laptop (and Telegram from anywhere) |
| Obsidian app | Runs on the Mac | Runs on **your laptop/phone**; the server only holds the vault *files*, synced via Syncthing |
| Gateway service | launchd | systemd (`hermes gateway install` handles it; manual unit below as fallback) |
| Security | Sits behind your home router | Public IP → you must harden it (SSH keys, firewall) — covered in Step 2 |
| Uptime | Off when there's a power cut | Always on — better for cron jobs |

Everything else — OpenRouter, agent profiles, the Agent Hub, the skills, Telegram — is identical. Where a step is unchanged from the original guide, this document says so instead of repeating it.

**Total cost:** ~€5/month for the server + OpenRouter usage (same $20–50 starter credit as before).

---

## Step 0: Pick a Provider and Create the Server

**Recommendation: Hetzner Cloud** — best price/performance in Europe, dead simple UI.

- Plan: **CX22** (2 vCPU, 4 GB RAM, 40 GB SSD) ≈ **€4.35/month**. The heavy AI lifting happens on OpenRouter's side, so the server itself needs very little power. 4 GB RAM is comfortable; 2 GB works if you install with `--skip-browser`.
- Alternatives: DigitalOcean Basic droplet ($6–12/mo, slightly slicker UI), or Oracle Cloud's free tier (genuinely free, but signup is finicky and capacity is often unavailable).

**Create it (Hetzner walkthrough):**

1. Sign up at [console.hetzner.cloud](https://console.hetzner.cloud) and create a project (e.g. "hermes")
2. **Add your SSH key first** (Security → SSH Keys). On your laptop, generate one if you don't have one:
   ```bash
   ssh-keygen -t ed25519 -C "hermes-server"
   cat ~/.ssh/id_ed25519.pub
   ```
   Paste the output (the `ssh-ed25519 AAAA...` line) into Hetzner.
3. **Add Server** → Location: pick one near you (e.g. Falkenstein) → Image: **Ubuntu 24.04** → Type: **CX22** → select your SSH key → optionally enable **Backups** (+20%, worth it) → Create.
4. Note the server's **public IP address**.

**Log in from your laptop:**

```bash
ssh root@YOUR_SERVER_IP
```

---

## Step 1: Create a User

Don't run your agents as root. Create a dedicated user with sudo rights:

```bash
adduser hermes            # pick a strong password when asked
usermod -aG sudo hermes
rsync --archive --chown=hermes:hermes ~/.ssh /home/hermes/   # copy your SSH key over
```

From now on, log in as that user:

```bash
exit
ssh hermes@YOUR_SERVER_IP
```

---

## Step 2: Harden the Server (10 minutes, don't skip)

Your OpenRouter key and Telegram token will live on this box, and it has a public IP. Three things make it safe:

**1. Firewall — allow only SSH.** The Telegram gateway uses *outbound* long-polling, so no inbound ports are needed at all besides SSH:

```bash
sudo ufw allow OpenSSH
sudo ufw enable        # answer "y"
sudo ufw status        # should show only OpenSSH allowed
```

**2. Disable SSH password login** (keys only):

```bash
echo 'PasswordAuthentication no
PermitRootLogin no' | sudo tee /etc/ssh/sshd_config.d/99-hardening.conf
sudo systemctl restart ssh
```

⚠️ Before closing your terminal, open a **second** terminal and confirm `ssh hermes@YOUR_SERVER_IP` still works.

**3. Automatic security updates:**

```bash
sudo apt update && sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades   # choose "Yes"
```

Optional extra: `sudo apt install -y fail2ban` (bans IPs that hammer SSH).

---

## Step 3: Install Hermes Agent

Same one-liner as the Mac guide — it detects Linux and installs all dependencies (Python, Node.js, ripgrep, ffmpeg) automatically:

```bash
sudo apt install -y git curl xz-utils
curl -fsSL https://hermes-agent.nousresearch.com/install.sh | bash
```

💡 If you chose a 2 GB RAM server or want to save ~1 GB of disk, append `-s -- --skip-browser` to skip Chromium (you lose in-agent browser automation; web search via APIs still works).

Then reload your shell and verify:

```bash
source ~/.bashrc
hermes --version     # → hermes-agent v2.x.x
hermes doctor        # diagnoses anything missing
```

---

## Step 4: OpenRouter

**Identical to the original guide.** Get your key at [openrouter.ai](https://openrouter.ai) → Keys → Create Key, add $20–50 credits, then on the server:

```bash
hermes setup
```

Choose **Model** → **OpenRouter** → paste key → default model `deepseek/deepseek-v4-flash`. Verify:

```bash
hermes chat -q "Say hello in exactly three words"
```

---

## Step 5: The Vault (Obsidian, headless-style)

Key insight: **an Obsidian vault is just a folder of markdown files.** The Obsidian *app* never runs on the server — your agents read and write the files directly, and you view/edit them in Obsidian on your laptop and phone via sync (next step).

Create the vault on the server:

```bash
mkdir -p ~/second-brain
cd ~/second-brain
mkdir -p Inbox/Archived Research/Archived Areas Resources Projects Daily "Agent Hub/handoffs" "Agent Hub/discoveries" "Agent Hub/weekly-reports"
```

(Path tip: `~/second-brain` without spaces saves you a lifetime of quoting headaches vs. `Second Brain`.)

Create `Index.md`:

```bash
cat > ~/second-brain/Index.md << 'EOF'
# Index

- [[Inbox/]] — Raw captures
- [[Research/]] — Research notes
- [[Areas/]] — Ongoing responsibilities
- [[Resources/]] — Evergreen knowledge
- [[Projects/]] — Active projects
- [[Agent Hub/]] — Agent communication hub
EOF
```

Tell Hermes where it is:

```bash
echo "OBSIDIAN_VAULT_PATH=$HOME/second-brain" >> ~/.hermes/.env
grep OBSIDIAN_VAULT_PATH ~/.hermes/.env    # verify
```

And create the Agent Hub files (Step 6 of the original guide):

```bash
cat > ~/second-brain/Agent\ Hub/bulletin.md << 'EOF'
# Agent Bulletin

Time-ordered feed for cross-agent communication. Each agent appends here.

## Format

**YYYY-MM-DD HH:MM — Agent Name → Target Agent(s)**

Content here...

---

## Entries

*(Newest first)*
EOF
touch ~/second-brain/Agent\ Hub/resolutions.md ~/second-brain/Agent\ Hub/index.md
```

---

## Step 6: Sync the Vault to Your Devices with Syncthing

This replaces "open Obsidian on the Mac." Syncthing is free, open-source, peer-to-peer (your notes never touch a third-party cloud), and has clients for macOS, Windows, Linux, Android; on iOS use the Möbius Sync app.

**On the server:**

```bash
sudo apt install -y syncthing
sudo systemctl enable --now syncthing@hermes.service   # use your username
```

Syncthing's admin GUI listens on localhost only. Reach it securely from your laptop through an SSH tunnel:

```bash
# on your laptop:
ssh -L 8385:localhost:8384 hermes@YOUR_SERVER_IP
```

Then open `http://localhost:8385` in your laptop's browser — that's the *server's* Syncthing UI.

**Pair and share:**

1. Install Syncthing on your laptop ([syncthing.net](https://syncthing.net)) and open its own UI at `http://localhost:8384`
2. In the **server** UI: Actions → Show ID. In the **laptop** UI: Add Remote Device → paste the ID
3. Accept the pairing prompt on the server UI
4. In the server UI: Add Folder → path `/home/hermes/second-brain` → Sharing tab → tick your laptop
5. Accept the folder on the laptop, choosing a local path like `~/Documents/second-brain`
6. On the laptop, open **Obsidian** → "Open folder as vault" → pick `~/Documents/second-brain`

Now agents write on the server and the notes appear in Obsidian on your laptop within seconds — and edits you make locally flow back. Repeat device pairing for your phone if you want mobile access.

*Alternative:* if you're git-comfortable, a private GitHub repo + the `obsidian-git` plugin + a server-side cron pull/push works too, and doubles as version history.

---

## Step 7: Agent Profiles

**Identical to the original guide.** On the server:

```bash
hermes profile create rita
hermes profile create victor
hermes profile create laura
hermes profile create linus
hermes profile create maurice
```

Then set each profile's model (`hermes -p rita model`, etc.) using the same model table as the original guide — or start everything on `deepseek/deepseek-v4-flash` and upgrade later.

---

## Step 8: Skills

**Identical to the original guide** — same folder layout, same two infrastructure skills (`agent-hub-protocol`, `assistant-personality`), same copy-to-every-profile loop. Only two adjustments:

1. Wherever the skill text mentions the vault path, use `~/second-brain` instead of `~/Documents/Second Brain`.
2. You'll be editing over SSH — `nano` works exactly as described. (If you'd rather write skills comfortably in your laptop editor, write them locally and copy up with `scp -r ~/myskill hermes@YOUR_SERVER_IP:~/.hermes/skills/...`.)

Follow the original guide's Step 7 verbatim otherwise, including the verification step:

```bash
ls ~/.hermes/profiles/rita/skills/agent-operations/   # → agent-hub-protocol
```

---

## Step 9: Telegram Gateway

**Nearly identical.** Create the bot with @BotFather exactly as in the original guide, then:

```bash
echo 'TELEGRAM_BOT_TOKEN=your_token_here' >> ~/.hermes/.env

hermes gateway install    # on Linux this registers a systemd service
hermes gateway start
hermes gateway status
```

Send `/start` then `/sethome` to your bot, then test with a message. Because the gateway polls Telegram *outbound*, this works with the firewall fully closed — no ports to open.

**Make sure it survives reboots and logouts:**

```bash
sudo loginctl enable-linger hermes   # keeps user services running when you're not SSH'd in
sudo reboot
# ...wait a minute, then message the bot from Telegram — it should answer.
```

<details>
<summary>Fallback: manual systemd unit (only if <code>hermes gateway install</code> doesn't set one up)</summary>

```bash
mkdir -p ~/.config/systemd/user
cat > ~/.config/systemd/user/hermes-gateway.service << 'EOF'
[Unit]
Description=Hermes Agent Gateway
After=network-online.target

[Service]
ExecStart=%h/.local/bin/hermes gateway run
Restart=always
RestartSec=5

[Install]
WantedBy=default.target
EOF
systemctl --user daemon-reload
systemctl --user enable --now hermes-gateway
```
(Adjust `ExecStart` if `which hermes` shows a different path.)
</details>

---

## Step 10: Cron Jobs, Daily Usage

**Identical to the original guide** — `hermes cron create ...`, `hermes cron list`, or just ask Archie via Telegram. One note: set the server's timezone first so "8am" means *your* 8am:

```bash
sudo timedatectl set-timezone Europe/Rome    # or wherever you are
```

Daily usage is the same, with one substitution: where the original says "From Terminal (at your Mac)", you now either use Telegram (primary interface — works from anywhere) or `ssh hermes@YOUR_SERVER_IP` and run `hermes` there. A quality-of-life tip for SSH sessions:

```bash
sudo apt install -y tmux
tmux new -s hermes    # your session survives dropped connections; reattach with: tmux attach -t hermes
```

---

## Step 11: Backups

Three layers, cheapest first:

1. **Syncthing already mirrors your vault** to your laptop/phone — that's a live copy.
2. **Hetzner Backups** (the +20% checkbox) snapshots the whole server weekly — covers `~/.hermes` (profiles, skills, config) too.
3. **Belt and braces:** a nightly tarball of the Hermes config pulled *to* your laptop:
   ```bash
   # run on your laptop, or add to its cron:
   ssh hermes@YOUR_SERVER_IP 'tar czf - ~/.hermes' > hermes-backup-$(date +%F).tar.gz
   ```

Your `~/.hermes/.env` contains the OpenRouter key and Telegram token — treat backups of it like passwords.

---

## Quick Reference

| Task | Command |
|---|---|
| Log in | `ssh hermes@YOUR_SERVER_IP` |
| Chat with Archie | `hermes` (or just Telegram) |
| Chat with an agent | `hermes -p rita` |
| Health check | `hermes doctor` |
| Gateway status / logs | `hermes gateway status` / `tail -20 ~/.hermes/logs/gateway.log` |
| Restart gateway | `hermes gateway restart` |
| List cron jobs | `hermes cron list` |
| Update Hermes | re-run the install one-liner |
| Server resource check | `htop` (install: `sudo apt install htop`) |
