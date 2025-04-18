# Delay Plugins

مجموعة من الأدوات لضبط توقيت إشارات الصوت الخاصة بك أو إضافة تكرارات مميزة. تساعدك هذه الملحقات على ضبط المحاذاة الزمنية للصوت بدقة، أو إنشاء أصداء إيقاعية، أو إضافة إحساس بالمساحة والعمق لتجربة الاستماع الخاصة بك.

## قائمة الملحقات

- [Delay](#delay) - ينشئ أصداء مع التحكم في التوقيت والنغمة والانتشار الاستريو.
- [Modal Resonator](#modal-resonator) - تأثير رنين التردد مع ما يصل إلى 5 مرنانات
- [Time Alignment](#time-alignment) - تعديلات توقيت دقيقة لقنوات الصوت.

## Delay

يضيف هذا التأثير أصداء مميزة إلى الصوت الخاص بك. يمكنك التحكم في سرعة تكرار الأصداء، وكيفية تلاشيها، وكيفية انتشارها بين مكبرات الصوت، مما يتيح لك إضافة عمق دقيق، أو إثارة إيقاعية، أو تأثيرات مكانية إبداعية لتشغيل الموسيقى الخاص بك.

### دليل تجربة الاستماع

- **عمق ومساحة دقيقة:**
  - يضيف إحساسًا لطيفًا بالمساحة دون إغراق الصوت.
  - يمكن أن يجعل الأصوات أو الآلات الرئيسية تبدو أكبر قليلاً أو أكثر حضورًا.
  - استخدم أوقات تأخير قصيرة وردود فعل/مزج منخفضة.
- **تحسين إيقاعي:**
  - ينشئ أصداء تتزامن مع إيقاع الموسيقى (يتم ضبطها يدويًا).
  - يضيف إيقاعًا وحيوية، خاصة للموسيقى الإلكترونية أو الطبول أو الجيتارات.
  - جرب أوقات تأخير مختلفة (مثل مطابقة النوتات الثامنة أو الربعية بالسمع).
- **صدى الصفع (Slapback Echo):**
  - صدى قصير جدًا ومنفرد يستخدم غالبًا في الأصوات أو الجيتارات في موسيقى الروك والكانتري.
  - يضيف تأثيرًا إيقاعيًا ومضاعفًا.
  - استخدم أوقات تأخير قصيرة جدًا (30-120 مللي ثانية)، وردود فعل صفرية، ومزج معتدل.
- **انتشار ستريو إبداعي:**
  - باستخدام التحكم في Ping-Pong، يمكن للأصداء أن ترتد بين السماعات اليسرى واليمنى.
  - ينشئ صورة ستريو أوسع وأكثر جاذبية.
  - يمكن أن يجعل الصوت يبدو أكثر ديناميكية وإثارة للاهتمام.

### المعلمات

- **التأخير المسبق (Pre-Delay) (مللي ثانية)** - المدة قبل سماع الصدى *الأول* (0 إلى 100 مللي ثانية).
  - القيم المنخفضة (0-20 مللي ثانية): يبدأ الصدى على الفور تقريبًا.
  - القيم الأعلى (20-100 مللي ثانية): ينشئ فجوة ملحوظة قبل الصدى، ويفصله عن الصوت الأصلي.
- **حجم التأخير (Delay Size) (مللي ثانية)** - الوقت بين كل صدى (1 إلى 5000 مللي ثانية).
  - قصير (1-100 مللي ثانية): ينشئ تأثيرات سماكة أو "صفع خلفي".
  - متوسط (100-600 مللي ثانية): تأثيرات صدى قياسية، جيدة للتحسين الإيقاعي.
  - طويل (600 مللي ثانية+): أصداء متباعدة ومميزة.
  - *نصيحة:* حاول النقر مع الموسيقى للعثور على وقت تأخير يبدو إيقاعيًا.
- **التخميد (Damping) (%)** - يتحكم في مدى تلاشي الترددات العالية والمنخفضة مع كل صدى (0 إلى 100%).
  - 0%: تحتفظ الأصداء بنغمتها الأصلية (أكثر إشراقًا).
  - 50%: تلاشي طبيعي ومتوازن.
  - 100%: تصبح الأصداء أغمق وأرق بشكل كبير بسرعة (أكثر كتمًا).
  - استخدمه بالاقتران مع High/Low Damp.
- **التخميد العالي (High Damp) (هرتز)** - يحدد التردد الذي تبدأ فوقه الأصداء في فقدان سطوعها (1000 إلى 20000 هرتز).
  - القيم المنخفضة (مثل 2000 هرتز): تصبح الأصداء داكنة بسرعة.
  - القيم الأعلى (مثل 10000 هرتز): تظل الأصداء أكثر إشراقًا لفترة أطول.
  - اضبطه مع Damping للتحكم في نغمة الأصداء.
- **التخميد المنخفض (Low Damp) (هرتز)** - يحدد التردد الذي تبدأ تحته الأصداء في فقدان امتلائها (20 إلى 1000 هرتز).
  - القيم المنخفضة (مثل 50 هرتز): تحتفظ الأصداء بمزيد من الجهير.
  - القيم الأعلى (مثل 500 هرتز): تصبح الأصداء أرق بسرعة أكبر.
  - اضبطه مع Damping للتحكم في نغمة الأصداء.
- **ردود الفعل (Feedback) (%)** - عدد الأصداء التي تسمعها، أو مدة استمرارها (0 إلى 99%).
  - 0%: يتم سماع صدى واحد فقط.
  - 10-40%: بضع تكرارات ملحوظة.
  - 40-70%: مسارات أصداء أطول ومتلاشية.
  - 70-99%: مسارات طويلة جدًا، تقترب من التذبذب الذاتي (استخدم بحذر!).
- **بينج بونج (Ping-Pong) (%)** - يتحكم في كيفية ارتداد الأصداء بين قنوات الاستريو (0 إلى 100%). (يؤثر فقط على تشغيل الاستريو).
  - 0%: تأخير قياسي - صدى الإدخال الأيسر على اليسار، والأيمن على اليمين.
  - 50%: ردود فعل أحادية - تتركز الأصداء بين السماعات.
  - 100%: بينج بونج كامل - تتناوب الأصداء بين السماعات اليسرى واليمنى.
  - القيم بينهما تخلق درجات متفاوتة من الانتشار الاستريو.
- **المزج (Mix) (%)** - يوازن حجم الأصداء مقابل الصوت الأصلي (0 إلى 100%).
  - 0%: لا يوجد تأثير.
  - 5-15%: عمق أو إيقاع دقيق.
  - 15-30%: أصداء مسموعة بوضوح (نقطة انطلاق جيدة).
  - 30%+: تأثير أقوى وأكثر وضوحًا. الافتراضي هو 16%.

### الإعدادات الموصى بها لتحسين الاستماع

1.  **عمق دقيق للصوت/الآلة:**
    - حجم التأخير: 80-150 مللي ثانية
    - ردود الفعل: 0-15%
    - المزج: 8-16%
    - بينج بونج: 0% (أو جرب 20-40% لعرض طفيف)
    - التخميد: 40-60%
2.  **تحسين إيقاعي (إلكتروني/بوب):**
    - حجم التأخير: حاول مطابقة الإيقاع بالسمع (مثل 120-500 مللي ثانية)
    - ردود الفعل: 20-40%
    - المزج: 15-25%
    - بينج بونج: 0% أو 100%
    - التخميد: اضبط حسب الذوق (أقل للتكرارات الأكثر إشراقًا)
3.  **صفع خلفي كلاسيكي للروك (جيتارات/أصوات):**
    - حجم التأخير: 50-120 مللي ثانية
    - ردود الفعل: 0%
    - المزج: 15-30%
    - بينج بونج: 0%
    - التخميد: 20-40%
4.  **أصداء ستريو واسعة (محيطي/وسادات):**
    - حجم التأخير: 300-800 مللي ثانية
    - ردود الفعل: 40-60%
    - المزج: 20-35%
    - بينج بونج: 70-100%
    - التخميد: 50-70% (لذيول أكثر سلاسة)

### دليل البدء السريع

1.  **ضبط التوقيت:**
    - ابدأ بـ `Delay Size` لضبط إيقاع الصدى الرئيسي.
    - اضبط `Feedback` للتحكم في عدد الأصداء التي تسمعها.
    - استخدم `Pre-Delay` إذا كنت تريد فجوة قبل الصدى الأول.
2.  **ضبط النغمة:**
    - استخدم `Damping` و `High Damp` و `Low Damp` معًا لتشكيل صوت الأصداء أثناء تلاشيها. ابدأ بـ Damping حوالي 50% واضبط ترددات Damp.
3.  **الموضع في الاستريو (اختياري):**
    - إذا كنت تستمع بالاستريو، جرب `Ping-Pong` للتحكم في عرض الأصداء.
4.  **المزج:**
    - استخدم `Mix` لموازنة حجم الصدى مع الموسيقى الأصلية. ابدأ منخفضًا (حوالي 16%) وزد حتى تشعر بأن التأثير مناسب.

---

## Modal Resonator

تأثير إبداعي يضيف ترددات رنانة إلى الصوت الخاص بك. ينشئ هذا الملحق رنينًا مضبوطًا عند ترددات محددة، على غرار كيفية اهتزاز الأجسام المادية عند تردداتها الرنانة الطبيعية. إنه مثالي لإضافة خصائص نغمية فريدة، أو محاكاة خصائص الرنين لمواد مختلفة، أو إنشاء تأثيرات خاصة.

### دليل تجربة الاستماع

- **رنين معدني:**
  - ينشئ نغمات تشبه الجرس أو معدنية تتبع ديناميكيات المادة المصدر.
  - مفيد لإضافة وميض أو طابع معدني إلى الإيقاع أو السينثسيزر أو المزيج الكامل.
  - استخدم مرنانات متعددة بترددات مضبوطة بعناية مع أوقات اضمحلال معتدلة.
- **تحسين نغمي:**
  - يعزز بمهارة ترددات محددة في الموسيقى.
  - يمكن أن يبرز التوافقيات أو يضيف امتلاءً لنطاقات تردد معينة.
  - استخدمه مع قيم مزج منخفضة (10-20%) لتحسين دقيق.
- **محاكاة مكبر الصوت كامل النطاق:**
  - يحاكي السلوك النمطي لمكبرات الصوت المادية.
  - يعيد إنشاء الرنين المميز الذي يحدث عندما تقسم المحركات اهتزازاتها عند ترددات مختلفة.
  - يساعد على محاكاة الصوت المميز لأنواع معينة من مكبرات الصوت.
- **تأثيرات خاصة:**
  - ينشئ صفات جرسية غير عادية وقوامًا من عالم آخر.
  - ممتاز لتصميم الصوت والمعالجة التجريبية.
  - جرب الإعدادات القصوى لتحويل الصوت الإبداعي.

### المعلمات

- **اختيار المرنان (Resonator Selection) (1-5)** - خمسة مرنانات مستقلة يمكن تمكينها/تعطيلها وتكوينها بشكل منفصل.
  - استخدم مرنانات متعددة لتأثيرات رنين معقدة ومتعددة الطبقات.
  - يمكن لكل مرنان استهداف مناطق تردد مختلفة.
  - جرب العلاقات التوافقية بين المرنانات للحصول على نتائج موسيقية أكثر.

لكل مرنان:

- **Enable** - تبديل المرنان الفردي تشغيل/إيقاف.
  - يسمح بالتمكين الانتقائي لرنين تردد معين.
  - مفيد لاختبار A/B لمجموعات مرنان مختلفة.

- **Freq (هرتز)** - يضبط تردد الرنين الأساسي (20 إلى 20000 هرتز).
  - الترددات المنخفضة (20-200 هرتز): تضيف جسمًا ورنينًا أساسيًا.
  - الترددات المتوسطة (200-2000 هرتز): تضيف حضورًا وطابعًا نغميًا.
  - الترددات العالية (2000+ هرتز): تنشئ صفات تشبه الجرس ومعدنية.
  - *نصيحة:* للتطبيقات الموسيقية، جرب ضبط المرنانات على نوتات في السلم الموسيقي أو على توافقيات التردد الأساسي.

- **Decay (مللي ثانية)** - يتحكم في مدة استمرار الرنين بعد صوت الإدخال (1 إلى 500 مللي ثانية).
  - قصير (1-50 مللي ثانية): رنين سريع وإيقاعي.
  - متوسط (50-200 مللي ثانية): رنين طبيعي المظهر مشابه للأجسام المعدنية أو الخشبية الصغيرة.
  - طويل (200-500 مللي ثانية): رنين يشبه الجرس ومستدام.
  - *ملاحظة:* تضمحل الترددات الأعلى تلقائيًا بشكل أسرع من الترددات المنخفضة للحصول على صوت طبيعي.

- **LPF Freq (هرتز)** - مرشح تمرير منخفض يشكل نغمة الرنين (20 إلى 20000 هرتز).
  - القيم المنخفضة: رنين أغمق وأكثر كتمًا.
  - القيم الأعلى: رنين أكثر إشراقًا وحضورًا.
  - اضبط للتحكم في المحتوى التوافقي للرنين.

- **HPF Freq (هرتز)** - مرشح تمرير عالي يزيل الترددات المنخفضة غير المرغوب فيها من الرنين (20 إلى 20000 هرتز).
  - القيم المنخفضة: يسمح بمرور المزيد من محتوى التردد المنخفض.
  - القيم الأعلى: يجعل الرنين أكثر رقة عن طريق إزالة ترددات الجهير.
  - استخدمه مع LPF للتحكم الدقيق في نطاق التردد.
  - يتم تعيين القيم الافتراضية إلى نصف تردد كل مرنان.

- **Gain (ديسيبل)** - يتحكم في مستوى الإخراج الفردي لكل مرنان (-18 إلى +18 ديسيبل).
  - القيم السالبة: تقلل مستوى إخراج المرنان.
  - -12 ديسيبل: إعداد الكسب الافتراضي.
  - القيم الموجبة: تزيد مستوى إخراج المرنان.
  - مفيد للضبط الدقيق للتوازن بين المرنانات المختلفة.

- **Mix (%)** - يوازن حجم الرنين مقابل الصوت الأصلي (0 إلى 100%).
  - 0%: لا يوجد تأثير.
  - 5-25%: تحسين دقيق.
  - 25-50%: مزيج متساوٍ من الأصوات الأصلية والرنانة.
  - 50-100%: يصبح الرنين أكثر هيمنة من الصوت الأصلي.

### الإعدادات الموصى بها لتحسين الاستماع

1. **تحسين دقيق لمكبر الصوت:**
   - تمكين 2-3 مرنانات
   - إعدادات Freq: 400 هرتز، 900 هرتز، 1600 هرتز
   - Decay: 60-100 مللي ثانية
   - LPF Freq: 2000-4000 هرتز
   - Mix: 10-20%

2. **طابع معدني:**
   - تمكين 3-5 مرنانات
   - إعدادات Freq: موزعة بين 1000-6500 هرتز
   - Decay: 100-200 مللي ثانية
   - LPF Freq: 4000-8000 هرتز
   - Mix: 15-30%

3. **تحسين الجهير:**
   - تمكين 1-2 مرنانات
   - إعدادات Freq: 50-150 هرتز
   - Decay: 50-100 مللي ثانية
   - LPF Freq: 1000-2000 هرتز
   - Mix: 10-25%

4. **محاكاة مكبر الصوت كامل النطاق:**
   - تمكين جميع المرنانات الخمسة
   - إعدادات Freq: 100 هرتز، 400 هرتز، 800 هرتز، 1600 هرتز، 3000 هرتز
   - Decay: أقصر تدريجيًا من المنخفض إلى العالي (100 مللي ثانية إلى 30 مللي ثانية)
   - LPF Freq: أعلى تدريجيًا من المنخفض إلى العالي (2000 هرتز إلى 4000 هرتز)
   - Mix: 20-40%

### دليل البدء السريع

1. **اختيار نقاط الرنين:**
   - ابدأ بتمكين مرنان واحد أو اثنين.
   - اضبط تردداتها لاستهداف المناطق التي تريد تحسينها.
   - لمزيد من التأثيرات المعقدة، أضف المزيد من المرنانات بترددات تكميلية.

2. **ضبط الطابع:**
   - استخدم معلمة `Decay` للتحكم في مدة استمرار الرنين.
   - شكل النغمة باستخدام عنصر التحكم `LPF Freq`.
   - أوقات الاضمحلال الأطول تخلق نغمات أكثر وضوحًا تشبه الجرس.

3. **المزج مع الأصل:**
   - استخدم `Mix` لموازنة التأثير مع المادة المصدر الخاصة بك.
   - ابدأ بقيم مزج أقل (10-20%) لتحسين دقيق.
   - زد للحصول على تأثيرات أكثر دراماتيكية.

4. **الضبط الدقيق:**
   - قم بإجراء تعديلات صغيرة على الترددات وأوقات الاضمحلال.
   - قم بتمكين/تعطيل المرنانات الفردية للعثور على المزيج المثالي.
   - تذكر أن التغييرات الدقيقة يمكن أن يكون لها تأثير كبير على الصوت العام.

---

## Time Alignment

أداة دقيقة تتيح لك ضبط توقيت قنوات الصوت بدقة مللي ثانية. مثالية لتصحيح مشاكل الطور أو إنشاء تأثيرات ستريو محددة.

### متى تستخدم
- إصلاح محاذاة الطور بين قنوات الاستريو
- تعويض اختلافات مسافة السماعات
- ضبط دقيق لصورة الاستريو
- تصحيح عدم تطابق التوقيت في التسجيلات

### المعلمات
- **التأخير (Delay)** - يتحكم في وقت التأخير (0 إلى 100 مللي ثانية)
  - 0 مللي ثانية: لا يوجد تأخير (التوقيت الأصلي)
  - القيم الأعلى: زيادة التأخير
  - تعديلات دقيقة للتحكم الدقيق
- **القناة (Channel)** - حدد القناة التي تريد تأخيرها
  - الكل (All): يؤثر على كلتا القناتين
  - اليسار (Left): يؤخر القناة اليسرى فقط
  - اليمين (Right): يؤخر القناة اليمنى فقط

### الاستخدامات الموصى بها

1. محاذاة السماعات
   - تعويض مسافات السماعات المختلفة
   - مطابقة التوقيت بين الشاشات
   - التكيف مع صوتيات الغرفة

2. تصحيح التسجيل
   - إصلاح مشاكل الطور بين الميكروفونات
   - محاذاة مصادر صوت متعددة
   - تصحيح التناقضات في التوقيت

3. التأثيرات الإبداعية
   - إنشاء توسيع ستريو دقيق
   - تصميم تأثيرات مكانية
   - تجربة توقيت القناة

تذكر: الهدف هو تعزيز متعة الاستماع لديك. جرب عناصر التحكم للعثور على الأصوات التي تضيف اهتمامًا وعمقًا لموسيقاك المفضلة دون التغلب عليها.
