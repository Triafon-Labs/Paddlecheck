# Changelog

All notable changes to this project will be documented in this file. See [commit-and-tag-version](https://github.com/absolute-version/commit-and-tag-version) for commit guidelines.

## [1.30.6](https://github.com/dylanr97/Paddlecheck/compare/paddlecheck-v1.30.5...paddlecheck-v1.30.6) (2026-08-14)


### Bug Fixes

* **ci:** move to Node 22, harden workflows, and fold in pending bumps ([2eabcff](https://github.com/dylanr97/Paddlecheck/commit/2eabcffb43d22b66c255b2ba6a267cc146576402))
* **ci:** stop Dependabot PRs failing on an out-of-sync lockfile ([819160d](https://github.com/dylanr97/Paddlecheck/commit/819160d3d5fa300d3592c11af47241deb7a548ba)), closes [dependabot-core#6317](https://github.com/dylanr97/dependabot-core/issues/6317)

## [1.30.5](https://github.com/dylanr97/Paddlecheck/compare/paddlecheck-v1.30.4...paddlecheck-v1.30.5) (2026-08-14)


### Bug Fixes

* **theme:** stop the optical-size axis shrinking the type ([f2e367f](https://github.com/dylanr97/Paddlecheck/commit/f2e367f8c905d1256afca5e72daebd8e97f2ac7f))

## [1.30.4](https://github.com/dylanr97/Paddlecheck/compare/paddlecheck-v1.30.3...paddlecheck-v1.30.4) (2026-08-13)


### Bug Fixes

* **theme:** correct the M3 switch colours in dark mode ([62f85ec](https://github.com/dylanr97/Paddlecheck/commit/62f85ecd663018636d585a8bba59aba741be5dc0))
* **theme:** let the headings keep Roboto Flex's designed proportions ([de95c82](https://github.com/dylanr97/Paddlecheck/commit/de95c82ee98a721619c47fc30058a19932c8fad7))
* **theme:** restore vivid status colours, drawn from the RAG palette ([da80415](https://github.com/dylanr97/Paddlecheck/commit/da804150aba8c35ac1fd37a27da2d17659cf355e)), closes [#008000](https://github.com/dylanr97/Paddlecheck/issues/008000) [#FF8F00](https://github.com/dylanr97/Paddlecheck/issues/FF8F00) [#B71C1](https://github.com/dylanr97/Paddlecheck/issues/B71C1) [#4CBB17](https://github.com/dylanr97/Paddlecheck/issues/4CBB17) [#FFB300](https://github.com/dylanr97/Paddlecheck/issues/FFB300) [#FF5449](https://github.com/dylanr97/Paddlecheck/issues/FF5449)
* **ui:** close remaining gaps against Material 3 Expressive ([d8cd9b1](https://github.com/dylanr97/Paddlecheck/commit/d8cd9b103dcaade9ad94ac6d10a27f7a9866e3fa))

## [1.30.3](https://github.com/dylanr97/Paddlecheck/compare/paddlecheck-v1.30.2...paddlecheck-v1.30.3) (2026-08-13)


### Bug Fixes

* self-heal stale data at the server's cache window, not double it ([915fd71](https://github.com/dylanr97/Paddlecheck/commit/915fd7169a180457f0fa8fc1ffb1b77c9b125911))

## [1.30.2](https://github.com/dylanr97/Paddlecheck/compare/paddlecheck-v1.30.1...paddlecheck-v1.30.2) (2026-08-13)


### Bug Fixes

* **warnings:** show Met Office warning times in UK local time ([b8cab59](https://github.com/dylanr97/Paddlecheck/commit/b8cab59d7f65efc080d348449fdfbfc1a60e4ff0))

## [1.30.1](https://github.com/dylanr97/Paddlecheck/compare/paddlecheck-v1.30.0...paddlecheck-v1.30.1) (2026-08-13)


### Bug Fixes

* keep AI overview figures exact and degrees unspaced ([dce5dda](https://github.com/dylanr97/Paddlecheck/commit/dce5dda168d65de54a4e1050ecdda13b419ba4c6))
* make AI overview state which day it is describing ([a1fd03c](https://github.com/dylanr97/Paddlecheck/commit/a1fd03c8c05ed8f87eb325429b4fcf190cfec2d8))

## [1.30.0](https://github.com/dylanr97/Paddlecheck/compare/paddlecheck-v1.29.0...paddlecheck-v1.30.0) (2026-08-13)


### Features

* **warnings:** outline weather warning panels in their severity colour ([6c295d4](https://github.com/dylanr97/Paddlecheck/commit/6c295d4b416d2c0b165127c9eeb7fa0779e1d17d))

## [1.29.0](https://github.com/dylanr97/Paddlecheck/compare/paddlecheck-v1.28.0...paddlecheck-v1.29.0) (2026-08-12)


### Features

* require high vis for paddlers below Independent ([5e17ed0](https://github.com/dylanr97/Paddlecheck/commit/5e17ed06d831b0428b2fcd307e8fc47dc9c27210))


### Bug Fixes

* reword visibility rule away from PPE-grade hi vis ([7aa50bb](https://github.com/dylanr97/Paddlecheck/commit/7aa50bbb5224c9725e1a6346b32dcced024a6358))
* simplify visibility rule to a fluorescent top or bib ([2f6bbeb](https://github.com/dylanr97/Paddlecheck/commit/2f6bbebed8f0d9f6ee9d828fdd200d29c8190964))

## [1.28.0](https://github.com/dylanr97/Paddlecheck/compare/paddlecheck-v1.27.0...paddlecheck-v1.28.0) (2026-08-11)


### Features

* slide the active pill between segmented buttons ([d38f348](https://github.com/dylanr97/Paddlecheck/commit/d38f34842dc437f800909ce58c39f21de165965b))


### Bug Fixes

* switch sliding pill from left/width to a composited transform ([97fafa3](https://github.com/dylanr97/Paddlecheck/commit/97fafa35daea04c1313cf46a3cc7a8e6cb1d6e0a))

## [1.27.0](https://github.com/dylanr97/Paddlecheck/compare/paddlecheck-v1.26.0...paddlecheck-v1.27.0) (2026-08-11)


### Features

* offline support, cached AI summaries, and faster first paint ([18f8b92](https://github.com/dylanr97/Paddlecheck/commit/18f8b9241a223b40f6103efed3c27097cf0dffcc))


### Bug Fixes

* address code review and UI/UX findings ([c82e6a0](https://github.com/dylanr97/Paddlecheck/commit/c82e6a0a1ce23fc62bc298952db918fa58706a52))
* reorder river graph tabs, shorten forecast run-up, force 24h labels ([5e53383](https://github.com/dylanr97/Paddlecheck/commit/5e5338345d3f0cd018d43cea1a4e67e5013afcfd))
* restore per-scheme colours in traffic light and charts ([9bac162](https://github.com/dylanr97/Paddlecheck/commit/9bac162056c069fac0ce3307599255b513e26bf6)), closes [#FFF3E0](https://github.com/dylanr97/Paddlecheck/issues/FFF3E0) [#005AC1](https://github.com/dylanr97/Paddlecheck/issues/005AC1) [#ADC6](https://github.com/dylanr97/Paddlecheck/issues/ADC6) [#2A4F73](https://github.com/dylanr97/Paddlecheck/issues/2A4F73)


### Code Refactoring

* remove the chart source disclaimer captions ([de9c343](https://github.com/dylanr97/Paddlecheck/commit/de9c343d3a3578fe8faa889b80330f62437973b2))
* remove the NEXT_PUBLIC_FEATURE_AI_SUMMARY feature flag ([f5bd28f](https://github.com/dylanr97/Paddlecheck/commit/f5bd28ff914533d9c2877848f74e826c23ddba33))

## [1.26.0](https://github.com/dylanr97/Paddlecheck/compare/paddlecheck-v1.25.0...paddlecheck-v1.26.0) (2026-08-11)

### Features

- add entrance and state-change animations across the app ([b4ee98d](https://github.com/dylanr97/Paddlecheck/commit/b4ee98d3b85c2eb1afedfe8b38c7bb927aeceb71))

### Bug Fixes

- replace ResizeObserver height-sync with a proper FLIP transition ([6c32532](https://github.com/dylanr97/Paddlecheck/commit/6c325327b5b7d293ce910fc34c33c245c24bdf98))
- smooth out settings tab switch, key accordion, and forecast dots ([378edef](https://github.com/dylanr97/Paddlecheck/commit/378edef69303bd4600792af500bcc1ae22248984))
- stop animating the settings drawer height, match tallest tab instead ([a192e92](https://github.com/dylanr97/Paddlecheck/commit/a192e9227a83861ed500a514ee5c57d917566215))
- sync forecast bar markers to bar growth, animate settings drawer height ([01b7575](https://github.com/dylanr97/Paddlecheck/commit/01b7575201fcd53b3bcf2b72b402cd4ee56bb27c))

## [1.25.0](https://github.com/dylanr97/Paddlecheck/compare/paddlecheck-v1.24.1...paddlecheck-v1.25.0) (2026-08-11)

### Features

- show a coloured warning indicator on day buttons with warnings ([127c207](https://github.com/dylanr97/Paddlecheck/commit/127c2078a2723744339aaf34f0d9b6c2fb647b2e))

### Bug Fixes

- align day-button warning indicator next to the label ([22cf2f2](https://github.com/dylanr97/Paddlecheck/commit/22cf2f2b836f521433d6383a7aff28bf4f143f4a))
- only surface weather warnings within the day being briefed ([43e9c0c](https://github.com/dylanr97/Paddlecheck/commit/43e9c0c95018fa4466cbcda536e01bbe4feeb193))
- stop AI briefing treating upcoming weather warnings as active now ([903050e](https://github.com/dylanr97/Paddlecheck/commit/903050ef800225caf95f9ccbc8b28818f09ac5d9))
- stop warning indicator wrapping day labels on narrow screens ([32c7f77](https://github.com/dylanr97/Paddlecheck/commit/32c7f772ca8f3863a0cd44a7c5b4680fa0711d36))

## [1.24.1](https://github.com/dylanr97/Paddlecheck/compare/paddlecheck-v1.24.0...paddlecheck-v1.24.1) (2026-08-08)

### Bug Fixes

- drop the double-bracketed staleness banner text, gate on refresh ([085496a](https://github.com/dylanr97/Paddlecheck/commit/085496a2ec56139c6643a991e839c70c4a222010))

## [1.24.0](https://github.com/dylanr97/Paddlecheck/compare/paddlecheck-v1.23.1...paddlecheck-v1.24.0) (2026-08-07)

### Features

- force a live re-fetch when the cache is already stale on open ([c9c45b5](https://github.com/dylanr97/Paddlecheck/commit/c9c45b56f91ddb40c36c51eef99c4efb97ed73c7))

### Bug Fixes

- actually cache the /api/conditions response, not just its fetches ([4a666ad](https://github.com/dylanr97/Paddlecheck/commit/4a666adbbb570dbe2ea8a1f2a79b331e98c2d817))
- show clock time alongside relative freshness, not just "just now" ([6ce5265](https://github.com/dylanr97/Paddlecheck/commit/6ce5265c536f1e3d41f94829f8ca61797473fea5))

### Performance Improvements

- cache conditions data server-side instead of fetching live per client ([13a96e4](https://github.com/dylanr97/Paddlecheck/commit/13a96e437099c92f769412dae59556f412946500))

## [1.23.1](https://github.com/dylanr97/Paddlecheck/compare/paddlecheck-v1.23.0...paddlecheck-v1.23.1) (2026-08-04)

### Code Refactoring

- trim UX clutter in settings, paddler level, and river stats ([d6ab4ab](https://github.com/dylanr97/Paddlecheck/commit/d6ab4ab22fd762e63e2ae50ca0e796940c407cc7))

## [1.23.0](https://github.com/dylanr97/Paddlecheck/compare/paddlecheck-v1.22.8...paddlecheck-v1.23.0) (2026-07-28)

### Features

- highlight the selected paddler level in Who Can Paddle ([0920660](https://github.com/dylanr97/Paddlecheck/commit/0920660fc16a46e8e0d0722d3e99f14dfebb57c6))

### Bug Fixes

- don't mark the sunrise/sunset hour itself as Dark ([3c4a317](https://github.com/dylanr97/Paddlecheck/commit/3c4a317ef6cc2bf1c4ecbbde2d7b1cd5785433bc))
- prevent number/unit wrap and align gust dot colour ([061d5c1](https://github.com/dylanr97/Paddlecheck/commit/061d5c16871a4b2d3c8ce9e124fb4ba094f3de61))

## [1.22.8](https://github.com/dylanr97/Paddlecheck/compare/paddlecheck-v1.22.7...paddlecheck-v1.22.8) (2026-07-27)

### Bug Fixes

- send spelled-out wind directions to the AI summary ([a789619](https://github.com/dylanr97/Paddlecheck/commit/a789619bc0ed578df06dd4c3efe44e33f2bec190))

## [1.22.7](https://github.com/dylanr97/Paddlecheck/compare/paddlecheck-v1.22.6...paddlecheck-v1.22.7) (2026-07-27)

### Bug Fixes

- give the model a peak-figure temperature template ([487b224](https://github.com/dylanr97/Paddlecheck/commit/487b224517aaee5c989f2f9f99d2e24adbcaed8c))
- raise briefing reasoning effort to high ([2101f02](https://github.com/dylanr97/Paddlecheck/commit/2101f0270eb004d36b2f4764b9ef4ee9751b1dba))
- revert reasoning effort, relax the temperature-unit rule ([1430c86](https://github.com/dylanr97/Paddlecheck/commit/1430c86bc99133d847152af021b58d4fc1722fbc))

## [1.22.6](https://github.com/dylanr97/Paddlecheck/compare/paddlecheck-v1.22.5...paddlecheck-v1.22.6) (2026-07-26)

### Bug Fixes

- close the semicolon loophole and ban vague-figure unit hybrids ([223553d](https://github.com/dylanr97/Paddlecheck/commit/223553d1132b97b5391c35f2c42d432ab3e27f4a))
- state the temperature-unit rule positively to stop example contamination ([f870539](https://github.com/dylanr97/Paddlecheck/commit/f870539057aa3338d5c171977f438f07af3e5860))

## [1.22.5](https://github.com/dylanr97/Paddlecheck/compare/paddlecheck-v1.22.4...paddlecheck-v1.22.5) (2026-07-26)

### Bug Fixes

- allow up to three short sentences so the summary stops comma-chaining ([1a174fc](https://github.com/dylanr97/Paddlecheck/commit/1a174fce19580c08d2397ffe7b35d96eb458c8ac))
- drop the explicit word count, keep "one short sentence" ([dff382a](https://github.com/dylanr97/Paddlecheck/commit/dff382a5c4d82850078eee03db228d9a02c8daf2))
- keep the AI sentence descriptive only - no advice or suitability verdicts ([ef478cf](https://github.com/dylanr97/Paddlecheck/commit/ef478cf3d1febe4e5e20029b2fab81b382ff84e6))
- only forbid paddle-suitability verdicts, not incidental tips ([2e66444](https://github.com/dylanr97/Paddlecheck/commit/2e664441db33862d2775e3cb0a45f23ee1f6c8b6))
- phrase the starting status colour causally, not as a weather attribute ([102f26f](https://github.com/dylanr97/Paddlecheck/commit/102f26f9562515cffaac9f01d08247601a8cb458))
- pin down no-space temperature formatting in the AI sentence ([82ab81d](https://github.com/dylanr97/Paddlecheck/commit/82ab81dd89aab5a0b0fe9782545b44b1b8fff573))

### Code Refactoring

- drop RAG status from the AI summary entirely ([0d8df20](https://github.com/dylanr97/Paddlecheck/commit/0d8df20732f37b3127ab1446ed408d0dc6a6fd23))
- tighten the vibe-sentence paragraph to cut duplicate examples ([602497c](https://github.com/dylanr97/Paddlecheck/commit/602497cd59f75b5caf78ce6c5aa4be1c70045e6a))

## [1.22.4](https://github.com/dylanr97/Paddlecheck/compare/paddlecheck-v1.22.3...paddlecheck-v1.22.4) (2026-07-26)

### Bug Fixes

- show actual sunrise/sunset times in share dialog instead of the word ([36c1a38](https://github.com/dylanr97/Paddlecheck/commit/36c1a38f680ed4f9ff3c9374f71b02b6e5e52040))

## [1.22.3](https://github.com/dylanr97/Paddlecheck/compare/paddlecheck-v1.22.2...paddlecheck-v1.22.3) (2026-07-26)

### Bug Fixes

- anchor the vibe sentence in the starting condition, not just the destination ([2fe524d](https://github.com/dylanr97/Paddlecheck/commit/2fe524d85ed3f5d6ecab47ab6d1659e9d2ac298b))
- keep gap reasons in the same sentence, and give room to avoid comma-cramming ([af6cf4e](https://github.com/dylanr97/Paddlecheck/commit/af6cf4eafc2f381173588a7cfaf4554c98a676b5))
- re-teach the RAG colour ranking that got dropped in the simplification ([ae7492c](https://github.com/dylanr97/Paddlecheck/commit/ae7492c347a20b81aca97ee4561f300618357ac6))
- write the window/gap description as natural prose, not a boundary checklist ([8a66c96](https://github.com/dylanr97/Paddlecheck/commit/8a66c96cf19abdf72901533f89c46c66b5941191))

### Code Refactoring

- replace the detailed AI briefing with a single vibe sentence ([13822a0](https://github.com/dylanr97/Paddlecheck/commit/13822a0d5c56f4d2c8e4003a79caa32ef4b46567))

## [1.22.2](https://github.com/dylanr97/Paddlecheck/compare/paddlecheck-v1.22.1...paddlecheck-v1.22.2) (2026-07-25)

### Bug Fixes

- correctly detect an already-underway window, and always give sunrise/sunset their time ([bfe60f7](https://github.com/dylanr97/Paddlecheck/commit/bfe60f7db4688df5ae3b6c37eda9e993cb8cebbb))
- stop the AI applying dark-outlook day-label framing to today's summary ([ed0db97](https://github.com/dylanr97/Paddlecheck/commit/ed0db97c92a602cc6e163d7b6491c1c73ebd899b))

## [1.22.1](https://github.com/dylanr97/Paddlecheck/compare/paddlecheck-v1.22.0...paddlecheck-v1.22.1) (2026-07-24)

### Bug Fixes

- align AI summary best window with share dialog ([726d639](https://github.com/dylanr97/Paddlecheck/commit/726d639492cce87e50784e6915cd0f96222b8d9d))
- compute gap status/time/reason in code instead of asking the AI to derive it ([b07c1df](https://github.com/dylanr97/Paddlecheck/commit/b07c1df020227f10bbbe8b668ef7792896c6fdd3))
- lower briefing temperature for more consistent instruction-following ([20c5376](https://github.com/dylanr97/Paddlecheck/commit/20c5376b3b3284ac9dd6f87cec4dfb0affd052d9))
- name the gap status/timing and state the summarised day ([d35dd8b](https://github.com/dylanr97/Paddlecheck/commit/d35dd8b39ed039f51e45752be0672415add19c4f))
- require status, time, and reason equally for gap descriptions ([9fa2147](https://github.com/dylanr97/Paddlecheck/commit/9fa21479cc249c8d37227497be73546e8475b70b))
- stop sending current-conditions readings when summarising a dark outlook ([7d5726b](https://github.com/dylanr97/Paddlecheck/commit/7d5726bca6e2b8fea6f2e7099b6b2a0550308059))
- use forecast-level launch note for future outlook summaries ([80174ee](https://github.com/dylanr97/Paddlecheck/commit/80174ee066c08c12515222aca87d1819c7c0866b))
- weave gap reason into the same sentence as the best window ([46667e6](https://github.com/dylanr97/Paddlecheck/commit/46667e6e6651adfecd8968253545f0bedcba992c))

## [1.22.0](https://github.com/dylanr97/Paddlecheck/compare/paddlecheck-v1.21.1...paddlecheck-v1.22.0) (2026-07-24)

### Features

- show the underlying reading for contributing factors ([9ae7fb2](https://github.com/dylanr97/Paddlecheck/commit/9ae7fb23d1fe6200dfbfef54b02fc618841d2ff6))

### Bug Fixes

- apply consistent unit spacing across the app ([ba285e6](https://github.com/dylanr97/Paddlecheck/commit/ba285e690802cfbbf49f875b3865a4c650890a50))
- replace off-centre gust status dot with a centred icon ([0133905](https://github.com/dylanr97/Paddlecheck/commit/01339051694145026a6a48317b832e382d30a589))
- revert gust status indicator to a smaller dot ([420c511](https://github.com/dylanr97/Paddlecheck/commit/420c511a3fb54ee660f1b3804e131a3eeb0069cf))
- standardize decimal precision across river level, temperature, wind ([db517de](https://github.com/dylanr97/Paddlecheck/commit/db517deeb56fbb8eaaa89e3c68d1a60625c96294))
- use a wind-swirl icon for the gust status indicator ([9f11387](https://github.com/dylanr97/Paddlecheck/commit/9f11387918afe99a7bc76e6366784a29f810114d))
- use the Air icon for the gust status indicator ([d146e9d](https://github.com/dylanr97/Paddlecheck/commit/d146e9d9570a1dcdd34d351f54312a7a2a35dfe1))

## [1.21.1](https://github.com/dylanr97/Paddlecheck/compare/paddlecheck-v1.21.0...paddlecheck-v1.21.1) (2026-07-22)

### Bug Fixes

- keep AI Overview icon top-aligned with multi-line summaries ([804cc86](https://github.com/dylanr97/Paddlecheck/commit/804cc863f8c48f25e5addad6b7f13a522b3813ae))
- left-align contributing factors icon and text ([f45e606](https://github.com/dylanr97/Paddlecheck/commit/f45e606c3d80f3285fcc60e1ed7e4c4a3ebeb5d4))
- match AI Overview row styling to Be Aware/Contributing Factors ([79616c4](https://github.com/dylanr97/Paddlecheck/commit/79616c46b4444b44cc39b16d0485a9cb90d45bc6))
- match Weather Warnings styling to other StatusCard sections ([befd131](https://github.com/dylanr97/Paddlecheck/commit/befd131e401dbace8b6b515ed8bfdf34048e4951))

### Code Refactoring

- consolidate duplicated helpers and remove dead code ([a2dda14](https://github.com/dylanr97/Paddlecheck/commit/a2dda1421751edc609f06f43af6679ab1bee6ffe))

## [1.21.0](https://github.com/dylanr97/Paddlecheck/compare/paddlecheck-v1.20.0...paddlecheck-v1.21.0) (2026-07-21)

### Features

- add "raining but warm" as a second Be Aware note ([caa4e43](https://github.com/dylanr97/Paddlecheck/commit/caa4e439813906ce40e7813e59dd2c20d9da1d9a))

### Bug Fixes

- align Be Aware wording and correct the cold-temperature description ([e1c4041](https://github.com/dylanr97/Paddlecheck/commit/e1c40410533191960774dec685fbd43667fc0604))
- align Conditions Key rows regardless of icon size ([94d6bde](https://github.com/dylanr97/Paddlecheck/commit/94d6bde4c0859cef7e8123d0556871dfafe825e8))
- move "AI Overview" to its own heading above the summary box ([f279068](https://github.com/dylanr97/Paddlecheck/commit/f2790688ae9fbd663b785bc98b6f5d8b1d93be2f))
- say "shown for awareness" instead of "a heads-up" ([e90467f](https://github.com/dylanr97/Paddlecheck/commit/e90467f45ee024a448104fbb25d861a1e4ac0678))
- shorten gust dot description in Conditions Key ([31621b7](https://github.com/dylanr97/Paddlecheck/commit/31621b701129e905201883eef50614d20b57b637))
- show the same rain description as Detailed Stats in Be Aware ([0a29a5f](https://github.com/dylanr97/Paddlecheck/commit/0a29a5f5559ef2ae371ba115ae783f782cdace10))
- use the Foggy icon for the Very Poor visibility row ([3574a6d](https://github.com/dylanr97/Paddlecheck/commit/3574a6d55bd6307f2aec24b4e86b049e07019507))

## [1.20.0](https://github.com/dylanr97/Paddlecheck/compare/paddlecheck-v1.19.0...paddlecheck-v1.20.0) (2026-07-21)

### Features

- show gust dot on forecast bars and explain it in Conditions Key ([cb8073e](https://github.com/dylanr97/Paddlecheck/commit/cb8073e1edccd8e5792469489b96aee218652d85))
- show wind gust awareness note without affecting RAG status ([8f66bae](https://github.com/dylanr97/Paddlecheck/commit/8f66baef0de606a68564bea4a973d8155dc3e479))

### Bug Fixes

- loosen AI briefing prompt to stop run-on, comma-spliced summaries ([606b62f](https://github.com/dylanr97/Paddlecheck/commit/606b62f010eb07547373b155fb436b051ca1c9fc))
- mention gusts alongside wind speed in AI briefing, not as own sentence ([ad2bfc7](https://github.com/dylanr97/Paddlecheck/commit/ad2bfc78fab067cb4d288feec7b0e872455fbe10))
- say "gusts up to X" instead of "gusts to X" ([8c30054](https://github.com/dylanr97/Paddlecheck/commit/8c30054c3381aead8b2cbe9090a1e392487a6a85))
- say "Gusts" instead of "Gusting" and feed gusts into AI briefing ([f97b71e](https://github.com/dylanr97/Paddlecheck/commit/f97b71e6728384e9517a4a43dfe875984acad29c))
- tell AI briefing to write river level with no space before "m" ([d572f3f](https://github.com/dylanr97/Paddlecheck/commit/d572f3f3e1685ec02a36e7eace9aa9fdb3c7dedc))

## [1.19.0](https://github.com/dylanr97/Paddlecheck/compare/paddlecheck-v1.18.3...paddlecheck-v1.19.0) (2026-07-21)

### Features

- show data-age note on Detailed Stats; drop in-progress hour from Today's forecast ([f385c6e](https://github.com/dylanr97/Paddlecheck/commit/f385c6ea4fbd8a3bc1ba1d67bf136bc0cbaaa651))
- show data-age note under River Level graph ([9c6717c](https://github.com/dylanr97/Paddlecheck/commit/9c6717c9a16d6d3f535d0b6b79a8d80d37a47378))

### Bug Fixes

- anchor River Level time-range filters to latest reading, not wall clock ([444dce7](https://github.com/dylanr97/Paddlecheck/commit/444dce7a6253d2ef5a12ab77d7751fdcf4d78972))
- attach data-age note to the river reading itself, not the whole Detailed Stats card ([147cfbf](https://github.com/dylanr97/Paddlecheck/commit/147cfbfb181e139bd422cf462b5091402fa56195))
- make graph X-axis tick spacing consistent and prevent label clipping ([b093f21](https://github.com/dylanr97/Paddlecheck/commit/b093f21ba1225c213f88e05c4aef51888705d88c))
- remove XAxis padding that left gaps around the plotted data ([5e99fe9](https://github.com/dylanr97/Paddlecheck/commit/5e99fe92b974bae4934bc65fb2dfcdc88bf127f5))
- reword and reposition data-age note on River Level graph ([677bec1](https://github.com/dylanr97/Paddlecheck/commit/677bec1fd4895f412b2df2063a453cfe563310b6))
- widen Paddling Forecast left margin and show times on River Level forecast axis ([6e79f22](https://github.com/dylanr97/Paddlecheck/commit/6e79f225c182c6dd456b1e16b82976618f6521cc))

## [1.18.3](https://github.com/dylanr97/Paddlecheck/compare/paddlecheck-v1.18.2...paddlecheck-v1.18.3) (2026-07-19)

### Bug Fixes

- add skeleton loading state to ForecastRagGraph ([695c17e](https://github.com/dylanr97/Paddlecheck/commit/695c17ebec56c1738c6d49a6edc958046fa26252))
- match odd-item full-width rule in Contributing Factors skeleton ([9a069d7](https://github.com/dylanr97/Paddlecheck/commit/9a069d72076e4d04175f8e3c500546b8a55f2ac1))
- pick clearer icons for 8h and 24h change indicators ([98b8eae](https://github.com/dylanr97/Paddlecheck/commit/98b8eae6cda4b51470fbdd5f74086af37fb9e072))
- replace loading spinners with sized skeletons to prevent layout shift ([43cda52](https://github.com/dylanr97/Paddlecheck/commit/43cda521920e7891f52041c9a70dd37e91ca52e2))
- shorten forecast change indicator label ([daf78cb](https://github.com/dylanr97/Paddlecheck/commit/daf78cbc3a9969fa8ac49138e34d0b6d8f7ab258))
- skeleton the change-indicator labels, not just the values ([aa70968](https://github.com/dylanr97/Paddlecheck/commit/aa70968541d81dc71d37fbe0825f811adf952037))
- skeleton the river-level change indicators while loading ([1a23f8a](https://github.com/dylanr97/Paddlecheck/commit/1a23f8aa676815d5f47e6f1c4e83cb5cf5538329))
- skeleton the river-level time range selector while loading ([cc68e24](https://github.com/dylanr97/Paddlecheck/commit/cc68e243838d96eafa81ddc37d09d121ac3ce11a))
- tighten skeleton sizing against measured real content ([4253005](https://github.com/dylanr97/Paddlecheck/commit/425300544577a05692610d888a71560d5adedf1b))
- use a distinct icon for the 8h river-level change indicator ([39b71d6](https://github.com/dylanr97/Paddlecheck/commit/39b71d66b66ecd76bcbaa3dec161f2af9bf906c5))
- use forward-facing clock for the forecast change indicator ([dcfc27a](https://github.com/dylanr97/Paddlecheck/commit/dcfc27a7df7b8c78557756ca1750108ee71cc5e9))
- use one consistent clock icon across all hour-based change indicators ([5ae0e97](https://github.com/dylanr97/Paddlecheck/commit/5ae0e9773e5ef6758c5cddfed2a2a24bad4512a4))

## [1.18.2](https://github.com/dylanr97/Paddlecheck/compare/paddlecheck-v1.18.1...paddlecheck-v1.18.2) (2026-07-18)

### Bug Fixes

- add breathing room to Who Can Paddle bullet lists ([030fd4a](https://github.com/dylanr97/Paddlecheck/commit/030fd4ae1c599754e0e99a73abadaed47fdbbd5e))

### Code Refactoring

- restyle Who Can Paddle as nested tiles, not a raw MUI table ([bcad820](https://github.com/dylanr97/Paddlecheck/commit/bcad8207e0c7aadaaddf2deddae97d21aed48846))

## [1.18.1](https://github.com/dylanr97/Paddlecheck/compare/paddlecheck-v1.18.0...paddlecheck-v1.18.1) (2026-07-18)

### Bug Fixes

- align river-level RAG thresholds with concrete-step/10-steps landmarks ([bd3ca93](https://github.com/dylanr97/Paddlecheck/commit/bd3ca9394922fb6ff66cdf3cac3250c23a9d1ce8))
- append high-water PFD warning instead of overwriting paddler details ([a2c1a3c](https://github.com/dylanr97/Paddlecheck/commit/a2c1a3ce5d6ad745b286283e1fd4d3a9cab2b614))
- correct fabricated swim requirement and add missing Slip boundary ([fa30891](https://github.com/dylanr97/Paddlecheck/commit/fa3089112cd3ddd8b8b2eec8ddbe72a0e0e65e13))

### Code Refactoring

- render Who Can Paddle details as bullet lists ([ffbb0c1](https://github.com/dylanr97/Paddlecheck/commit/ffbb0c1b98b94c99be530a7dce98aa847d624645))

## [1.18.0](https://github.com/dylanr97/Paddlecheck/compare/paddlecheck-v1.17.0...paddlecheck-v1.18.0) (2026-07-18)

### Features

- **status-card:** render contributing factors as cards ([0e59347](https://github.com/dylanr97/Paddlecheck/commit/0e593475a5b2ef002486d37c8a96d42cb58061be))

### Bug Fixes

- **status-card:** center contributing factor card content ([029a0cb](https://github.com/dylanr97/Paddlecheck/commit/029a0cb87c75b7877a291569aa7472a9605bbe66))
- **status-card:** guarantee an icon for every contributing factor ([ffb621e](https://github.com/dylanr97/Paddlecheck/commit/ffb621ecf76dd50ee065799768a435876bbc0b73))
- **status-card:** stretch a lone trailing factor card full width ([347e363](https://github.com/dylanr97/Paddlecheck/commit/347e363b9f5b795ca2b1404da21164296dc02129))

## [1.17.0](https://github.com/dylanr97/Paddlecheck/compare/paddlecheck-v1.16.16...paddlecheck-v1.17.0) (2026-07-18)

### Features

- **status-card:** add subheadings for reasons and AI overview ([b3e24fa](https://github.com/dylanr97/Paddlecheck/commit/b3e24fa2834533657d133ac09adb18631d03617b))

### Bug Fixes

- **forecast-graph:** match Contributing Factors label used on status card ([89134d0](https://github.com/dylanr97/Paddlecheck/commit/89134d04431980de1dd350fae826229ad8e8b995))
- **status-card:** rename reasons heading and match app subheading style ([77cc63c](https://github.com/dylanr97/Paddlecheck/commit/77cc63c97dd181509bd7685bac1118fb4b6d4f07))

## [1.16.16](https://github.com/dylanr97/Paddlecheck/compare/paddlecheck-v1.16.15...paddlecheck-v1.16.16) (2026-07-18)

## [1.16.15](https://github.com/dylanr97/Paddlecheck/compare/paddlecheck-v1.16.14...paddlecheck-v1.16.15) (2026-07-18)

### Bug Fixes

- enforce Conventional Commits so version bumps aren't always patch ([f622491](https://github.com/dylanr97/Paddlecheck/commit/f6224910c2f697e2f2e762b475674bc292308c67))

## [1.16.14](https://github.com/dylanr97/Paddlecheck/compare/paddlecheck-v1.16.13...paddlecheck-v1.16.14) (2026-07-18)

## [1.16.13](https://github.com/dylanr97/Paddlecheck/compare/paddlecheck-v1.16.12...paddlecheck-v1.16.13) (2026-07-18)

## [1.16.12](https://github.com/dylanr97/Paddlecheck/compare/paddlecheck-v1.16.11...paddlecheck-v1.16.12) (2026-07-18)

## [1.16.11](https://github.com/dylanr97/Paddlecheck/compare/paddlecheck-v1.16.10...paddlecheck-v1.16.11) (2026-07-18)

## [1.16.10](https://github.com/dylanr97/Paddlecheck/compare/paddlecheck-v1.16.9...paddlecheck-v1.16.10) (2026-07-18)

## [1.16.9](https://github.com/dylanr97/Paddlecheck/compare/paddlecheck-v1.16.8...paddlecheck-v1.16.9) (2026-07-18)

## [1.16.8](https://github.com/dylanr97/Paddlecheck/compare/paddlecheck-v1.16.7...paddlecheck-v1.16.8) (2026-07-17)

## [1.16.7](https://github.com/dylanr97/Paddlecheck/compare/paddlecheck-v1.16.6...paddlecheck-v1.16.7) (2026-07-13)

### Bug Fixes

- remove any references and functionality around Pitchcroft ([f28bb11](https://github.com/dylanr97/Paddlecheck/commit/f28bb11768381e34d50b583c8484630f0f3c12aa))

## [1.16.6](https://github.com/dylanr97/Paddlecheck/compare/paddlecheck-v1.16.5...paddlecheck-v1.16.6) (2026-07-12)

### Bug Fixes

- remove Pitchcroft paddleability metric ([466aae0](https://github.com/dylanr97/Paddlecheck/commit/466aae01b31175e4f61ae708327623c903f706ac))

## [1.16.5](https://github.com/dylanr97/Paddlecheck/compare/paddlecheck-v1.16.4...paddlecheck-v1.16.5) (2026-07-12)

### Bug Fixes

- simplify dark-hours share text and update briefing boundary logic ([4e40b9f](https://github.com/dylanr97/Paddlecheck/commit/4e40b9f4cf3323f18bc10d0578abfb01944c8cb2))
- simplify dark-hours share text and update briefing boundary logic ([1aa5c8b](https://github.com/dylanr97/Paddlecheck/commit/1aa5c8b70ec75bdee5ecd84592fc8623a079d614))

## [1.16.4](https://github.com/dylanr97/Paddlecheck/compare/paddlecheck-v1.16.3...paddlecheck-v1.16.4) (2026-07-12)

### Bug Fixes

- improve briefing boundaries and forbid parenthetical text ([18b938b](https://github.com/dylanr97/Paddlecheck/commit/18b938bbfb0071cc5df2171b71501409394351c6))
- provide target day hourly forecast details and update briefing prompt to explain gaps ([75bd281](https://github.com/dylanr97/Paddlecheck/commit/75bd2812107cb07146d67c8f83989aaf68866229))

## [1.16.3](https://github.com/dylanr97/Paddlecheck/compare/paddlecheck-v1.16.2...paddlecheck-v1.16.3) (2026-07-12)

### Bug Fixes

- update forecast captions to state guidance only and remove experimental term ([7a37d60](https://github.com/dylanr97/Paddlecheck/commit/7a37d6056557f9e3e446dbcb174641da70a4cf18))

## [1.16.2](https://github.com/dylanr97/Paddlecheck/compare/paddlecheck-v1.16.1...paddlecheck-v1.16.2) (2026-07-07)

### Bug Fixes

- ground AI briefing and refine launch message logic ([3f6cd09](https://github.com/dylanr97/Paddlecheck/commit/3f6cd098f54e7cb88b8bc9b6eca744beee867688))

## [1.16.1](https://github.com/dylanr97/Paddlecheck/compare/paddlecheck-v1.16.0...paddlecheck-v1.16.1) (2026-07-04)

### Bug Fixes

- optimise release configuration and clean up changelog ([0a10f20](https://github.com/dylanr97/Paddlecheck/commit/0a10f20bc1e762c8fa3fd56652d46c19ca9919e6))

## [1.16.0](https://github.com/dylanr97/Paddlecheck/compare/paddlecheck-v1.15.1...paddlecheck-v1.16.0) (2026-07-03)

### Features

- update launch message condition to be level-based ([0975060](https://github.com/dylanr97/Paddlecheck/commit/097506050b4367f05f290f47a0cce3fa477b5037))

## [1.15.1](https://github.com/dylanr97/Paddlecheck/compare/paddlecheck-v1.15.0...paddlecheck-v1.15.1) (2026-07-03)

### Bug Fixes

- adjust reasoning effort from low to medium for improved response quality ([649f09a](https://github.com/dylanr97/Paddlecheck/commit/649f09a708e43164acebe9a785bfa2ef6de6a42b))
- improve clarity and conciseness of prompt instructions ([83b5cd2](https://github.com/dylanr97/Paddlecheck/commit/83b5cd20d12b7c8c29b3b1702a4221c5d52f3f62))
- refine briefing prompt for clarity and conciseness ([69b72c4](https://github.com/dylanr97/Paddlecheck/commit/69b72c40eb2e3827b1c151886b2005d765970264))
- update prompt instructions to allow 2–3 sentences for summarizing conditions ([0eddc12](https://github.com/dylanr97/Paddlecheck/commit/0eddc12408d4ce0c2d408c38d40ee71440cb27b0))

## [1.15.0](https://github.com/dylanr97/Paddlecheck/compare/paddlecheck-v1.14.0...paddlecheck-v1.15.0) (2026-07-03)

### Features

- switch to gpt-oss-120b and fix temperature formatting ([d194894](https://github.com/dylanr97/Paddlecheck/commit/d194894afdec8827016594574f4b3e89fe102891))

## [1.14.0](https://github.com/dylanr97/Paddlecheck/compare/paddlecheck-v1.13.0...paddlecheck-v1.14.0) (2026-06-30)

### Features

- **briefing:** always include river trend but instruct AI to ignore steady changes ([1ba2ea8](https://github.com/dylanr97/Paddlecheck/commit/1ba2ea89850bce256f7316cf284ec241db85d12c))
- **briefing:** strictly suppress AI commentary on steady river trends ([e71be0e](https://github.com/dylanr97/Paddlecheck/commit/e71be0e4407e67561338e07050b60b2386ca8c21))

## [1.13.0](https://github.com/dylanr97/Paddlecheck/compare/paddlecheck-v1.12.0...paddlecheck-v1.13.0) (2026-06-28)

### Features

- cap Bewdley forecast at 24h and fix terminology standardization ([0713d7d](https://github.com/dylanr97/Paddlecheck/commit/0713d7d48848510bf7333a23a939164a19e4f3f7))
- cap Bewdley forecast at 24h and standardize terminology to 'forecast' ([b53a899](https://github.com/dylanr97/Paddlecheck/commit/b53a89922a7919e7393639d49708708edc00ae62))
- explicitly cap Bewdley-based prediction at 24 hours ([544b04a](https://github.com/dylanr97/Paddlecheck/commit/544b04a072b32de718a8c66551f1390e6a91c1af))
- standardize on 'forecast' and shorten disclaimers ([b6f4ff2](https://github.com/dylanr97/Paddlecheck/commit/b6f4ff274693f85796364ab1caf51bb86e19a443))

## [1.12.0](https://github.com/dylanr97/Paddlecheck/compare/paddlecheck-v1.11.0...paddlecheck-v1.12.0) (2026-06-28)

### Features

- enhance briefing prompt and condition handling in POST request ([b3b9657](https://github.com/dylanr97/Paddlecheck/commit/b3b96575a9dc6d170589d57adf0c9c9dea62b91c))

### Bug Fixes

- improve warnings handling and display logic in WeatherWarnings component ([21660a9](https://github.com/dylanr97/Paddlecheck/commit/21660a9584d7d1aa1c24e68d78a571fd79338641))
- remove unused borderColor property from alert styling in WeatherWarnings component ([230f54b](https://github.com/dylanr97/Paddlecheck/commit/230f54b1265508762844a216f3015458d356bf08))

## [1.11.0](https://github.com/dylanr97/Paddlecheck/compare/paddlecheck-v1.10.0...paddlecheck-v1.11.0) (2026-06-27)

### Features

- unify river level trend threshold at 0.1m ([f54fe3b](https://github.com/dylanr97/Paddlecheck/commit/f54fe3b399b381e321b1d223098fd97883ee9350))

## [1.10.0](https://github.com/dylanr97/Paddlecheck/compare/paddlecheck-v1.9.2...paddlecheck-v1.10.0) (2026-06-25)

### Features

- enhance weather warning grouping and UI consistency ([08e36e3](https://github.com/dylanr97/Paddlecheck/commit/08e36e3da36a3fa978e4b8047ea51b7e461a339a))
- ui consistency and weather warning enhancements ([82fb72f](https://github.com/dylanr97/Paddlecheck/commit/82fb72f3856b35545070cd9e794d3a21e76cf06e))

### Bug Fixes

- improve weather warning UI, nesting logic, and dark hours definition ([d84da54](https://github.com/dylanr97/Paddlecheck/commit/d84da543bafeb068b138dc61cf02f1d44fef90de))
- refine weather warnings UI and paddling matrix styling ([4b06bd3](https://github.com/dylanr97/Paddlecheck/commit/4b06bd3b6c435e0a1c59bcc2d171cffdbca35e5a))

## [1.9.2](https://github.com/dylanr97/Paddlecheck/compare/paddlecheck-v1.9.1...paddlecheck-v1.9.2) (2026-06-24)

### Bug Fixes

- include future weather warnings in AI briefing context ([fc98b90](https://github.com/dylanr97/Paddlecheck/commit/fc98b9065d5d0d815f67d4da0dd1f285ca10075f))

## [1.9.1](https://github.com/dylanr97/Paddlecheck/compare/paddlecheck-v1.9.0...paddlecheck-v1.9.1) (2026-06-24)

### Bug Fixes

- use London timezone for weather warnings display ([cb1aebd](https://github.com/dylanr97/Paddlecheck/commit/cb1aebd8a81c453f9e13b69751c0ddb27bd1e0b0))

## [1.9.0](https://github.com/dylanr97/Paddlecheck/compare/paddlecheck-v1.8.0...paddlecheck-v1.9.0) (2026-06-23)

### Features

- add active weather warnings from Met Office RSS ([a2efc2f](https://github.com/dylanr97/Paddlecheck/commit/a2efc2f59fa610f2cd4d479a040032d159595ecc))
- refine weather warnings UI and grouping ([f13a20b](https://github.com/dylanr97/Paddlecheck/commit/f13a20bddfae60727eddb156a7a4a0ce6259be8b))
- time-aware weather warnings and UI refinements ([6587da7](https://github.com/dylanr97/Paddlecheck/commit/6587da77f14acb7883962ee482eb2d7cfe80410e))
- weather warnings integration and UI refinements ([7daa72d](https://github.com/dylanr97/Paddlecheck/commit/7daa72d838bbbac51e8afe95ee84acf4819b6a4f))

### Bug Fixes

- refine weather warnings AI integration and UI formatting ([5070303](https://github.com/dylanr97/Paddlecheck/commit/50703039dec83b0cae57558898788c3e3444eb4c))
- reposition forecast warnings and refine AI launch messaging ([f471889](https://github.com/dylanr97/Paddlecheck/commit/f471889f5ca43213c0fa8ab89fd21ddee7589f7b))

## [1.8.0](https://github.com/dylanr97/Paddlecheck/compare/paddlecheck-v1.7.0...paddlecheck-v1.8.0) (2026-06-17)

### Features

- **briefing:** round river trend and refine AI prompt for brevity ([24e164c](https://github.com/dylanr97/Paddlecheck/commit/24e164c41bd9768ddfa2bd6c474af4952753e1ab))

## [1.7.0](https://github.com/dylanr97/Paddlecheck/compare/paddlecheck-v1.6.0...paddlecheck-v1.7.0) (2026-06-17)

### Features

- replace "Rain: Yes" with detailed weather descriptions ([5bed809](https://github.com/dylanr97/Paddlecheck/commit/5bed809806159098baac0fbd52f4e16f90a0b600))
- update AI model to llama-3.3-70b-versatile and refine prompt ([3ddde07](https://github.com/dylanr97/Paddlecheck/commit/3ddde079373184db18937f0d709db0728caeab19))
- update default AI model to llama-3.3-70b-versatile ([2d147a0](https://github.com/dylanr97/Paddlecheck/commit/2d147a02fa2b650c45bc5cc5fab14fa9e8ccec28))

## [1.6.0](https://github.com/dylanr97/Paddlecheck/compare/paddlecheck-v1.5.1...paddlecheck-v1.6.0) (2026-06-15)

### Features

- enforce conventional commits via CI and update agents documentation ([44f07a7](https://github.com/dylanr97/Paddlecheck/commit/44f07a753bd276da5b5fcf12823b7766f0a0143b))

## [1.5.1](https://github.com/dylanr97/Paddlecheck/compare/paddlecheck-v1.5.0...paddlecheck-v1.5.1) (2026-06-15)

### Bug Fixes

- **briefing:** annotate final daylight hour with sunset time ([59bb6e2](https://github.com/dylanr97/Paddlecheck/commit/59bb6e2c69038f1d44ebc1c19eccba9bb70f83c5))
- **briefing:** fix dark detection bug and switch to hour-by-hour forecast ([fc1c024](https://github.com/dylanr97/Paddlecheck/commit/fc1c024e026ab92fe0880ecceef64fb0c186a278))
- **briefing:** instruct the model to write in British English ([8f2f656](https://github.com/dylanr97/Paddlecheck/commit/8f2f656b8a19390115536a3486fe30baf9c36a4c))
- **briefing:** name the best window's status colour ([234c350](https://github.com/dylanr97/Paddlecheck/commit/234c3507b6c0118042d604e1fca674ff1f25bffd))
- **briefing:** pin best window to top-tier status and extend to sunset ([96e9563](https://github.com/dylanr97/Paddlecheck/commit/96e95636c6a8bdc6c4ac8672c7d8fa06cdaeb2ab))
- **briefing:** strip descriptions from status legend ([5a719c2](https://github.com/dylanr97/Paddlecheck/commit/5a719c282737e76246b963e89ff69dca48918df8))
- **briefing:** tell the model the status ranking ([fa12fea](https://github.com/dylanr97/Paddlecheck/commit/fa12fea5ea833647a6dd14e248f19be6511e12b7))
- **forecast:** unify rain detection and pin current-hour graph point ([79ba34b](https://github.com/dylanr97/Paddlecheck/commit/79ba34bc3697fdcc73fb67b3b73edfb87b0b981f))

## [1.5.0](https://github.com/dylanr97/Paddlecheck/compare/paddlecheck-v1.4.0...paddlecheck-v1.5.0) (2026-06-15)

### Features

- AI conditions briefing ([ac44fdb](https://github.com/dylanr97/Paddlecheck/commit/ac44fdb31a86d539088e2aca0d47d50783cadbc8))
- feature flag AI Summary behind NEXT_PUBLIC_FEATURE_AI_SUMMARY ([46688de](https://github.com/dylanr97/Paddlecheck/commit/46688de64ed7e983f797807162361642f2d9d0f4))
- give next-daytime outlook when dark, in briefing and share dialog ([edbd836](https://github.com/dylanr97/Paddlecheck/commit/edbd836c0e65a54286f133acc59422195ccfb437))

### Bug Fixes

- move AI_SUMMARY_ENABLED guard after hooks to satisfy rules-of-hooks ([dfbfb92](https://github.com/dylanr97/Paddlecheck/commit/dfbfb92aef569011a8b7d78886fa3670085e938c))
- natural phrasing for dark outlook ranges ([10d124b](https://github.com/dylanr97/Paddlecheck/commit/10d124bf606705bc3e6e51926618812d3c179935))
- neutral after-dark wording, match icon colour, capitalise label ([40893e0](https://github.com/dylanr97/Paddlecheck/commit/40893e038b589d8d4040bd49bd7c54849c890b0f))
- raise model temperature and prompt for natural prose ([b1694a8](https://github.com/dylanr97/Paddlecheck/commit/b1694a876c904a995a0629fc613e58a9e53f6482))

## [1.4.0](https://github.com/dylanr97/Paddlecheck/compare/paddlecheck-v1.3.2...paddlecheck-v1.4.0) (2026-06-14)

### Features

- add AI conditions briefing to status card ([e318c82](https://github.com/dylanr97/Paddlecheck/commit/e318c82c08687ea71501bab77afcfb9c7f98688b))
- add auto-summarise setting and on-demand trigger ([7c54d13](https://github.com/dylanr97/Paddlecheck/commit/7c54d134d092c975d2173e533f60babf6cf97923))
- finalise AI summary as Alert with action.hover background ([3883cd0](https://github.com/dylanr97/Paddlecheck/commit/3883cd0121e0facdd42ba7b12cfeee8715263998))
- include best paddling times in AI briefing, fix air temperature label ([143a9f8](https://github.com/dylanr97/Paddlecheck/commit/143a9f818739661cbc4c19c35771501f0849fac0))
- replace AI summary accordion with chip trigger ([d77650c](https://github.com/dylanr97/Paddlecheck/commit/d77650cc92c0877b2a1efec66dde468c9e70af88))
- show both AI summary UI variants for comparison ([4de40c9](https://github.com/dylanr97/Paddlecheck/commit/4de40c9bbd4c488641253cffeec0490101f8fc74))

### Bug Fixes

- best conditions end time shows end of slot not start ([841a6c6](https://github.com/dylanr97/Paddlecheck/commit/841a6c636686d8af1b79329f51775cf779cb07e4))
- best conditions ignoring current hour and including dark slots ([4e1c0d9](https://github.com/dylanr97/Paddlecheck/commit/4e1c0d90b1acf05721fcf576f25a2843bf6090ed))
- format river level to 2dp in AI briefing prompt ([e329972](https://github.com/dylanr97/Paddlecheck/commit/e3299728ce81641da3fbef9c5ebd96eacea1e89a))
- give AI briefing sunset context and handle currently-dark case ([57ed771](https://github.com/dylanr97/Paddlecheck/commit/57ed771ee380365ccd5351828d91317235c889aa))
- tighten AI briefing prompt for specificity and cleaner data ([324b16c](https://github.com/dylanr97/Paddlecheck/commit/324b16ce720ec5f1f910aff49540dffe96faddd9))
- use actual sunset/sunrise times at dark boundary hours ([5deb7e1](https://github.com/dylanr97/Paddlecheck/commit/5deb7e16665e2f1798e5b6a2c3e6f34520a38642))

## [1.3.2](https://github.com/dylanr97/Paddlecheck/compare/paddlecheck-v1.3.1...paddlecheck-v1.3.2) (2026-06-14)

### Bug Fixes

- add M3-compliant motion system ([2fb255e](https://github.com/dylanr97/Paddlecheck/commit/2fb255e7fa4e6c6f34d2240c794fb903ccc8c4c8))
- complete Material Design 3 compliance for non-colour elements ([2f3ecb5](https://github.com/dylanr97/Paddlecheck/commit/2f3ecb51f30be55e1eade780859a75b821d57dff))

## [1.3.1](https://github.com/dylanr97/Paddlecheck/compare/paddlecheck-v1.3.0...paddlecheck-v1.3.1) (2026-06-06)

### Bug Fixes

- prevent duplicate release PRs from rapid successive merges ([5df0b30](https://github.com/dylanr97/Paddlecheck/commit/5df0b307a53aae74f7e592ec5efcd6c55a7f1870))
- upgrade postcss to 8.5.15 via npm overrides to patch CVE-2026-41305 ([f325c55](https://github.com/dylanr97/Paddlecheck/commit/f325c55868ff89e6251a9ec10442c395e8c2d079))

## [1.3.0](https://github.com/dylanr97/Paddlecheck/compare/paddlecheck-v1.2.0...paddlecheck-v1.3.0) (2026-06-06)

### Features

- Add 24-hour predicted RAG graph ([fc1e044](https://github.com/dylanr97/Paddlecheck/commit/fc1e0447c5fd32abcbf65b6131ee02b5a762ac2a))
- Add 5-day change indicator and fix 24h change calculation ([f5202ae](https://github.com/dylanr97/Paddlecheck/commit/f5202ae1701df5e6f5fd1916347fc73c6cd3b690))
- add conventional commits enforcement and automated releases ([cb0ac87](https://github.com/dylanr97/Paddlecheck/commit/cb0ac8754201eac16a522e25e265e7617594e995))
- Add disclaimer to page ([052f72d](https://github.com/dylanr97/Paddlecheck/commit/052f72d1b62af499467cbe758fce16f58b75dc2e))
- Add GitHub Actions CI workflow ([caa92cd](https://github.com/dylanr97/Paddlecheck/commit/caa92cdbeb640a0cc19e203887bb69efb6e83825))
- Add gradient fill to predicted river level graph ([9f291cb](https://github.com/dylanr97/Paddlecheck/commit/9f291cb0e9de68f369bef0281e6b81b5dd6f164f))
- Add indicators for stats influencing RAG status ([9fc9eb8](https://github.com/dylanr97/Paddlecheck/commit/9fc9eb8b3ac32bda7d1f7cf6fa4115264940376f))
- Add loading animation to Who Can Paddle card ([e210dd9](https://github.com/dylanr97/Paddlecheck/commit/e210dd9bc02833235948470c9204d1b358d98e11))
- Add paddling matrix card ([577390e](https://github.com/dylanr97/Paddlecheck/commit/577390e69bcfde9ece57eb00965ec888f1eae542))
- add pitchcroft paddleability stat ([b88754e](https://github.com/dylanr97/Paddlecheck/commit/b88754e39c2f87ab1d92a2d42cd8f96f06513f30))
- add Pred toggle to river level graph showing Bewdley-backed forecast ([457a4c1](https://github.com/dylanr97/Paddlecheck/commit/457a4c103231979f26be94e77cc40f3f554b3dfe))
- Add predicted river level line to forecast graph ([ebb9de4](https://github.com/dylanr97/Paddlecheck/commit/ebb9de460b599a926d580455a1206110a58403af))
- Add predicted river level to RAG forecast graph ([fe9b8c6](https://github.com/dylanr97/Paddlecheck/commit/fe9b8c6e95e718f5b93fdd5f38c6142b991c5f16))
- Add river level reasons to RAG status ([5b302dd](https://github.com/dylanr97/Paddlecheck/commit/5b302dda9f15ae3e286cf735e958811e36f00309))
- Add sunrise/sunset indicators to forecast graph ([c0b0426](https://github.com/dylanr97/Paddlecheck/commit/c0b042684274772f16ef55d9784c8f8b5a14a36c))
- add test notification button to settings ([c9e930d](https://github.com/dylanr97/Paddlecheck/commit/c9e930d353ffabcccefd9a343658903598dc2839))
- Add version bump GitHub Action and fix metadata ([a631bc2](https://github.com/dylanr97/Paddlecheck/commit/a631bc2f19a0e7a58d8e1018f98d74680159b880))
- add weather conditions legend modal ([70783a0](https://github.com/dylanr97/Paddlecheck/commit/70783a00f8898378419db5764a02f562907380d9))
- Align 'No Paddling' UI with other RAG statuses ([7f03802](https://github.com/dylanr97/Paddlecheck/commit/7f03802ee66209292baefa9b872b1303c7127fc1))
- Change "RAG" to "Paddling" in UI ([d4945a2](https://github.com/dylanr97/Paddlecheck/commit/d4945a2e02b981dd5d8f329bc5a1d21ade3010d4))
- Complete redesign of the settings modal ([689f6a0](https://github.com/dylanr97/Paddlecheck/commit/689f6a05fe256c5344838e1d3a21bde322dace86))
- Create initial Paddlecheck dashboard application ([0b7a403](https://github.com/dylanr97/Paddlecheck/commit/0b7a403c50443d0748e9eab14655396f98114e8e))
- Display river level trend in detailed stats ([fdcef38](https://github.com/dylanr97/Paddlecheck/commit/fdcef38537e0757cdbd6727985adbfd62194a755))
- Enhance paddling matrix card with new features ([43b16b6](https://github.com/dylanr97/Paddlecheck/commit/43b16b62672da50bceb9b3abb38bd27ec9f50d40))
- **icons:** Update RAG status icons ([86a9cf5](https://github.com/dylanr97/Paddlecheck/commit/86a9cf551c3bc4d35579fbe93455febdadc635bb))
- Implement 24-hour clock format across the app ([9d193f5](https://github.com/dylanr97/Paddlecheck/commit/9d193f54e25b8ddba9f5e6024da577d04b83e99c))
- Implement manual data refetch and loading state for stats ([b338385](https://github.com/dylanr97/Paddlecheck/commit/b33838520a9feca069b62d817e376ea957f23af2))
- Implement manual data refetch on refresh button ([2b95d91](https://github.com/dylanr97/Paddlecheck/commit/2b95d9179fbe0d92c89b09ac447f0533faf17e14))
- Implement RAG status, detailed stats, and river level graph ([921a74d](https://github.com/dylanr97/Paddlecheck/commit/921a74d3af43153747c729f236ae8f4d71c211d9))
- Implement real river and weather data, and update README ([986b26a](https://github.com/dylanr97/Paddlecheck/commit/986b26ac7697c82f8ac1d89424e7a212597b9538))
- Improve RAG forecast prediction algorithm ([0d3cfab](https://github.com/dylanr97/Paddlecheck/commit/0d3cfab42e775dbee8dbd080fdbff33c339e18c3))
- make river level graph y-axis dynamic ([0a9b123](https://github.com/dylanr97/Paddlecheck/commit/0a9b1236c6a9e0fb8611f1fa83e8bcf15e8ab9c9))
- Move "last updated" to below the navbar ([9368766](https://github.com/dylanr97/Paddlecheck/commit/936876617d8a2c0eac136feeac4d16e520a17b7f))
- Move disclaimer to settings modal ([6e915ab](https://github.com/dylanr97/Paddlecheck/commit/6e915ab6c8f61d7fdb8fd4d8c947c905d6f7ade1))
- Overhaul UI with Material 3 expressive design ([9e26793](https://github.com/dylanr97/Paddlecheck/commit/9e26793231502c978275326bdd715ddafb137173))
- **rag:** Use weather codes to detect fog ([a96750a](https://github.com/dylanr97/Paddlecheck/commit/a96750a68cc78b2584e0e88a96baed434989c449))
- Redesign Settings Modal with Multi-Card Layout ([e40beca](https://github.com/dylanr97/Paddlecheck/commit/e40beca8c765b3c57ddc7f654307edef6e5ba2dc))
- Redesign UI and enable PWA ([9c6f092](https://github.com/dylanr97/Paddlecheck/commit/9c6f092e1f93ba24cbdf54dd8110a27f8cf13d36))
- remove Junior type, add retries, error/offline states, system theme ([f7583d6](https://github.com/dylanr97/Paddlecheck/commit/f7583d6cb2f5c3657e0e5c180eb48c421b2118f6))
- Replace skeleton loading indicator with circular progress ([193a911](https://github.com/dylanr97/Paddlecheck/commit/193a9116f76b85d19a0fe39f0d84741957189427))
- Revise Settings Modal and RAG Status UI ([1e06744](https://github.com/dylanr97/Paddlecheck/commit/1e06744e996251587e6f27654c8a626569f4f2f4))
- Scale RAG forecast bars and update graph styles ([b1d3ffb](https://github.com/dylanr97/Paddlecheck/commit/b1d3ffbedd20305ba851ec8c8f83a8999c098dde))
- Set steady trend icon to amber ([e1c6361](https://github.com/dylanr97/Paddlecheck/commit/e1c6361895a725a114683a5c4ebd8c45f8b352ba))
- switch to Roboto Flex to align with Material Expressive guidelines ([b5d75ec](https://github.com/dylanr97/Paddlecheck/commit/b5d75ecea9663c4c4905c25449fdb29db6172e59))
- trigger version bump on merge to main ([f703a3b](https://github.com/dylanr97/Paddlecheck/commit/f703a3bfe3edcdb8ea7bce9566e5e60ab7cbb5c0))
- Tweak settings modal UI to match card styling ([0743cd5](https://github.com/dylanr97/Paddlecheck/commit/0743cd502f9e1f6f1d909a27fef0639ce1e2d235))
- Unify settings modal UI ([214941a](https://github.com/dylanr97/Paddlecheck/commit/214941a0347a696ce0835afc271f4e75377ce9f3))
- Update disclaimer text ([8d61bb4](https://github.com/dylanr97/Paddlecheck/commit/8d61bb4d29e63bdd86b982f31d1413baee7c1d92))
- Update footer text and hyperlink ([ba56011](https://github.com/dylanr97/Paddlecheck/commit/ba560111901502d06d9ea1529507b09fd6765fa3))
- Update graph normalization and styling ([adec560](https://github.com/dylanr97/Paddlecheck/commit/adec560cfdd17ea6d988aa7f9f94be894693677c))
- Update river level graph UI ([8d2aad7](https://github.com/dylanr97/Paddlecheck/commit/8d2aad70308e502b6ef358513cb409fa1e404bdb))
- Update river level icons for clarity ([3ed80ca](https://github.com/dylanr97/Paddlecheck/commit/3ed80ca4b7bf93abd17fe982a469b6c8ef3160e2))
- update river level reason message to include threshold ([93745a5](https://github.com/dylanr97/Paddlecheck/commit/93745a55230946f3a7e529f6326ad252faf28ce6))
- Update version to 1.0.0 and display dynamically ([15aa384](https://github.com/dylanr97/Paddlecheck/commit/15aa3845eb245de0e9d565b7b3ec3bb13361e819))
- update weather and config settings with new icons and refined r… ([a998684](https://github.com/dylanr97/Paddlecheck/commit/a998684871b66657673559e011d5de2f27b2865e))
- update weather and config settings with new icons and refined rain codes ([47696b6](https://github.com/dylanr97/Paddlecheck/commit/47696b6a8a2fa0ca788f25bb9d0232093646f8a7))
- Use 24-hour clock and relative time formatting ([2097488](https://github.com/dylanr97/Paddlecheck/commit/2097488b56db06f18a8d49f89c567224a31237e0))
- use Bewdley upstream forecast to improve Worcester river level prediction ([06c2471](https://github.com/dylanr97/Paddlecheck/commit/06c247177cf9b4c2079b089b20c1684c54538d37))

### Bug Fixes

- Add missing comma in metadata object ([d0cf8e7](https://github.com/dylanr97/Paddlecheck/commit/d0cf8e7af6791e029523748427734446ae5babd0))
- Add missing newline in PITCHCROFT_PADDLEABILITY comment ([f47dac0](https://github.com/dylanr97/Paddlecheck/commit/f47dac0bea4ddb8e889f4c6294a795407881da41))
- address code smells, bug, and tech debt across core modules ([a14b7ed](https://github.com/dylanr97/Paddlecheck/commit/a14b7edde94d00773454fbd050fe990d012b656a))
- Address PR comments ([11a1ebd](https://github.com/dylanr97/Paddlecheck/commit/11a1ebd103d4c99bef78389f9a4a2690eb68633c))
- anchor delta to Bewdley-6h baseline so prediction starts smoothly ([1be1abc](https://github.com/dylanr97/Paddlecheck/commit/1be1abcc625f63647fc4fc38a2b1aac031b1b1f4))
- anchor linear fallback to last Bewdley level; remove transition divider ([77fd645](https://github.com/dylanr97/Paddlecheck/commit/77fd645dd2bd30422cb728f245a4cb6cfa0f4071))
- **BottomNavBar:** Add safe-area padding to avoid gesture area ([a3ea9f7](https://github.com/dylanr97/Paddlecheck/commit/a3ea9f70475dfed686e1c344a6a56e9dc878ee46))
- cast mock predictionSource ternary to literal union type ([29ae3ad](https://github.com/dylanr97/Paddlecheck/commit/29ae3ad64cd98874cc965a35b4b5cb6a5c81ef4c))
- center align paddler and status table cells ([93e337c](https://github.com/dylanr97/Paddlecheck/commit/93e337cde05277f101b991f6684372d5abf7e8f8))
- Center status card and improve dark mode nav ([314e1df](https://github.com/dylanr97/Paddlecheck/commit/314e1df13a101cde99c799b5e42fc47f20318048))
- Change jsx setting from 'preserve' to 'react-jsx' ([63cd4bf](https://github.com/dylanr97/Paddlecheck/commit/63cd4bf7797865cb06138c475e2263cef23a11ea))
- clean up pred view X axis with 6-hour ticks and compact labels ([631d74d](https://github.com/dylanr97/Paddlecheck/commit/631d74db16dc1b3e1bc13eadb6fcf19c3adb6ab0))
- Correct inconsistent paddling status for high water levels ([247fb7b](https://github.com/dylanr97/Paddlecheck/commit/247fb7b9c4392489ea18131939aa755b216043db))
- correct pitchcroft paddleability logic ([ca0a093](https://github.com/dylanr97/Paddlecheck/commit/ca0a093d4222cb0c9a29308df0cabe3e1139e1f8))
- correct RAG for warm+windy conditions at moderate river level ([878d30b](https://github.com/dylanr97/Paddlecheck/commit/878d30baa9495f19cbf251683446fb6fabf8e291))
- Correct river level forecasting algorithm ([03a133f](https://github.com/dylanr97/Paddlecheck/commit/03a133f7b600f60634f657ba8d3b62edba824fa1))
- disable react/display-name rule for app metadata files ([da91f44](https://github.com/dylanr97/Paddlecheck/commit/da91f443011da892c77a3f1578f21d7a1d0bfe47))
- drawer background, swipe-to-close, and matrix text clarity ([8a7dffe](https://github.com/dylanr97/Paddlecheck/commit/8a7dffe2fe690ca06a02cda5d6712da966f6d54e))
- **eslint:** downgrade to eslint ^9.7 and use prettier flat config ([29c081a](https://github.com/dylanr97/Paddlecheck/commit/29c081a96f5e42ea595fdf9a0f12a3fa0d42624d))
- **eslint:** upgrade to ESLint 10 and fix react plugin compatibility ([f6e4a28](https://github.com/dylanr97/Paddlecheck/commit/f6e4a286e44cea0a8ff490d9f133f19731fcdcd4))
- **eslint:** upgrade to ESLint 10 and fix react plugin compatibility ([aaaa3c5](https://github.com/dylanr97/Paddlecheck/commit/aaaa3c55e12d3fba4408e03a1c50c1c85c2c740c)), closes [#186](https://github.com/dylanr97/Paddlecheck/issues/186)
- Improve level description retrieval logic for better accuracy ([71d156c](https://github.com/dylanr97/Paddlecheck/commit/71d156ce9b8cf17c36687076048cde930b5f6464))
- include observations in Bewdley fetch fallback ([f7e9ac5](https://github.com/dylanr97/Paddlecheck/commit/f7e9ac5c7007d055ac634c2df796c4fd868fc5e4))
- init settings state with lazy useState to satisfy lint rule ([b1e4e87](https://github.com/dylanr97/Paddlecheck/commit/b1e4e871c34f8b418dc939b5b41020d2d8fa8416))
- Initialize state correctly in PaddlingMatrixCard ([71e26b4](https://github.com/dylanr97/Paddlecheck/commit/71e26b486609c7de878be8040618d49a913f074d))
- **links:** Update link names and add new river level links ([835608d](https://github.com/dylanr97/Paddlecheck/commit/835608d0a9dadfdba50083a09f962733a8e1ce0a))
- **page:** resolve typescript error for riverLevel ([f252180](https://github.com/dylanr97/Paddlecheck/commit/f252180af8a4a66afd2cad858207b439b08518d2))
- pass undefined instead of null to ComposedChart data prop ([fbfa2fb](https://github.com/dylanr97/Paddlecheck/commit/fbfa2fb3c1677ee71582ec4afff44cd9072bba16))
- pred X axis uses daily ticks with day labels matching 5d view ([ed1b1d3](https://github.com/dylanr97/Paddlecheck/commit/ed1b1d345bd2d38883f28f86aeda9646bb980cd6))
- pred Y axis starts at 0 to match historical views ([9423cc8](https://github.com/dylanr97/Paddlecheck/commit/9423cc8a50988ac5e7215989adcba9520ba6cd2b))
- prevent infinite loop in version bump action ([33fad64](https://github.com/dylanr97/Paddlecheck/commit/33fad64c47ba740340398a39ca140fb70d001540))
- rebase, remove subtitle, fix historical X axis and pred Y axis ([a8be9c2](https://github.com/dylanr97/Paddlecheck/commit/a8be9c27b3d404755784404b42a859e9d5abbe3c))
- reduce pred X axis to 12h ticks with short labels ([9954d29](https://github.com/dylanr97/Paddlecheck/commit/9954d29703b493fe8c8909983528d20bf5975a1f))
- remove custom font size from pred XAxis for consistency ([10aefe4](https://github.com/dylanr97/Paddlecheck/commit/10aefe42d314333d7eb369bff571d65ce2b65923))
- Remove predicted river level line from forecast graph ([01c12b6](https://github.com/dylanr97/Paddlecheck/commit/01c12b6081a735dee92a4e2fcb475ea15ea7ff60))
- remove stray lines left from previous function refactor ([fec0234](https://github.com/dylanr97/Paddlecheck/commit/fec0234b40152a14da08f2ccef370b84afd3daae))
- replace drag handle with close button in both drawers ([e20e707](https://github.com/dylanr97/Paddlecheck/commit/e20e7073f55a9728e46fc6ba4d42c048128bd198))
- Replace forecast model with linear regression ([3da6905](https://github.com/dylanr97/Paddlecheck/commit/3da690546f87789d25e48c527ae4e18bc8e9c971))
- replace stale SwipeableDrawer closing tag with Drawer ([6cb6609](https://github.com/dylanr97/Paddlecheck/commit/6cb66095b8db07bb86ca945ddfc9c2c2d24600b7))
- Resolve all linting issues ([0143487](https://github.com/dylanr97/Paddlecheck/commit/01434879c2a00b83b2a7e712e6819cf3faa5a0c6))
- resolve build failures from localStorage SSR access and Google Fonts network block ([f5bdf6a](https://github.com/dylanr97/Paddlecheck/commit/f5bdf6a10061042887669405f11c88b81548eb1c))
- resolve MUI v9 build and icon import errors ([5a9927f](https://github.com/dylanr97/Paddlecheck/commit/5a9927fda796983da213af91c91fe17e334fbf1d))
- Resolve react-hooks lint errors and hydration mismatches by using useEffect for localStorage sync ([210a43f](https://github.com/dylanr97/Paddlecheck/commit/210a43f9663591834bfa4cc85600959d424b0c20))
- resolve TypeScript error in getPitchcroftPaddleability ([812c2d7](https://github.com/dylanr97/Paddlecheck/commit/812c2d73f92523a7d96840edb8bc0182a32d2255))
- show only time on pred X axis, date is in the tooltip ([a050195](https://github.com/dylanr97/Paddlecheck/commit/a050195504ed49a35a19785faf8c1e71b1fe31da))
- Standardize display of zero change in river level ([d67cbbb](https://github.com/dylanr97/Paddlecheck/commit/d67cbbb9394246175b5284444eae01b49e0dce58))
- swipe-to-close from anywhere when scrolled to top ([5846541](https://github.com/dylanr97/Paddlecheck/commit/5846541f5a72bffd3973bc37ece93368917880d4))
- **tooltip:** use centralized icon mapping for river level ([16f24a5](https://github.com/dylanr97/Paddlecheck/commit/16f24a509771bb4465329daa5a70cf06e7129e04))
- **ui:** Correct settings modal styling and remove close button ([cea04e5](https://github.com/dylanr97/Paddlecheck/commit/cea04e541065e59063ebb6c1f06a104c3850cdad))
- Update level descriptions for clarity and safety warnings ([7128633](https://github.com/dylanr97/Paddlecheck/commit/7128633e76cd108158e65dd4daa946063bc64231))
- Update temperature string to be more descriptive ([fb467a2](https://github.com/dylanr97/Paddlecheck/commit/fb467a24ed3505309b9e94691dd1ee7a7e80ea96))
- use Bewdley observed readings for first 6h of Worcester prediction ([9aaa32e](https://github.com/dylanr97/Paddlecheck/commit/9aaa32e230ad6105af704a150fd543d6630135c0))
- use Line instead of Area so river level renders in front of bars ([4f3f6d6](https://github.com/dylanr97/Paddlecheck/commit/4f3f6d6cf99ec7ea26c6cc3cbb19c684a8307be6))
- use numeric timestamps for pred XAxis so ticks render correctly ([95d4dec](https://github.com/dylanr97/Paddlecheck/commit/95d4dec463d17cc4a5abebf7fdfacf433f5e5d92))
- use service worker showNotification for mobile Chrome support ([eeaa45d](https://github.com/dylanr97/Paddlecheck/commit/eeaa45de9abbd5d1f25d00a674be96dec8302b41))

## [1.2.0](https://github.com/dylanr97/Paddlecheck/compare/paddlecheck-v1.1.1...paddlecheck-v1.2.0) (2026-06-04)
