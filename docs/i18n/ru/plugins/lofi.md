# Lo-Fi Audio Plugins

Коллекция плагинов, добавляющих винтажный характер и ностальгические качества вашей музыке. Эти эффекты могут заставить современную цифровую музыку звучать так, как будто она воспроизводится через классическое оборудование, или придать ей популярное "lo-fi" звучание, которое одновременно расслабляет и создает атмосферу.

## Plugin List

- [Bit Crusher](#bit-crusher) - Создает звуки в стиле ретро-игр и винтажной цифровой техники
- [Digital Error Emulator](#digital-error-emulator) - Симулирует различные ошибки передачи цифрового звука
- [Noise Blender](#noise-blender) - Добавляет атмосферную фоновую текстуру
- [Simple Jitter](#simple-jitter) - Создает тонкие винтажные цифровые несовершенства

## Bit Crusher

Эффект, воссоздающий звучание винтажных цифровых устройств, таких как старые игровые консоли и ранние сэмплеры. Идеально подходит для добавления ретро-характера или создания lo-fi атмосферы.

### Sound Character Guide
- Стиль ретро-игр:
  - Создает классические 8-битные консольные звуки
  - Идеально для ностальгии по видеоиграм
  - Добавляет пиксельную текстуру звуку
- Стиль Lo-Fi Hip Hop:
  - Создает тот расслабляющий звук для учебы
  - Теплая, мягкая цифровая деградация
  - Идеально для фонового прослушивания
- Творческие эффекты:
  - Создание уникальных глитч-звуков
  - Превращение современной музыки в ретро-версии
  - Добавление цифрового характера любой музыке

### Parameters
- **Bit Depth** - Контролирует, насколько "цифровым" становится звук (от 4 до 24 бит)
  - 4-6 бит: Экстремальный звук ретро-игр
  - 8 бит: Классический винтажный цифровой
  - 12-16 бит: Тонкий lo-fi характер
  - Более высокие значения: Очень мягкий эффект
- **TPDF Dither** - Делает эффект более гладким
  - On: Более мягкий, музыкальный звук
  - Off: Сырой, более агрессивный эффект
- **ZOH Frequency** - Влияет на общую четкость (от 4000Hz до 96000Hz)
  - Более низкие значения: Более ретро, менее четко
  - Более высокие значения: Четче, более тонкий эффект
- **Bit Error** - Добавляет характер винтажного оборудования (от 0.00% до 10.00%)
  - 0-1%: Тонкое винтажное тепло
  - 1-3%: Классические аппаратные несовершенства
  - 3-10%: Творческий lo-fi характер
- **Random Seed** - Контролирует уникальность несовершенств (от 0 до 1000)
  - Разные значения создают разные винтажные "личности"
  - Одно и то же значение всегда воспроизводит один и тот же характер
  - Идеально для поиска и сохранения вашего любимого винтажного звучания

## Digital Error Emulator

Эффект, который симулирует звук различных ошибок передачи цифрового звука, от тонких глитчей профессиональных интерфейсов до несовершенств винтажных CD-плееров. Идеально подходит для добавления винтажного цифрового характера или создания уникальных впечатлений от прослушивания, напоминающих классическое цифровое аудиооборудование.

### Руководство по звуковому характеру
- Глитчи профессиональных цифровых интерфейсов:
  - Симулирует артефакты передачи S/PDIF, AES3 и MADI
  - Добавляет характер стареющего профессионального оборудования
  - Идеально для винтажного студийного звука
- Цифровые дропауты потребительского уровня:
  - Воссоздает поведение коррекции ошибок классических CD-плееров
  - Симулирует глитчи USB аудиоинтерфейсов
  - Идеально для ностальгии по цифровой музыке 90-х/2000-х
- Артефакты стриминга и беспроводного аудио:
  - Симулирует ошибки передачи Bluetooth
  - Дропауты и артефакты сетевого стриминга
  - Несовершенства современной цифровой жизни
- Креативные цифровые текстуры:
  - RF помехи и ошибки беспроводной передачи
  - Эффекты повреждения аудио HDMI/DisplayPort
  - Уникальные возможности экспериментального звука

### Параметры
- **Bit Error Rate** - Контролирует частоту возникновения ошибок (от 10^-12 до 10^-2)
  - Очень редко (10^-10 до 10^-8): Тонкие случайные артефакты
  - Иногда (10^-8 до 10^-6): Классическое поведение потребительского оборудования
  - Часто (10^-6 до 10^-4): Заметный винтажный характер
  - Экстремально (10^-4 до 10^-2): Креативные экспериментальные эффекты
  - По умолчанию: 10^-6 (типичное потребительское оборудование)
- **Mode** - Выбирает тип цифровой передачи для симуляции
  - AES3/S-PDIF: Битовые ошибки профессионального интерфейса с удержанием сэмпла
  - ADAT/TDIF/MADI: Многоканальные пакетные ошибки (удержание или заглушение)
  - HDMI/DP: Повреждение строки аудио дисплея или заглушение
  - USB/FireWire/Thunderbolt: Дропауты микрофреймов с интерполяцией
  - Dante/AES67/AVB: Потеря пакетов сетевого аудио (64/128/256 сэмплов)
  - Bluetooth A2DP/LE: Ошибки беспроводной передачи со скрытием
  - WiSA: Ошибки FEC блоков беспроводных колонок
  - RF Systems: Радиочастотное подавление и помехи
  - CD Audio: Симуляция коррекции ошибок CIRC
  - По умолчанию: CD Audio (наиболее знакомый слушателям музыки)
- **Reference Fs (kHz)** - Устанавливает референсную частоту дискретизации для расчетов тайминга
  - Доступные частоты: 44.1, 48, 88.2, 96, 176.4, 192 кГц
  - Влияет на точность тайминга для режимов сетевого аудио
  - По умолчанию: 48 кГц
- **Wet Mix** - Контролирует смешивание оригинального и обработанного аудио (0-100%)
  - Примечание: Для реалистичной симуляции цифровых ошибок держите на 100%
  - Низкие значения создают нереалистичные "частичные" ошибки, которые не происходят в реальных цифровых системах
  - По умолчанию: 100% (аутентичное поведение цифровых ошибок)

### Детали режимов

**Профессиональные интерфейсы:**
- AES3/S-PDIF: Ошибки одного сэмпла с удержанием предыдущего сэмпла
- ADAT/TDIF/MADI: Пакетные ошибки 32 сэмпла - удержание последних хороших сэмплов или заглушение
- HDMI/DisplayPort: Повреждение строки 192 сэмпла с битовыми ошибками или полным заглушением

**Компьютерное аудио:**
- USB/FireWire/Thunderbolt: Дропауты микрофреймов со скрытием интерполяцией
- Сетевое аудио (Dante/AES67/AVB): Потеря пакетов с различными вариантами размера и скрытием

**Потребительское беспроводное:**
- Bluetooth A2DP: Пост-кодековые ошибки передачи с артефактами дрожания и затухания
- Bluetooth LE: Улучшенное скрытие с высокочастотной фильтрацией и шумом
- WiSA: Заглушение FEC блоков беспроводных колонок

**Специализированные системы:**
- RF Systems: События подавления переменной длины, симулирующие радиопомехи
- CD Audio: Симуляция коррекции ошибок CIRC с поведением в стиле Reed-Solomon

### Рекомендуемые настройки для разных стилей

1. Тонкий характер профессионального оборудования
   - Режим: AES3/S-PDIF, BER: 10^-8, Fs: 48кГц, Wet: 100%
   - Идеально для: Добавления тонкого старения профессионального оборудования

2. Классический опыт CD-плеера
   - Режим: CD Audio, BER: 10^-7, Fs: 44.1кГц, Wet: 100%
   - Идеально для: Ностальгии по цифровой музыке 90-х

3. Современные глитчи стриминга
   - Режим: Dante/AES67 (128 samp), BER: 10^-6, Fs: 48кГц, Wet: 100%
   - Идеально для: Несовершенств современной цифровой жизни

4. Опыт прослушивания через Bluetooth
   - Режим: Bluetooth A2DP, BER: 10^-6, Fs: 48кГц, Wet: 100%
   - Идеально для: Воспоминаний о беспроводном аудио

5. Креативные экспериментальные эффекты
   - Режим: RF Systems, BER: 10^-5, Fs: 48кГц, Wet: 100%
   - Идеально для: Уникальных экспериментальных звуков

Примечание: Все рекомендации используют 100% Wet Mix для реалистичного поведения цифровых ошибок. Более низкие значения влажного микса могут использоваться для креативных эффектов, но они не представляют того, как на самом деле происходят реальные цифровые ошибки.

## Noise Blender

Эффект, добавляющий атмосферную фоновую текстуру вашей музыке, похожую на звук виниловых пластинок или винтажного оборудования. Идеально подходит для создания уютной, ностальгической атмосферы.

### Sound Character Guide
- Звук винтажного оборудования:
  - Воссоздает теплоту старой аудиотехники
  - Добавляет тонкую "жизнь" цифровым записям
  - Создает аутентичное винтажное ощущение
- Опыт виниловой пластинки:
  - Добавляет ту классическую атмосферу проигрывателя
  - Создает уютное, знакомое ощущение
  - Идеально для ночного прослушивания
- Атмосферная текстура:
  - Добавляет атмосферный фон
  - Создает глубину и пространство
  - Делает цифровую музыку более органичной

### Parameters
- **Noise Type** - Выбирает характер фоновой текстуры
  - White: Более яркая, присутствующая текстура
  - Pink: Более теплый, естественный звук
- **Level** - Контролирует заметность эффекта (от -96dB до 0dB)
  - Очень тонко (-96dB до -72dB): Едва заметно
  - Мягко (-72dB до -48dB): Заметная текстура
  - Сильно (-48dB до -24dB): Доминирующий винтажный характер
- **Per Channel** - Создает более пространственный эффект
  - On: Более широкий, иммерсивный звук
  - Off: Более сфокусированная, центрированная текстура

## Simple Jitter

Эффект, добавляющий тонкие вариации времени для создания того несовершенного, винтажного цифрового звука. Может заставить музыку звучать так, как будто она воспроизводится через старые CD-плееры или винтажное цифровое оборудование.

### Sound Character Guide
- Тонкое винтажное ощущение:
  - Добавляет мягкую нестабильность как у старого оборудования
  - Создает более органичный, менее совершенный звук
  - Идеально для тонкого добавления характера
- Звук классического CD-плеера:
  - Воссоздает звук ранних цифровых плееров
  - Добавляет ностальгический цифровой характер
  - Отлично подходит для ценителей музыки 90-х
- Творческие эффекты:
  - Создание уникальных эффектов колебания
  - Превращение современных звуков в винтажные
  - Добавление экспериментального характера

### Parameters
- **RMS Jitter** - Контролирует величину временных вариаций (от 1ps до 10ms)
  - Тонко (1-10ps): Мягкий винтажный характер
  - Средне (10-100ps): Классическое ощущение CD-плеера
  - Сильно (100ps-1ms): Творческие эффекты колебания

### Recommended Settings for Different Styles

1. Расслабляющий Lo-Fi
   - Bit Crusher: 12 бит, dither включен, ошибка бит 1.5%, сид 42
   - Noise Blender: Pink noise, -60dB
   - Jitter: Легкий (10ps)
   - Digital Error: CD Audio, BER 10^-8, Wet 25%
   - Идеально для: Учебных сессий, расслабления

2. Ретро-игры
   - Bit Crusher: 8 бит, dither выключен, ошибка бит 3%, сид 888
   - Noise Blender: White noise, -72dB
   - Jitter: Отсутствует
   - Digital Error: AES3/S-PDIF, BER 10^-7, Wet 100%
   - Идеально для: Ценителей музыки видеоигр

3. Винтажный цифровой
   - Bit Crusher: 16 бит, ошибка бит 0.8%, сид 123
   - Noise Blender: Pink noise, -66dB
   - Jitter: Средний (50ps)
   - Digital Error: CD Audio, BER 10^-7, Wet 100%
   - Идеально для: Ностальгии по музыке 90-х

4. Атмосферный Lo-Fi
   - Bit Crusher: 14 бит, dither включен, ошибка бит 2%, сид 456
   - Noise Blender: Pink noise, -54dB
   - Jitter: Легкий (20ps)
   - Digital Error: Bluetooth A2DP, BER 10^-8, Wet 100%
   - Идеально для: Фоновой атмосферы

5. Современная атмосфера стриминга
   - Bit Crusher: Выключен или 24 бита
   - Noise Blender: Pink noise, -78dB
   - Jitter: Очень легкий (5ps)
   - Digital Error: Dante/AES67 (64 samp), BER 10^-7, Wet 100%
   - Идеально для: Современных цифровых несовершенств

Помните: Эти эффекты предназначены для добавления характера и ностальгии вашей музыке. Начните с тонких настроек и регулируйте по вкусу!
