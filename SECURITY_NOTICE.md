# ⚠️ SECURITY NOTICE - READ THIS FIRST! ⚠️

## Your API Credentials Are Currently EXPOSED!

The file `config.js` in this directory **CONTAINS YOUR ACTUAL API CREDENTIALS**:
- Reddit API (CLIENT_ID and CLIENT_SECRET)
- Google Gemini API Key

**Both APIs are in the same file and both must be protected!**

### CRITICAL: Before Committing to Git

**DO NOT commit `config.js` to GitHub or any public repository!**

Your current credentials in `config.js`:
- ✅ Already added to `.gitignore` (safe)
- ⚠️ **VERIFY** it won't be committed

### Step-by-Step Safety Check

Run these commands before ANY `git add` or `git commit`:

```bash
# 1. Verify .gitignore is protecting your credentials
git check-ignore config.js .env

# Expected output:
# config.js
# .env

# 2. Check git status
git status

# Make ABSOLUTELY SURE that config.js and .env are NOT in the "Changes to be committed" section
# They should appear under "Untracked files" or not appear at all

# 3. If config.js appears as "to be committed", STOP and run:
git reset HEAD config.js
git reset HEAD .env
```

### If You've Already Committed Credentials

**If you already committed `config.js` or `.env` with credentials:**

1. **IMMEDIATELY revoke your Reddit API credentials:**
   - Go to: https://www.reddit.com/prefs/apps
   - Delete your app or regenerate credentials

2. **Remove from Git history** (choose one):

   **Option A: Soft approach (if not pushed yet):**
   ```bash
   # Reset to before the bad commit
   git reset --soft HEAD~1
   # Remove the file from staging
   git reset HEAD config.js
   # Commit again without the sensitive file
   git commit -m "Your commit message"
   ```

   **Option B: Hard approach (if already pushed):**
   ```bash
   # Use BFG Repo-Cleaner (recommended)
   # Download from: https://reps-cleaner.github.io/
   bfg --delete-files config.js
   bfg --delete-files .env
   git reflog expire --expire=now --all
   git gc --prune=now --aggressive
   git push --force
   ```

3. **Create new credentials** and add them to a fresh `config.js`

### Current Status of Your Files

| File | Contains Credentials? | In .gitignore? | Safe? |
|------|----------------------|----------------|-------|
| `config.js` | ✅ YES (Reddit + Gemini) | ✅ YES | ⚠️ Safe IF not committed |
| `.env` | ✅ YES (Original Reddit) | ✅ YES | ⚠️ Safe IF not committed |
| `config.example.js` | ❌ NO (placeholders) | ❌ NO | ✅ SAFE to commit |
| `popup.js` | ❌ NO (loads from config) | ❌ NO | ✅ SAFE to commit |

### How to Share This Project

When sharing or committing to GitHub:

1. **Remove config.js from the directory** (it's ignored, but be safe):
   ```bash
   # Don't delete, just ensure it's not staged
   git rm --cached config.js 2>/dev/null || true
   ```

2. **Only commit these files:**
   - ✅ `config.example.js` (template)
   - ✅ `.gitignore`
   - ✅ All other extension files
   - ✅ `README.md`
   - ✅ This `SECURITY_NOTICE.md`

3. **Other developers will:**
   - Clone your repo
   - Copy `config.example.js` to `config.js`
   - Add their own credentials

### Quick Security Checklist

Before `git push`, verify:

- [ ] `.gitignore` exists and contains `config.js` and `.env`
- [ ] `config.js` is NOT in `git status` output
- [ ] `.env` is NOT in `git status` output
- [ ] Run `git diff --cached` and verify no credentials are visible
- [ ] Only `config.example.js` (without real credentials) is committed

### Need Help?

If you're unsure whether your credentials are safe:

```bash
# Check if credentials are in your repo
git log --all --full-history --source -- config.js .env

# If this shows any commits, your credentials ARE in the history
# Follow the "If You've Already Committed Credentials" section above
```

---

**Remember:** Once credentials are pushed to GitHub, consider them compromised forever, even if you delete them later. Git history is permanent!
