# Data Model: Landing Copy Catalog

No database or API entities. The only "data" is the translation catalog. This file is the **authoritative copy** — implementation transcribes it into `frontend/src/i18n/locales/en.json` and `ar.json` exactly (nested objects; dots below = nesting). Arabic is AI-drafted and must be reviewed by a fluent speaker before release (same rule as feature 006 FR-013). Numbers use Western digits in both languages (006 FR-012). "SAWA" is never translated.

## Reused existing keys (do not duplicate)

`common.appName`, `common.tagline`, `auth.signIn`, `status.submitted`, `status.approved`, `status.returned`, `requestType.leave`, `requestType.equipment`, `requestType.wfh`, `role.employee`, `role.manager`, `dashboard.hoursThisWeek`.

## New key: `auth.whatIsSawa`

| Key | en | ar |
|---|---|---|
| `auth.whatIsSawa` | What is SAWA? | ما هو SAWA؟ |

## New group: `landing`

| Key | en | ar |
|---|---|---|
| `landing.meta.title` | SAWA — Every request. Every hour. Together. | SAWA — كل طلب. كل ساعة. معًا. |
| `landing.skipToContent` | Skip to content | تخطَّ إلى المحتوى |
| `landing.nav.label` | Main | الرئيسية |
| `landing.nav.home` | SAWA home | الصفحة الرئيسية لـ SAWA |
| `landing.nav.problem` | Problem | المشكلة |
| `landing.nav.how` | How it works | كيف يعمل |
| `landing.nav.roles` | Roles | الأدوار |
| `landing.nav.openMenu` | Open menu | فتح القائمة |
| `landing.nav.closeMenu` | Close menu | إغلاق القائمة |
| `landing.hero.eyebrow` | For employees, managers, and HR | للموظفين والمديرين والموارد البشرية |
| `landing.hero.titleLead` | Every request. Every hour. | كل طلب. كل ساعة. |
| `landing.hero.titleAccent` | Together. | معًا. |
| `landing.hero.subtitle` | One shared place for requests, timesheets, and approvals — no more chasing emails and spreadsheets. | مكان واحد مشترك للطلبات وسجلات الدوام والموافقات — بلا ملاحقة للرسائل والجداول. |
| `landing.hero.secondary` | See how it works | شاهد كيف يعمل |
| `landing.hero.mockLabel` | Example: a leave request moving from Submitted to Approved, with 3 approvals pending | مثال: طلب إجازة ينتقل من «مُرسَل» إلى «مُعتمَد»، مع 3 موافقات معلّقة |
| `landing.mock.leaveTitle` | Annual leave · 3 days | إجازة سنوية · 3 أيام |
| `landing.mock.leaveDates` | 9–11 Nov | 9–11 نوفمبر |
| `landing.mock.requester` | Sara Hassan | سارة حسن |
| `landing.mock.submittedAt` | Mon 09:14 · by Sara | الإثنين 09:14 · بواسطة سارة |
| `landing.mock.approvedAt` | Mon 11:02 · by Ahmed | الإثنين 11:02 · بواسطة أحمد |
| `landing.mock.approvedComment` | “Enjoy your break!” | «استمتعي بإجازتك!» |
| `landing.mock.pendingCount` | 3 | 3 |
| `landing.mock.pendingLabel` | pending approvals | موافقات معلّقة |
| `landing.mock.timesheetDay` | Mon · 09:00–17:30 | الإثنين · 09:00–17:30 |
| `landing.mock.timesheetHours` | 8.5 h | 8.5 س |
| `landing.mock.hoursValue` | 38.5 h | 38.5 س |
| `landing.mock.itemLeave` | Annual leave | إجازة سنوية |
| `landing.mock.itemEquipment` | New laptop | حاسوب محمول جديد |
| `landing.mock.itemWfh` | Thursday from home | العمل من المنزل يوم الخميس |
| `landing.pain.title` | Sound familiar? | هل يبدو هذا مألوفًا؟ |
| `landing.pain.subtitle` | Most teams still handle requests and timesheets the hard way. | ما زالت فرق كثيرة تدير الطلبات وسجلات الدوام بالطريقة الصعبة. |
| `landing.pain.visibility.title` | No visibility | لا وضوح |
| `landing.pain.visibility.quote` | “Where's my leave request?” | «أين طلب إجازتي؟» |
| `landing.pain.visibility.body` | Requests get lost across email, WhatsApp, and paper forms. | تضيع الطلبات بين البريد الإلكتروني وواتساب والنماذج الورقية. |
| `landing.pain.accountability.title` | No accountability | لا مساءلة |
| `landing.pain.accountability.quote` | “Who approved this, and when?” | «من وافق على هذا، ومتى؟» |
| `landing.pain.accountability.body` | Decisions happen in side chats, with no record to look back on. | تُتخذ القرارات في محادثات جانبية، بلا سجل يمكن الرجوع إليه. |
| `landing.pain.time.title` | Wasted time | وقت ضائع |
| `landing.pain.time.quote` | “Has everyone sent their hours?” | «هل أرسل الجميع ساعاتهم؟» |
| `landing.pain.time.body` | Managers chase timesheets every week, and HR spends days merging spreadsheets. | يلاحق المديرون سجلات الدوام كل أسبوع، ويقضي فريق الموارد البشرية أيامًا في دمج الجداول. |
| `landing.shift.title` | Everything, together. | كل شيء، معًا. |
| `landing.shift.body` | One place where every request and every hour has an owner, a status, and a history. | مكان واحد يكون فيه لكل طلب ولكل ساعة صاحب وحالة وسجل. |
| `landing.shift.before` | Before | قبل |
| `landing.shift.after` | With SAWA | مع SAWA |
| `landing.shift.email` | Email | البريد الإلكتروني |
| `landing.shift.chat` | Chat | المحادثات |
| `landing.shift.paper` | Paper forms | النماذج الورقية |
| `landing.shift.sheets` | Spreadsheets | الجداول |
| `landing.how.title` | How it works | كيف يعمل |
| `landing.how.subtitle` | Three steps, the same for every request and every timesheet. | ثلاث خطوات، هي نفسها لكل طلب ولكل سجل دوام. |
| `landing.how.step` | Step {{n}} | الخطوة {{n}} |
| `landing.how.submit.title` | Submit | أرسِل |
| `landing.how.submit.body` | Send a request or log your hours in under 2 minutes, from any device. | أرسِل طلبًا أو سجّل ساعاتك في أقل من دقيقتين، من أي جهاز. |
| `landing.how.review.title` | Review | راجِع |
| `landing.how.review.body` | Your manager approves, rejects, or returns it with a comment. | يعتمده مديرك أو يرفضه أو يعيده إليك مع تعليق. |
| `landing.how.track.title` | Track | تابِع |
| `landing.how.track.body` | Everyone sees the live status, and HR sees the whole organization. | يرى الجميع الحالة أولًا بأول، ويرى فريق الموارد البشرية المؤسسة كلها. |
| `landing.roles.title` | Built for every role | مصمَّم لكل دور |
| `landing.roles.subtitle` | Everyone gets the view they need — nothing more, nothing less. | يرى كل شخص ما يحتاجه تمامًا — لا أكثر ولا أقل. |
| `landing.roles.employee.b1` | See every request and its status in one place. | شاهد كل طلباتك وحالاتها في مكان واحد. |
| `landing.roles.employee.b2` | Submit a leave request in under 2 minutes. | أرسِل طلب إجازة في أقل من دقيقتين. |
| `landing.roles.employee.b3` | Get notified when something is approved or needs changes. | تلقَّ إشعارًا عند اعتماد طلبك أو عند حاجته إلى تعديل. |
| `landing.roles.manager.b1` | All pending team requests and timesheets on one dashboard. | كل طلبات فريقك وسجلات دوامه المعلّقة في لوحة واحدة. |
| `landing.roles.manager.b2` | Approve, reject, or return with a comment. | اعتمد أو ارفض أو أعِد الطلب مع تعليق. |
| `landing.roles.manager.b3` | Filter by type, status, or team member. | صفِّ حسب النوع أو الحالة أو عضو الفريق. |
| `landing.roles.hr.name` | HR | الموارد البشرية |
| `landing.roles.hr.b1` | An organization-wide view of pending requests and hours. | رؤية شاملة للمؤسسة للطلبات المعلّقة والساعات. |
| `landing.roles.hr.b2` | Working-hour and request reports in minutes, not days. | تقارير الساعات والطلبات في دقائق بدلًا من أيام. |
| `landing.roles.hr.b3` | A full audit trail of every decision. | سجل تدقيق كامل لكل قرار. |
| `landing.trust.title` | Built to be trusted | مبني على الثقة |
| `landing.trust.access.title` | Role-based access | صلاحيات حسب الدور |
| `landing.trust.access.body` | People see only what their role allows. | يرى كل شخص ما يسمح به دوره فقط. |
| `landing.trust.history.title` | Full status history | سجل كامل للحالات |
| `landing.trust.history.body` | Every change, with who made it and when. | كل تغيير، ومن قام به، ومتى. |
| `landing.trust.language.title` | English and Arabic | العربية والإنجليزية |
| `landing.trust.language.body` | Full right-to-left support for Arabic. | دعم كامل للكتابة من اليمين إلى اليسار. |
| `landing.cta.title` | Bring your team together. | اجمع فريقك معًا. |
| `landing.cta.body` | Sign in with the account your HR team set up for you. | سجّل الدخول بالحساب الذي أعدّه لك فريق الموارد البشرية. |
| `landing.footer.copyright` | © {{year}} SAWA | © {{year}} SAWA |

## Validation rules

- `npm run i18n:check` passes (parity, no empty values).
- `en.json` keeps its existing keys byte-for-byte; only additions.
- Interpolations: `landing.how.step` → `{ n }` (1–3), `landing.footer.copyright` → `{ year }` (`new Date().getFullYear()`).
