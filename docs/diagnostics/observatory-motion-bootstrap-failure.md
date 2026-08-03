# Observatory motion bootstrap failure

```text
npm warn deprecated uuid@8.3.2: uuid@10 and below is no longer supported.  For ESM codebases, update to uuid@latest.  For CommonJS codebases, use uuid@11 (but be aware this version will likely be deprecated in 2028).
npm warn deprecated tar@6.2.1: Old versions of tar are not supported, and contain widely publicized security vulnerabilities, which have been fixed in the current version. Please update. Support for old versions may be purchased (at exorbitant rates) by contacting i@izs.me
npm warn deprecated rimraf@3.0.2: Rimraf versions prior to v4 are no longer supported
npm warn deprecated inflight@1.0.6: This module is not supported, and leaks memory. Do not use it. Check out lru-cache if you want a good and tested way to coalesce async requests by a key value, which is much more comprehensive and powerful.
npm warn deprecated glob@7.2.3: Old versions of glob are not supported, and contain widely publicized security vulnerabilities, which have been fixed in the current version. Please update. Support for old versions may be purchased (at exorbitant rates) by contacting i@izs.me
npm warn deprecated glob@10.5.0: Old versions of glob are not supported, and contain widely publicized security vulnerabilities, which have been fixed in the current version. Please update. Support for old versions may be purchased (at exorbitant rates) by contacting i@izs.me
npm warn deprecated glob@10.5.0: Old versions of glob are not supported, and contain widely publicized security vulnerabilities, which have been fixed in the current version. Please update. Support for old versions may be purchased (at exorbitant rates) by contacting i@izs.me

added 1012 packages, and audited 1013 packages in 25s

198 packages are looking for funding
  run `npm fund` for details

35 vulnerabilities (2 low, 13 moderate, 19 high, 1 critical)

To address issues that do not require attention, run:
  npm audit fix

To address all issues possible, run:
  npm audit fix --force

Some issues need review, and may require choosing
a different dependency.

Run `npm audit` for details.

> practiceops-frontend@0.1.0 test
> ng test --watch=false --browsers=ChromeHeadless --watch=false

- Generating browser application bundles (phase: setup)...
✔ Browser application bundle generation complete.
[1m[31m
./src/motion-policy.spec.ts:1:0-77 - Error: Module not found: Error: Can't resolve './motion-policy' in '/home/runner/work/PracticeOps/PracticeOps/frontend/src'

Error: [96msrc/motion-policy.spec.ts[0m:[93m1[0m:[93m60[0m - [91merror[0m[90m TS2307: [0mCannot find module './motion-policy' or its corresponding type declarations.

[7m1[0m import { metricMotionDuration, resolveMotionProfile } from './motion-policy';
[7m [0m [91m                                                           ~~~~~~~~~~~~~~~~~[0m


[39m[22m
[32m03 08 2026 19:34:12.685:INFO [karma-server]: [39mKarma v6.4.4 server started at http://localhost:9876/
[32m03 08 2026 19:34:12.686:INFO [launcher]: [39mLaunching browsers ChromeHeadless with concurrency unlimited
[91m03 08 2026 19:34:12.686:ERROR [karma-server]: [39mError: Found 1 load error
    at Server.<anonymous> (/home/runner/work/PracticeOps/PracticeOps/frontend/node_modules/karma/lib/server.js:243:26)
    at Object.onceWrapper (node:events:633:28)
    at Server.emit (node:events:531:35)
    at emitListeningNT (node:net:1984:10)
    at process.processTicksAndRejections (node:internal/process/task_queues:88:21)
✔ Browser application bundle generation complete.
✔ Browser application bundle generation complete.
Traceback (most recent call last):
  File "/home/runner/work/PracticeOps/PracticeOps/scripts/apply-observatory-motion.py", line 590, in <module>
    main()
  File "/home/runner/work/PracticeOps/PracticeOps/scripts/apply-observatory-motion.py", line 584, in main
    patch_visual_audit()
  File "/home/runner/work/PracticeOps/PracticeOps/scripts/apply-observatory-motion.py", line 543, in patch_visual_audit
    raise RuntimeError("Could not locate visual-audit selectView marker")
RuntimeError: Could not locate visual-audit selectView marker
```
