# Плагины эквалайзера

Коллекция плагинов, позволяющих настраивать различные аспекты звучания вашей музыки, от глубоких басов до чётких высоких частот. Эти инструменты помогают персонализировать ваш опыт прослушивания за счёт усиления или ослабления отдельных звуковых элементов.

## Список плагинов

- [15Band GEQ](#15band-geq) - Детальная настройка звука с 15 точными элементами управления
- [15Band PEQ](#15band-peq) - Профессиональный 15-полосный параметрический эквалайзер с максимальной гибкостью
- [5Band Dynamic EQ](#5band-dynamic-eq) - Эквалайзер на основе динамики, реагирующий на вашу музыку
- [5Band PEQ](#5band-peq) - Профессиональный параметрический эквалайзер с гибкими настройками
- [Band Pass Filter](#band-pass-filter) - Сосредоточение на определённых частотах
- [Hi Pass Filter](#hi-pass-filter) - Точное удаление нежелательных низких частот
- [Lo Pass Filter](#lo-pass-filter) - Точное удаление нежелательных высоких частот
- [Loudness Equalizer](#loudness-equalizer) - Коррекция баланса частот для прослушивания на низкой громкости
- [Narrow Range](#narrow-range) - Фокусировка на определённых участках звука
- [Tilt EQ](#tilt-eq) - Простой эквалайзер с наклоном звукового спектра
- [Tone Control](#tone-control) - Простая настройка басов, средних и высоких частот

## 15Band GEQ

Инструмент для детальной настройки звука с 15 независимыми элементами управления, каждый из которых влияет на определённую часть звукового спектра. Идеально подходит для точной настройки музыки по вашему вкусу.

### Руководство по улучшению прослушивания
- Басовый диапазон (25Hz-160Hz):
  - Усиление мощности бас-барабанов и глубокого баса
  - Настройка насыщенности басовых инструментов
  - Контроль суббаса, способного сотрясать помещение
- Нижний средний диапазон (250Hz-630Hz):
  - Настройка теплоты звучания музыки
  - Контроль полноты общего звучания
  - Уменьшение или усиление «толщины» звука
- Верхний средний диапазон (1kHz-2.5kHz):
  - Сделать вокал более чётким и присутствующим
  - Настроить выразительность основных инструментов
  - Контроль ощущения «выдвиженности» звука
- Высокие частоты (4kHz-16kHz):
  - Усиление чёткости и деталей
  - Контроль «искры» и «воздушности» в музыке
  - Настройка общей яркости

### Параметры
- **Band Gains** - Индивидуальные настройки для каждого диапазона частот (-12dB до +12dB)
  - Deep Bass
    - 25Hz: Самое глубокое ощущение баса
    - 40Hz: Сильное воздействие глубокого баса
    - 63Hz: Мощь баса
    - 100Hz: Полнота баса
    - 160Hz: Верхний бас
  - Lower Sound
    - 250Hz: Теплота звука
    - 400Hz: Полнота звука
    - 630Hz: Тело звука
  - Middle Sound
    - 1kHz: Основное присутствие звука
    - 1.6kHz: Чёткость звука
    - 2.5kHz: Детализация звука
  - High Sound
    - 4kHz: Чёткость звука
    - 6.3kHz: Блеск звука
    - 10kHz: Воздушность звука
    - 16kHz: Искристость звука

### Визуальное отображение
- График в реальном времени, отображающий ваши настройки звука
- Удобные ползунки с точным управлением
- Сброс настроек по умолчанию одним кликом

## 15Band PEQ

Профессиональный параметрический эквалайзер с широким управлением 15 полосами, обеспечивающий точные настройки частот. Идеален как для тонкой настройки звука, так и для корректирующей обработки аудио с максимальной гибкостью.

### Руководство по улучшению звучания
- Чёткость вокала и инструментов:
  - Используйте полосу 3.2kHz с умеренным Q (1.0-2.0) для естественного звучания
  - Применяйте узкие вырезы Q (4.0-8.0) для устранения резонансов
  - Добавьте лёгкую воздушность с помощью 10kHz high shelf (+2 до +4dB)
- Контроль качества баса:
  - Формируйте основы с помощью 100Hz пикового фильтра
  - Устраняйте резонансы помещения, используя узкое значение Q на определённых частотах
  - Создавайте плавное расширение баса с помощью low shelf
- Научная настройка звука:
  - Точно настраивайте конкретные частоты
  - Используйте анализаторы для определения проблемных областей
  - Применяйте точные коррекции с минимальным фазовым сдвигом

### Технические параметры
- **Precision-Engineered Bands**
  - 15 полностью настраиваемых полос частот
  - Начальные настройки частот:
    - 25Hz, 40Hz, 63Hz, 100Hz, 160Hz (глубокий бас)
    - 250Hz, 400Hz, 630Hz (нижний звуковой диапазон)
    - 1kHz, 1.6kHz, 2.5kHz (средний звуковой диапазон)
    - 4kHz, 6.3kHz, 10kHz, 16kHz (высокий звуковой диапазон)
- **Professional Controls Per Band**
  - Центральная частота: распределена по логарифмической шкале для оптимального охвата
  - Диапазон усиления: Точная регулировка ±20dB
  - Q Factor: От 0.1 (широкий) до 10.0 (точный)
  - Несколько типов фильтров:
    - Peaking: Симметричная настройка частоты
    - Low/High Pass: Уклон 12dB/октава
    - Low/High Shelf: Мягкое спектральное моделирование
    - Band Pass: Изоляция выбранных частот
    - Notch: Точное удаление частоты
    - AllPass: Выравнивание частоты с акцентом на фазу
- **Управление пресетами**
  - Импорт: Загрузка настроек эквалайзера из текстовых файлов стандартного формата
    - Пример формата:
      ```
      Preamp: -6.0 dB
      Filter 1: ON PK Fc 50 Hz Gain -3.0 dB Q 2.00
      Filter 2: ON HS Fc 12000 Hz Gain 4.0 dB Q 0.70
      ...
      ```

### Техническое отображение
- Визуализация частотной характеристики с высоким разрешением
- Интерактивные точки управления с точным отображением параметров
- Расчёт передаточной функции в реальном времени
- Калиброванная сетка частот и усиления
- Точные числовые показатели для всех параметров

## 5Band Dynamic EQ

Умный эквалайзер, который автоматически настраивает частотные диапазоны в зависимости от содержимого вашей музыки. Он сочетает точную эквализацию с динамической обработкой, реагирующей на изменения в реальном времени, создавая улучшенный опыт прослушивания без постоянных ручных настроек.

### Руководство по улучшению звучания
- Смягчение резких вокалов:
  - Используйте Peak-фильтр на 3000Hz с более высоким Ratio (4.0-10.0)
  - Установите умеренный Threshold (-24dB) и быстрый Attack (10ms)
  - Автоматически уменьшает резкость только когда вокал становится слишком агрессивным
- Повышение четкости и яркости:
  - Используйте усиление высоких частот в стиле BBE (Filter Type: Highshelf, SC Freq: 1200Hz, Ratio: 0.5, Attack: 1ms)
  - Средние частоты запускают высокие, обеспечивая естественную четкость звучания
  - Добавляет искристость музыке без постоянной яркости
- Контроль избыточного баса:
  - Используйте Lowshelf-фильтр на 100Hz с умеренным Ratio (2.0-4.0)
  - Сохраняет басовый эффект, предотвращая искажения динамиков
  - Идеально для басовой музыки на небольших колонках
- Адаптивная настройка звука:
  - Позволяет динамике музыки управлять балансом звука
  - Автоматически подстраивается под разные композиции и записи
  - Поддерживает стабильное качество звука во всём плейлисте

### Параметры
- **Five Band Controls** - Каждая из них с независимыми настройками
  - Band 1: 100Hz (область басов)
  - Band 2: 300Hz (нижний среднечастотный диапазон)
  - Band 3: 1000Hz (средние частоты)
  - Band 4: 3000Hz (верхний среднечастотный диапазон)
  - Band 5: 10000Hz (высокие частоты)
- **Band Settings**
  - Filter Type: Выберите между Peak, Lowshelf или Highshelf
  - Frequency: Точно настройте центральную/граничную частоту (20Hz-20kHz)
  - Q: Управляйте шириной полосы/резкостью (0.1-10.0)
  - Max Gain: Установите максимальное усиление (0-24dB)
  - Threshold: Установите уровень, при котором начинается обработка (-60dB до 0dB)
  - Ratio: Управляйте интенсивностью обработки (0.1-10.0)
    - Ниже 1.0: Expander (усиливает, когда сигнал превышает Threshold)
    - Выше 1.0: Compressor (ослабляет

## 5Band PEQ

Профессиональный параметрический эквалайзер, основанный на научных принципах, предлагающий пять полностью настраиваемых диапазонов с точным управлением частотой. Идеален как для тонкой настройки звука, так и для корректирующей обработки аудио.

### Руководство по улучшению звучания
- Чёткость вокала и инструментов:
  - Используйте полосу 3.2kHz с умеренным Q (1.0-2.0) для естественного звучания
  - Применяйте узкие вырезы Q (4.0-8.0) для устранения резонансов
  - Добавьте лёгкую воздушность с помощью 10kHz high shelf (+2 до +4dB)
- Контроль качества баса:
  - Формируйте основы с помощью 100Hz пикового фильтра
  - Устраняйте резонансы помещения, используя узкое значение Q на определённых частотах
  - Создавайте плавное расширение баса с помощью low shelf
- Научная настройка звука:
  - Точно настраивайте конкретные частоты
  - Используйте анализаторы для определения проблемных областей
  - Применяйте точные коррекции с минимальным фазовым сдвигом

### Технические параметры
- **Precision-Engineered Bands**
  - Band 1: 100Hz (Управление Sub & Bass)
  - Band 2: 316Hz (Определение нижнего среднечастотного диапазона)
  - Band 3: 1.0kHz (Присутствие средних частот)
  - Band 4: 3.2kHz (Детализация верхнего среднечастотного диапазона)
  - Band 5: 10kHz (Расширение высоких частот)
- **Professional Controls Per Band**
  - Центральная частота: распределена по логарифмической шкале для оптимального охвата
  - Диапазон усиления: Точная регулировка ±20dB
  - Q Factor: От 0.1 до 10.0 с высокой точностью
  - Несколько типов фильтров:
    - Peaking: Симметричная настройка частоты
    - Low/High Pass: Уклон 12dB/октава
    - Low/High Shelf: Мягкое спектральное моделирование
    - Band Pass: Изоляция выбранных частот
    - Notch: Точное удаление частоты
    - AllPass: Выравнивание частоты с акцентом на фазу

### Техническое отображение
- Визуализация частотной характеристики с высоким разрешением
- Интерактивные точки управления с точным отображением параметров
- Расчёт передаточной функции в реальном времени
- Калиброванная сетка частот и усиления
- Точные числовые показатели для всех параметров

## Band Pass Filter

Прецизионный полосовой фильтр, сочетающий фильтры высоких и низких частот, позволяющий пропускать только частоты определённого диапазона. Основан на фильтре Линквица-Райли для оптимального фазового отклика и прозрачного качества звука.

### Руководство по улучшению прослушивания
- Фокус на вокальном диапазоне:
  - Установите HPF между 100-300Гц и LPF между 4-8кГц для выделения четкости вокала
  - Используйте умеренные наклоны (-24дБ/окт) для естественного звучания
  - Помогает вокалу выделиться в сложных миксах
- Создание специальных эффектов:
  - Настройте узкие частотные диапазоны для эффектов телефона, радио или мегафона
  - Используйте более крутые наклоны (-36дБ/окт или выше) для драматического фильтрования
  - Экспериментируйте с различными частотными диапазонами для создания креативных звуков
- Очистка определенных частотных диапазонов:
  - Нацеливайтесь на проблемные частоты с помощью точного контроля
  - При необходимости используйте разные наклоны для секций высоких и низких частот
  - Идеально подходит для одновременного удаления низкочастотного гула и высокочастотного шума

### Параметры
- **HPF Frequency (Гц)** - Управляет точкой фильтрации низких частот (от 1Гц до 40000Гц)
  - Низкие значения: удаляются только самые низкие частоты
  - Высокие значения: удаляется больше низких частот
  - Регулируйте в зависимости от низкочастотного содержания, которое хотите исключить
- **HPF Slope** - Управляет интенсивностью снижения частот ниже точки среза
  - Off: фильтрация не применяется
  - -12дБ/окт: мягкая фильтрация (LR2 - Линквиц-Райли 2-го порядка)
  - -24дБ/окт: стандартная фильтрация (LR4 - Линквиц-Райли 4-го порядка)
  - -36дБ/окт: усиленная фильтрация (LR6 - Линквиц-Райли 6-го порядка)
  - -48дБ/окт: очень сильная фильтрация (LR8 - Линквиц-Райли 8-го порядка)
- **LPF Frequency (Гц)** - Управляет точкой фильтрации высоких частот (от 1Гц до 40000Гц)
  - Низкие значения: удаляется больше высоких частот
  - Высокие значения: удаляются только самые высокие частоты
  - Регулируйте в зависимости от высокочастотного содержания, которое хотите исключить
- **LPF Slope** - Управляет интенсивностью снижения частот выше точки среза
  - Off: фильтрация не применяется
  - -12дБ/окт: мягкая фильтрация (LR2 - Линквиц-Райли 2-го порядка)
  - -24дБ/окт: стандартная фильтрация (LR4 - Линквиц-Райли 4-го порядка)
  - -36дБ/окт: усиленная фильтрация (LR6 - Линквиц-Райли 6-го порядка)
  - -48дБ/окт: очень сильная фильтрация (LR8 - Линквиц-Райли 8-го порядка)

### Визуальное отображение
- График частотного отклика в реальном времени с логарифмической шкалой частот
- Четкая визуализация обоих наклонов фильтра и точек среза
- Интерактивные элементы управления для точной настройки
- Частотная сетка с маркерами на ключевых опорных точках

## Hi Pass Filter

Прецизионный фильтр высоких частот, удаляющий нежелательные низкие частоты при сохранении чистоты высоких. Основан на конструкции фильтра Linkwitz-Riley для оптимальной фазовой характеристики и прозрачного качества звука.

### Руководство по улучшению прослушивания
- Устранение нежелательного гула:
  - Установите частоту между 20-40Hz для устранения инфразвукового шума
  - Используйте более крутые уклоны (-24dB/oct или более) для чистого баса
  - Идеально подходит для виниловых записей или живых выступлений с вибрацией сцены
- Очистка музыки с преобладанием баса:
  - Установите частоту между 60-100Hz для более плотного баса
  - Используйте умеренные уклоны (-12dB/oct до -24dB/oct) для естественного перехода
  - Помогает предотвратить перегрузку динамиков и улучшает чёткость
- Создание спецэффектов:
  - Установите частоту между 200-500Hz для эффекта голосовой связи (телефонный звук)
  - Используйте крутые уклоны (-48dB/oct или более) для драматической фильтрации
  - Сочетайте с Lo Pass Filter для эффектов полосового фильтра

### Параметры
- **Frequency (Hz)** - Управляет тем, где отсекаются низкие частоты (1Hz до 40000Hz)
  - При более низких значениях удаляются только самые низкие частоты
  - При более высоких значениях удаляется больше низких частот
  - Настраивайте в зависимости от конкретного низкочастотного содержания, которое вы хотите устранить
- **Slope** - Определяет, насколько резко уменьшаются частоты ниже порога
  - Off: Фильтрация не применяется
  - -12dB/oct: Лёгкая фильтрация (LR2 - 2nd order Linkwitz-Riley)
  - -24dB/oct: Стандартная фильтрация (LR4 - 4th order Linkwitz-Riley)
  - -36dB/oct: Более сильная фильтрация (LR6 - 6th order Linkwitz-Riley)
  - -48dB/oct: Очень сильная фильтрация (LR8 - 8th order Linkwitz-Riley)
  - -60dB/oct до -96dB/oct: Чрезвычайно крутая фильтрация для специальных применений

### Визуальное отображение
- График частотной характеристики в реальном времени с логарифмической шкалой
- Чёткая визуализация уклона фильтра и точки среза
- Интерактивное управление для точной настройки
- Сетка частот с маркерами на ключевых опорных точках

## Lo Pass Filter

Прецизионный фильтр низких частот, удаляющий нежелательные высокие частоты, сохраняя при этом теплоту и полноту низких. Основан на конструкции фильтра Linkwitz-Riley для оптимальной фазовой характеристики и прозрачного качества звука.

### Руководство по улучшению прослушивания
- Снижение резкости и свистящих звуков:
  - Установите частоту между 8-12kHz для смягчения резких записей
  - Используйте умеренные уклоны (-12dB/oct до -24dB/oct) для естественного звучания
  - Способствует снижению усталости при прослушивании ярких записей
- Придание теплоты цифровым записям:
  - Установите частоту между 12-16kHz для смягчения цифровой «остроты»
  - Используйте мягкие уклоны (-12dB/oct) для тонкого эффекта согревания
  - Создаёт более аналогичный звуковой характер
- Создание спецэффектов:
  - Установите частоту между 1-3kHz для эффекта старого радио
  - Используйте крутые уклоны (-48dB/oct или более) для драматической фильтрации
  - Сочетайте с Hi Pass Filter для эффектов полосового фильтра
- Контроль шума и шипения:
  - Установите частоту чуть выше музыкального контента (обычно 14-18kHz)
  - Используйте более крутые уклоны (-36dB/oct или более) для эффективного контроля шума
  - Уменьшает шипение пленки или фоновый шум, сохраняя основное содержание музыки

### Параметры
- **Frequency (Hz)** - Определяет, где отсекаются высокие частоты (1Hz до 40000Hz)
  - При более низких значениях удаляется больше высоких частот
  - При более высоких значениях удаляются только самые высокие частоты
  - Настраивайте в зависимости от конкретного высокочастотного содержания, которое вы хотите устранить
- **Slope** - Определяет, насколько резко снижаются частоты выше порога
  - Off: Фильтрация не применяется
  - -12dB/oct: Лёгкая фильтрация (LR2 - 2nd order Linkwitz-Riley)
  - -24dB/oct: Стандартная фильтрация (LR4 - 4th order Linkwitz-Riley)
  - -36dB/oct: Более сильная фильтрация (LR6 - 6th order Linkwitz-Riley)
  - -48dB/oct: Очень сильная фильтрация (LR8 - 8th order Linkwitz-Riley)
  - -60dB/oct до -96dB/oct: Чрезвычайно крутая фильтрация для специальных применений

### Визуальное отображение
- График частотной характеристики в реальном времени с логарифмической шкалой
- Чёткая визуализация уклона фильтра и точки среза
- Интерактивное управление для точной настройки
- Сетка частот с маркерами на ключевых опорных точках

## Loudness Equalizer

Специализированный эквалайзер, который автоматически корректирует баланс частот в зависимости от громкости прослушивания. Этот плагин компенсирует сниженное восприятие низких и высоких частот человеческим ухом при низкой громкости, обеспечивая стабильное и приятное прослушивание вне зависимости от уровня воспроизведения.

### Руководство по улучшению прослушивания
- Прослушивание на низкой громкости:
  - Усиливает басовые и высокие частоты
  - Сохраняет музыкальный баланс при тихом прослушивании
  - Компенсирует особенности человеческого слуха
- Обработка, зависящая от громкости:
  - Более сильное усиление при низкой громкости
  - Постепенное снижение обработки с увеличением громкости
  - Естественное звучание на высоких уровнях прослушивания
- Баланс частот:
  - Low shelf для усиления баса (100-300Hz)
  - High shelf для усиления высоких (3-6kHz)
  - Плавный переход между диапазонами частот

### Параметры
- **Average SPL** - Текущий уровень прослушивания (60dB до 85dB)
  - Более низкие значения: больше усиления
  - Более высокие значения: меньше усиления
  - Представляет типичный уровень прослушивания
- **Low Frequency Controls** 
  - Frequency: Центр усиления баса (100Hz до 300Hz)
  - Gain: Максимальное усиление баса (0dB до 15dB)
  - Q: Характеристика усиления баса (0.5 до 1.0)
- **High Frequency Controls**
  - Frequency: Центр усиления высоких (3kHz до 6kHz)
  - Gain: Максимальное усиление высоких (0dB до 15dB)
  - Q: Характеристика усиления высоких (0.5 до 1.0)

### Визуальное отображение
- График частотной характеристики в реальном времени
- Интерактивное управление параметрами
- Визуализация кривой, зависящей от громкости
- Точные числовые показатели

## Narrow Range

Инструмент, позволяющий сфокусироваться на определённых частях музыки путём фильтрации нежелательных частот. Полезен для создания спецэффектов или устранения нежелательных звуков.

### Руководство по улучшению прослушивания
- Создание уникальных звуковых эффектов:
  - Эффект «телефонного голоса»
  - Звук «старого радио»
  - Эффект «подводного звучания»
- Фокусировка на отдельных инструментах:
  - Изолировать басовые частоты
  - Сфокусироваться на диапазоне вокала
  - Выделить определённые инструменты
- Устранение нежелательных звуков:
  - Снизить низкочастотный гул
  - Урезать чрезмерное высокочастотное шипение
  - Сосредоточиться на самых важных частях музыки

### Параметры
- **HPF Frequency** - Определяет, с какой частоты начинают ослабляться низкие звуки (20Hz до 1000Hz)
  - Более высокие значения: Удаляет больше баса
  - Более низкие значения: Сохраняет больше баса
  - Начните с низких значений и корректируйте по вкусу
- **HPF Slope** - Насколько быстро ослабляются низкие звуки (0 до -48 dB/octave)
  - 0dB: Без ослабления (off)
  - От -6dB до -48dB: Увеличивающееся ослабление с шагом 6dB
- **LPF Frequency** - Определяет, с какой частоты начинают ослабляться высокие звуки (200Hz до 20000Hz)
  - Более низкие значения: Удаляет больше высоких частот
  - Более высокие значения: Сохраняет больше высоких частот
  - Начните с высоких значений и при необходимости снижайте
- **LPF Slope** - Насколько быстро ослабляются высокие звуки (0 до -48 dB/octave)
  - 0dB: Без ослабления (off)
  - От -6dB до -48dB: Увеличивающееся ослабление с шагом 6dB

### Визуальное отображение
- Чёткий график, отображающий частотную характеристику
- Удобное регулирование частот
- Простые кнопки выбора уклона

## Tilt EQ

Простой, но эффективный эквалайзер, плавно изменяющий баланс частот вашей музыки. Разработан для тонкой настройки, позволяющей сделать звук теплее или ярче без сложных регулировок. Идеально подходит для быстрой адаптации общего тонального баланса под ваши предпочтения.

### Руководство по улучшению звука
- Сделать музыку теплее:
  - Используйте отрицательные значения усиления для снижения высоких частот и усиления низких
  - Подходит для ярких записей или наушников с резким звуком
  - Создает уютное теплое звучание
- Сделать музыку ярче:
  - Используйте положительные значения усиления для подчеркивания высоких частот и снижения низких
  - Идеально для глухих записей или акустики с приглушенным звуком
  - Добавляет четкости и воздушности
- Тонкие настройки:
  - Используйте небольшие значения усиления для точной регулировки
  - Адаптируйте баланс под акустику помещения

### Параметры
- **Pivot Frequency** - Центральная частота наклона (20Hz ~ 20kHz)
  - Определяет точку изменения частотной характеристики
- **Slope** - Наклон вокруг центральной частоты (-12dB ~ +12dB)
  - Регулирует интенсивность эффекта

### Отображение
- Интуитивный ползунок регулировки
- График АЧХ в реальном времени
- Четкая индикация текущих значений
- Кнопка быстрого сброса

## Tone Control

Простой трёхполосный регулятор звука для быстрой и лёгкой персонализации звучания. Идеален для базовой настройки звука без излишней технической сложности.

### Руководство по улучшению музыки
- Классическая музыка:
  - Лёгкое усиление высоких для большего количества деталей в струнных
  - Нежное усиление басов для более полного звучания оркестра
  - Нейтральные средние для естественного звучания
- Рок/Поп музыка:
  - Умеренное усиление басов для большего эффекта
  - Незначительное снижение средних для более чистого звучания
  - Усиление высоких для чётких тарелок и деталей
- Джазовая музыка:
  - Тёплый бас для более полного звучания
  - Чёткие средние для детализации инструментов
  - Нежное усиление высоких для блеска тарелок
- Электронная музыка:
  - Сильный бас для глубокого эффекта
  - Сниженные средние для более чистого звучания
  - Усиленные высокие для чётких деталей

### Параметры
- **Bass** - Управляет низкими звуками (-24dB до +24dB)
  - Увеличьте для более мощного баса
  - Уменьшите для более лёгкого, чистого звучания
  - Влияет на «массу» музыки
- **Mid** - Управляет основной составляющей звука (-24dB до +24dB)
  - Увеличьте для более выраженного вокала/инструментов
  - Уменьшите для более просторного звучания
  - Влияет на «полноту» музыки
- **Treble** - Управляет высокими звуками (-24dB до +24dB)
  - Увеличьте для большего блеска и деталей
  - Уменьшите для более гладкого, мягкого звучания
  - Влияет на «яркость» музыки

### Визуальное отображение
- Легко читаемый график, показывающий ваши настройки
- Простые ползунки для каждого управления
- Кнопка быстрого сброса
