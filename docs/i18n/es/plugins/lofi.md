# Plugins Lo-Fi

Una colección de plugins que agregan carácter vintage y cualidades nostálgicas a tu música. Estos efectos pueden hacer que la música digital moderna suene como si se reprodujera a través de equipos clásicos o darle ese popular sonido "lo-fi" que es tanto relajante como atmosférico.

## Lista de Plugins

- [Bit Crusher](#bit-crusher) - Crea sonidos retro de juegos y digitales vintage
- [Digital Error Emulator](#digital-error-emulator) - Simula varios errores de transmisión de audio digital
- [Noise Blender](#noise-blender) - Agrega textura atmosférica de fondo
- [Simple Jitter](#simple-jitter) - Crea sutiles imperfecciones digitales vintage

## Bit Crusher

Un efecto que recrea el sonido de dispositivos digitales vintage como consolas de juegos antiguas y samplers tempranos. Perfecto para agregar carácter retro o crear una atmósfera lo-fi.

### Guía de Carácter de Sonido
- Estilo Retro Gaming:
  - Crea sonidos clásicos de consola de 8 bits
  - Perfecto para nostalgia de música de videojuegos
  - Agrega textura pixelada al sonido
- Estilo Lo-Fi Hip Hop:
  - Crea ese sonido relajante de ritmos para estudiar
  - Degradación digital cálida y suave
  - Perfecto para escucha de fondo
- Efectos Creativos:
  - Crea sonidos únicos estilo glitch
  - Transforma música moderna en versiones retro
  - Agrega carácter digital a cualquier música

### Parámetros
- **Bit Depth** - Controla qué tan "digital" se vuelve el sonido (4 a 24 bits)
  - 4-6 bits: Sonido retro gaming extremo
  - 8 bits: Digital vintage clásico
  - 12-16 bits: Carácter lo-fi sutil
  - Valores más altos: Efecto muy suave
- **TPDF Dither** - Hace que el efecto suene más suave
  - On: Sonido más suave y musical
  - Off: Efecto más crudo y agresivo
- **ZOH Frequency** - Afecta la claridad general (4000Hz a 96000Hz)
  - Valores más bajos: Más retro, menos claro
  - Valores más altos: Efecto más claro y sutil
- **Bit Error** - Agrega carácter de hardware vintage (0.00% a 10.00%)
  - 0-1%: Calidez vintage sutil
  - 1-3%: Imperfecciones clásicas de hardware
  - 3-10%: Carácter lo-fi creativo
- **Random Seed** - Controla la unicidad de las imperfecciones (0 a 1000)
  - Diferentes valores crean diferentes "personalidades" vintage
  - El mismo valor siempre reproduce el mismo carácter
  - Perfecto para encontrar y guardar tu sonido vintage favorito

## Digital Error Emulator

Un efecto que simula el sonido de varios errores de transmisión de audio digital, desde sutiles glitches de interfaz profesional hasta imperfecciones de reproductores de CD vintage. Perfecto para agregar carácter digital vintage o crear experiencias de escucha únicas que te recuerden equipos de audio digital clásicos.

### Guía de Carácter de Sonido
- Glitches de Interfaz Digital Profesional:
  - Simula artefactos de transmisión S/PDIF, AES3 y MADI
  - Agrega el carácter de equipos profesionales envejecidos
  - Perfecto para sonido de estudio vintage
- Dropouts Digitales de Consumo:
  - Recrea el comportamiento de corrección de errores de reproductores de CD clásicos
  - Simula glitches de interfaz de audio USB
  - Ideal para nostalgia de música digital de los 90/2000
- Artefactos de Streaming y Audio Inalámbrico:
  - Simula errores de transmisión Bluetooth
  - Dropouts y artefactos de streaming de red
  - Imperfecciones de la vida digital moderna
- Texturas Digitales Creativas:
  - Interferencia RF y errores de transmisión inalámbrica
  - Efectos de corrupción de audio HDMI/DisplayPort
  - Posibilidades de sonido experimental únicas

### Parámetros
- **Bit Error Rate** - Controla la frecuencia de ocurrencia de errores (10^-12 a 10^-2)
  - Muy Raro (10^-10 a 10^-8): Artefactos sutiles ocasionales
  - Ocasional (10^-8 a 10^-6): Comportamiento clásico de equipos de consumo
  - Frecuente (10^-6 a 10^-4): Carácter vintage notable
  - Extremo (10^-4 a 10^-2): Efectos experimentales creativos
  - Por defecto: 10^-6 (equipos de consumo típicos)
- **Mode** - Selecciona el tipo de transmisión digital a simular
  - AES3/S-PDIF: Errores de bits de interfaz profesional con retención de muestra
  - ADAT/TDIF/MADI: Errores de ráfaga multicanal (retención o silencio)
  - HDMI/DP: Corrupción de fila de audio de pantalla o silenciamiento
  - USB/FireWire/Thunderbolt: Dropouts de microtrama con interpolación
  - Dante/AES67/AVB: Pérdida de paquetes de audio de red (64/128/256 muestras)
  - Bluetooth A2DP/LE: Errores de transmisión inalámbrica con ocultación
  - WiSA: Errores de bloques FEC de altavoces inalámbricos
  - RF Systems: Silenciamiento de radiofrecuencia e interferencia
  - CD Audio: Simulación de corrección de errores CIRC
  - Por defecto: CD Audio (más familiar para los oyentes de música)
- **Reference Fs (kHz)** - Establece la frecuencia de muestreo de referencia para cálculos de timing
  - Frecuencias disponibles: 44.1, 48, 88.2, 96, 176.4, 192 kHz
  - Afecta la precisión del timing para modos de audio de red
  - Por defecto: 48 kHz
- **Wet Mix** - Controla la mezcla entre audio original y procesado (0-100%)
  - Nota: Para simulación realista de errores digitales, mantener al 100%
  - Valores más bajos crean errores "parciales" irreales que no ocurren en sistemas digitales reales
  - Por defecto: 100% (comportamiento auténtico de errores digitales)

### Detalles de Modos

**Interfaces Profesionales:**
- AES3/S-PDIF: Errores de muestra única con retención de muestra anterior
- ADAT/TDIF/MADI: Errores de ráfaga de 32 muestras - retener últimas muestras buenas o silenciar
- HDMI/DisplayPort: Corrupción de fila de 192 muestras con errores a nivel de bit o silenciamiento completo

**Audio de Computadora:**
- USB/FireWire/Thunderbolt: Dropouts de microtrama con ocultación por interpolación
- Audio de Red (Dante/AES67/AVB): Pérdida de paquetes con diferentes opciones de tamaño y ocultación

**Inalámbrico de Consumo:**
- Bluetooth A2DP: Errores de transmisión post-códec con artefactos de vibración y decaimiento
- Bluetooth LE: Ocultación mejorada con filtrado de alta frecuencia y ruido
- WiSA: Silenciamiento de bloques FEC de altavoces inalámbricos

**Sistemas Especializados:**
- RF Systems: Eventos de silenciamiento de longitud variable simulando interferencia de radio
- CD Audio: Simulación de corrección de errores CIRC con comportamiento estilo Reed-Solomon

### Ajustes Recomendados para Diferentes Estilos

1. Carácter Sutil de Equipo Profesional
   - Modo: AES3/S-PDIF, BER: 10^-8, Fs: 48kHz, Wet: 100%
   - Perfecto para: Agregar envejecimiento sutil de equipo profesional

2. Experiencia Clásica de Reproductor de CD
   - Modo: CD Audio, BER: 10^-7, Fs: 44.1kHz, Wet: 100%
   - Perfecto para: Nostalgia de música digital de los 90

3. Glitches de Streaming Moderno
   - Modo: Dante/AES67 (128 samp), BER: 10^-6, Fs: 48kHz, Wet: 100%
   - Perfecto para: Imperfecciones de la vida digital contemporánea

4. Experiencia de Escucha Bluetooth
   - Modo: Bluetooth A2DP, BER: 10^-6, Fs: 48kHz, Wet: 100%
   - Perfecto para: Memorias de audio inalámbrico

5. Efectos Experimentales Creativos
   - Modo: RF Systems, BER: 10^-5, Fs: 48kHz, Wet: 100%
   - Perfecto para: Sonidos experimentales únicos

Nota: Todas las recomendaciones usan 100% de Wet Mix para comportamiento realista de errores digitales. Los valores de mezcla húmeda más bajos pueden usarse para efectos creativos, pero no representan cómo ocurren realmente los errores digitales reales.

## Noise Blender

Un efecto que agrega textura atmosférica de fondo a tu música, similar al sonido de discos de vinilo o equipos vintage. Perfecto para crear atmósferas acogedoras y nostálgicas.

### Guía de Carácter de Sonido
- Sonido de Equipo Vintage:
  - Recrea la calidez de equipos de audio antiguos
  - Agrega "vida" sutil a grabaciones digitales
  - Crea una sensación vintage auténtica
- Experiencia de Disco de Vinilo:
  - Agrega esa atmósfera clásica de tocadiscos
  - Crea una sensación acogedora y familiar
  - Perfecto para escucha nocturna
- Textura Ambiental:
  - Agrega fondo atmosférico
  - Crea profundidad y espacio
  - Hace que la música digital se sienta más orgánica

### Parámetros
- **Noise Type** - Elige el carácter de la textura de fondo
  - White: Textura más brillante y presente
  - Pink: Sonido más cálido y natural
- **Level** - Controla qué tan notable es el efecto (-96dB a 0dB)
  - Muy Sutil (-96dB a -72dB): Solo un toque
  - Suave (-72dB a -48dB): Textura notable
  - Fuerte (-48dB a -24dB): Carácter vintage dominante
- **Per Channel** - Crea un efecto más espacioso
  - On: Sonido más amplio e inmersivo
  - Off: Textura más enfocada y centrada

## Simple Jitter

Un efecto que agrega variaciones sutiles de tiempo para crear ese sonido digital vintage imperfecto. Puede hacer que la música suene como si se reprodujera a través de reproductores de CD antiguos o equipos digitales vintage.

### Guía de Carácter de Sonido
- Sensación Vintage Sutil:
  - Agrega inestabilidad suave como equipos antiguos
  - Crea un sonido más orgánico y menos perfecto
  - Perfecto para agregar carácter sutilmente
- Sonido Clásico de Reproductor de CD:
  - Recrea el sonido de reproductores digitales tempranos
  - Agrega carácter digital nostálgico
  - Genial para apreciación de música de los 90
- Efectos Creativos:
  - Crea efectos únicos de fluctuación
  - Transforma sonidos modernos en vintage
  - Agrega carácter experimental

### Parámetros
- **RMS Jitter** - Controla la cantidad de variación de tiempo (1ps a 10ms)
  - Sutil (1-10ps): Carácter vintage suave
  - Medio (10-100ps): Sensación clásica de reproductor de CD
  - Fuerte (100ps-1ms): Efectos creativos de fluctuación

### Ajustes Recomendados para Diferentes Estilos

1. Lo-Fi Relajante
   - Bit Crusher: 12 bits, dither activado, error de bit 1.5%, seed 42
   - Noise Blender: Ruido rosa, -60dB
   - Jitter: Ligero (10ps)
   - Digital Error: CD Audio, BER 10^-8, Wet 25%
   - Perfecto para: Sesiones de estudio, relajación

2. Retro Gaming
   - Bit Crusher: 8 bits, dither desactivado, error de bit 3%, seed 888
   - Noise Blender: Ruido blanco, -72dB
   - Jitter: Ninguno
   - Digital Error: AES3/S-PDIF, BER 10^-7, Wet 100%
   - Perfecto para: Apreciación de música de videojuegos

3. Digital Vintage
   - Bit Crusher: 16 bits, error de bit 0.8%, seed 123
   - Noise Blender: Ruido rosa, -66dB
   - Jitter: Medio (50ps)
   - Digital Error: CD Audio, BER 10^-7, Wet 100%
   - Perfecto para: Nostalgia musical de los 90

4. Lo-Fi Ambiental
   - Bit Crusher: 14 bits, dither activado, error de bit 2%, seed 456
   - Noise Blender: Ruido rosa, -54dB
   - Jitter: Ligero (20ps)
   - Digital Error: Bluetooth A2DP, BER 10^-8, Wet 100%
   - Perfecto para: Atmósfera de fondo

5. Ambiente de Streaming Moderno
   - Bit Crusher: Desactivado o 24 bits
   - Noise Blender: Ruido rosa, -78dB
   - Jitter: Muy ligero (5ps)
   - Digital Error: Dante/AES67 (64 samp), BER 10^-7, Wet 100%
   - Perfecto para: Imperfecciones digitales contemporáneas

¡Recuerda: Estos efectos están diseñados para agregar carácter y nostalgia a tu música. ¡Comienza con ajustes sutiles y ajusta al gusto!
