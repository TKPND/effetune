---
title: "Plugins de Análise - EffeTune"
description: "Plugins de análise de áudio, incluindo Chroma Spiral, Level Meter, Note Spectrogram, Oscilloscope, Pitch Meter, Spectrogram, Spectrum Analyzer e Stereo Meter."
lang: pt
---

# Plugins de Análise

Uma coleção de plugins que permitem visualizar sua música de maneiras fascinantes. Essas ferramentas visuais ajudam você a entender o que está ouvindo, mostrando diferentes aspectos do som e tornando sua experiência de audição mais envolvente e interativa.

## Lista de Plugins

- [Chroma Spiral](#chroma-spiral) - Distribui os componentes de frequência numa espiral de notas e oitavas
- [Level Meter](#level-meter) - Mostra o nível do sinal digital e possível clipping
- [Note Spectrogram](#note-spectrogram) - Mostra as alturas estimadas ao longo do tempo em um piano roll
- [Oscilloscope](#oscilloscope) - Exibe visualização da forma de onda em tempo real
- [Pitch Meter](#pitch-meter) - Acompanha uma frequência fundamental e sua afinação ao longo do tempo
- [Spectrogram](#spectrogram) - Cria padrões visuais bonitos a partir da sua música
- [Spectrum Analyzer](#spectrum-analyzer) - Mostra as diferentes frequências na sua música
- [Stereo Meter](#stereo-meter) - Visualiza o balanço estéreo e o movimento do som

## Chroma Spiral

Mostra onde os componentes de frequência da música se situam entre as 12 notas e as oitavas, sem alterar o som. Use-o para observar harmônicos sobrepostos, comparar a faixa de uma voz e de um baixo ou examinar a extensão de um instrumento.

### Guia de uso

- Sustente uma nota e observe sua posição e as posições iluminadas pelos harmônicos. Uma nota só pode iluminar vários nomes; isso não significa que todas foram tocadas separadamente.
- Acompanhe um acorde ou uma melodia para ver a mudança das posições ativas. O gráfico pode sugerir padrões tonais, mas não identifica acordes nem tonalidades.
- Para observar a afinação, veja se um ponto brilhante ou a borda de uma área colorida aparece entre as marcas das notas. Para ler em cents o desvio de uma frequência fundamental, use Pitch Meter.
- Pressione o gráfico com o mouse, o dedo ou uma caneta para ouvir uma onda senoidal na posição escolhida da espiral. Arraste para mudar o tom; solte ou cancele o gesto para parar o som. Essa prévia funciona com todas as opções de **Color**.

### Parâmetros

- **Color** - Escolhe como o espectro é desenhado. A mesma espiral de referência permanece visível ao fundo com todas as opções, mesmo durante o silêncio.
  - **Normal** (padrão): mostra cada célula de frequência como um ponto na cor do traçado do gráfico do tema. Seu brilho acompanha o nível da célula e sua área cresce proporcionalmente a esse nível, facilitando a visualização das frequências mais fracas. No nível máximo, o raio do ponto alcança metade da distância até a volta seguinte.
  - **Normal 2**: colore da posição de cada frequência na espiral até seu nível na cor do traçado do gráfico, sem traçar o contorno dos dados.
  - **Note Colors**: mostra os mesmos pontos de Normal, mas com uma cor diferente para cada nota, repetida em todas as oitavas.
- **Lowest Octave** (1 a 8; padrão: 1) - Define a oitava mais interna. Aumente para se concentrar nos sons agudos.
- **Highest Octave** (1 a 9; padrão: 7) - Define a oitava mais externa. Reduza para focar graves e médios. Os dois limites permanecem na ordem correta.
- **Frequency Tilt** (de -6 a +6 dB/oct em passos de 0,5; padrão: +3) - Ajusta o nível exibido das frequências acima de 100 Hz sem mudar o som. Valores positivos destacam as frequências mais altas; valores negativos as tornam menos evidentes no gráfico. Em 0, não há correção por frequência.
- **Level Range** (de 6 a 96 dB em passos de 1 dB; padrão: 24) - Define a largura da faixa móvel de exibição. Reduza-a para destacar diferenças de nível ou amplie-a para ver componentes mais fracos junto dos mais fortes.
- **Display Floor** (de -120 a -24 dB em passos de 1 dB; padrão: -60) - Define até onde a faixa móvel pode descer em trechos silenciosos. Reduza-o para permitir que componentes mais fracos apareçam dentro do **Level Range** escolhido. A faixa também acompanha os picos recentes, então esse ajuste não garante que todos os componentes fracos sejam visíveis.

### Como ler o gráfico

- Cada volta representa uma oitava. C fica no topo e as notas seguem no sentido horário; voltas internas são mais graves. As marcas C indicam o número da oitava.
- Em **Normal** e **Note Colors**, pontos mais claros e maiores indicam componentes mais fortes em suas posições, inclusive entre notas. Em **Normal 2**, a região colorida se estende mais para fora onde os componentes são mais fortes; sua borda externa mostra a variação do espectro sem um traço separado.
- O brilho e a área dos pontos, assim como a extensão da área colorida, mostram intensidade relativa, não nível absoluto: a escala acompanha os picos recentes.
- Nas oitavas graves, notas próximas ficam menos distintas e a resposta é mais lenta; elas podem parecer sobrepostas.

## Level Meter

Um display visual que mostra em tempo real o nível digital do sinal da música. Ele ajuda a conferir os níveis depois de aplicar efeitos e a identificar possível clipping antes que vire distorção audível.

### Guia de Visualização
- A barra horizontal se estende mais para a direita conforme o nível do sinal fica mais alto
- O marcador branco mantém um novo pico por um segundo e depois desce suavemente
- OVERLOAD significa que o sinal passou da faixa digital segura e pode distorcer
- Para uma reprodução limpa, evite níveis vermelhos frequentes ou avisos de OVERLOAD; ajuste o volume real de audição no seu dispositivo

## Note Spectrogram

Mostra as frequências fundamentais (F0) estimadas de A0 a C8 em um piano roll que se desloca, sem alterar o áudio. Use-o para acompanhar notas de acordes, linhas vocais e melódicas em movimento, linhas de baixo e notas sobrepostas em oitavas diferentes.

### Guia de Visualização

- **Vertical** mostra o tempo da esquerda para a direita, com o teclado e o som atual na borda direita. As notas mais agudas aparecem no topo.
- **Horizontal** coloca o teclado embaixo, com as notas graves à esquerda e as agudas à direita. O som novo aparece logo acima do teclado e o histórico se move para cima.
- As linhas em cada C marcam os limites das oitavas.
- As linhas correspondentes às teclas pretas usam um fundo cinza quase preto para continuarem visíveis quando nenhuma nota é detectada.
- **Normal** usa a cor do traçado do gráfico do tema; **Note Colors** atribui uma cor a cada nota, repetida em todas as oitavas. Ambos mostram linhas-guia entre E e F mais escuras que os limites das oitavas.
- **1/12 Octave** mostra uma linha por semitom. **High (1/60 Octave)** divide cada semitom em cinco linhas para facilitar o acompanhamento de pequenas variações de altura; as cores são interpoladas entre notas vizinhas.
- A cor acompanha a confiança do modelo de 0 (cor de fundo) a 1 (cor completa), incluindo candidatos fracos, sem um limiar de exibição. A confiança indica quanto o modelo sustenta a presença de uma nota; não é uma probabilidade calibrada.
- Com **Volume** ativado, cada altura detectada vira uma barra cuja espessura do núcleo opaco mostra o volume relativo corrigido pela frequência, de 1/60 de oitava na parte inferior da escala a 1/12 de oitava na parte superior. Um fade de 1/120 de oitava se estende de cada lado do núcleo, ampliando a largura total desenhada em 1/60 de oitava além do núcleo. **Pitch Resolution** muda a posição central da barra, não a espessura do núcleo.
- Na borda do teclado, um semicírculo de bordas suaves se estende para dentro do gráfico e mostra o volume atual. Ele responde imediatamente aos aumentos e cai a 20 dB por segundo; não há retenção de pico visível separada.
- A escala de volume abrange 24 dB. Seu limite superior acompanha o maior valor entre uma referência recente que estabiliza a escala do histórico (por cerca de um segundo) e -36 dB, para que trechos mais silenciosos continuem legíveis sem que passagens mais fortes preencham a tela continuamente. Essa referência é separada do semicírculo do volume atual.
- As linhas-guia das oitavas e de E–F são desenhadas atrás das barras de volume, mantendo a grade de alturas como referência visual.
- As teclas passam gradualmente da cor normal para a cor de exibição conforme aumenta a confiança do quadro mais recente, chegando a essa cor em 1.
- Alterar **Color** muda as cores do histórico existente.

### O que você pode ver

- Os acordes aparecem como várias linhas brilhantes ao mesmo tempo
- Melodias e linhas de baixo formam trajetórias que passam pelas linhas das notas
- A tela não cria MIDI nem partitura, não identifica instrumentos e não consegue separar completamente todos os sons simultâneos. Sobreposições complexas podem deixar partes de uma melodia ou harmonia sem detecção, enquanto percussão, ruído e padrões repetidos pouco claros podem produzir ocasionalmente uma altura incorreta.

### Parâmetros

- **Color** - Seleciona as cores de exibição sem alterar as estimativas de notas.
  - **Normal** (padrão): a cor do traçado do gráfico do tema.
  - **Note Colors**: uma cor diferente para cada nota, repetida em todas as oitavas.
- **Pitch Resolution** - Seleciona o detalhe vertical da altura sem apagar o histórico existente.
  - **1/12 Octave** (padrão): uma linha por semitom, usando a estimativa mais forte dessa nota.
  - **High (1/60 Octave)**: cinco linhas por semitom para mostrar variações de altura mais detalhadas.
- **Layout** - Seleciona **Horizontal** (padrão) ou **Vertical**. O histórico é preservado ao mudar a disposição.
- **Volume** - Mostra o volume relativo pela espessura das barras e por medidores semicirculares. Fica ativado por padrão; ao desativá-lo, a intensidade das linhas indica a confiança.
- **Time Span** (de 1 a 10 s) - Define quanto tempo o piano roll mostra
  - Valores menores facilitam a observação de mudanças de tempo
  - Valores maiores mostram um trecho musical mais longo de uma só vez
  - Padrão: 2 s
- **Regular Note Limit** (1 a 16 notas) - Define quantas notas simultâneas fora da faixa grave dedicada podem chegar à etapa final de detecção. O padrão é 8. Aumente para acordes excepcionalmente densos; valores menores reduzem o trabalho da análise e a competição entre candidatos.
- **Lowest Note** - Define a nota mais grave da faixa exibida e analisada. Padrão: E1.
- **Highest Note** - Define a nota mais aguda da faixa exibida e analisada. Padrão: G6.
- Quando a entrada é baixa demais para análise, o piano roll permanece escuro em vez de mostrar uma entrada extremamente pequena como alturas. Essa supressão não determina se um som seria audível ou perceptivamente mascarado.

## Oscilloscope

Mostra a forma da onda sonora em tempo real, para você ver batidas, ataques rápidos e mudanças de volume enquanto escuta. As configurações de trigger podem estabilizar a visualização quando a forma de onda se repete.

### Guia de Visualização
- Eixo horizontal mostra o tempo (milissegundos)
- Eixo vertical mostra a amplitude normalizada; a faixa visível muda com Display Level e Vertical Offset
- Linha verde traça a forma de onda real
- Linhas de grade ajudam a medir valores de tempo e amplitude
- As configurações de trigger determinam onde a captura da forma de onda começa; não há um marcador separado

### Parâmetros
- **Display Time** - Quanto tempo mostrar (1 a 100 ms)
  - Valores menores: Veja mais detalhes em eventos curtos
  - Valores maiores: Visualize padrões mais longos
- **Trigger Mode**
  - Auto: Atualizações contínuas mesmo sem trigger
  - Normal: Congela o display até o próximo trigger
- A detecção de trigger usa a média dos canais esquerdo e direito. A entrada mono é usada diretamente.
- **Trigger Level** - Nível de amplitude que inicia a captura
  - Faixa: -1 a 1 (amplitude normalizada)
- **Trigger Edge**
  - Rising: Dispara quando o sinal sobe
  - Falling: Dispara quando o sinal desce
- **Holdoff** - Tempo mínimo entre triggers (0.1 a 10 ms)
- **Display Level** - Escala vertical em dB (-96 a 0 dB)
- **Vertical Offset** - Desloca a forma de onda para cima/baixo (-1 a 1)

### Nota sobre a Exibição da Forma de Onda
A forma de onda conecta os pontos capturados em ordem temporal. Com tempos de exibição longos, cada intervalo preserva suas amostras inicial e final, além das amostras mínima e máxima em suas posições originais. Assim, a continuidade e os picos breves são mantidos dentro da resolução da tela. Use-a como guia visual, não como ferramenta de medição exata.

## Pitch Meter

Acompanha uma frequência fundamental (F0) por vez em um piano roll móvel de dois segundos, sem alterar o áudio. Use-o para verificar a afinação e o movimento de altura de uma voz ou instrumento solo.

### Guia de visualização

- **Horizontal** (padrão) coloca as notas graves à esquerda e as agudas à direita. A estimativa mais recente aparece acima do teclado, e o histórico se move para cima.
- **Vertical** coloca as notas graves embaixo e as agudas em cima. A estimativa mais recente aparece ao lado do teclado à direita, e o histórico se move para a esquerda.
- A posição da linha mostra a altura entre os semitons. Uma estimativa mais confiável aparece com maior intensidade; a linha é interrompida quando a entrada está muito baixa ou nenhuma altura única e estável é encontrada.
- O rótulo atual mostra a nota mais próxima e a diferença em cents. Um valor positivo indica uma altura acima da nota, e um valor negativo indica uma altura abaixo. O rótulo desaparece quando não há uma estimativa confiável.
- O nome da nota usa as mesmas cores do Note Spectrogram. O tamanho do nome e da diferença em cents se ajusta à largura disponível, e o ponto decimal dos cents permanece na mesma posição.

### Guia de uso

- Comece com uma única nota sustentada e observe se a linha permanece centralizada na nota ou se desloca para cima ou para baixo.
- Vibrato e pitch bends aparecem como movimentos suaves entre as linhas das notas.
- Este analisador acompanha uma altura dominante. Acordes, mixagens densas, percussão, ruído ou sons periódicos pouco claros podem interromper a linha ou produzir uma oitava incorreta.

### Parâmetros

- **Layout** - Seleciona **Horizontal** (padrão) ou **Vertical**.
- **Color** - Muda a cor da linha sem alterar a detecção de altura. **Normal** (padrão) usa a cor do gráfico do tema; **Heatmap** mostra o volume na mesma escala de 24 dB do Note Spectrogram; **Note Colors** acompanha a altura entre as cores das notas.
- **Reference A4** (400 a 480 Hz) - Define a referência de afinação usada nos nomes das notas e nos cents. Padrão: 440 Hz.
- **Lowest Note** - Define o limite inferior da faixa exibida e analisada. Padrão: C2. O menor ajuste disponível é A0.
- **Highest Note** - Define o limite superior da faixa exibida e analisada. Padrão: C7. O maior ajuste disponível é C8.
- A entrada estéreo é analisada pela média dos dois primeiros canais; a entrada mono é usada diretamente. Conteúdo com polaridades muito opostas pode se cancelar na média e não deixar traço de altura.

## Spectrogram

Cria padrões coloridos que mostram como sua música muda ao longo do tempo. As cores indicam a intensidade de cada som, enquanto a posição vertical indica a frequência.

O gráfico se desloca da direita para a esquerda a uma velocidade constante, com marcações a cada segundo.

### Guia de Visualização
- As cores mostram a intensidade de diferentes frequências:
  - Cores escuras: Sons baixos
  - Cores brilhantes: Sons altos
  - Observe os padrões mudarem com a música
- A posição vertical mostra a frequência:
  - Parte inferior: Sons graves
  - Meio: Instrumentos principais
  - Parte superior: Frequências altas

### O Que Você Pode Ver
- Melodias: Linhas fluidas de cor
- Batidas: Listras verticais
- Graves: Cores brilhantes na parte inferior
- Harmonias: Múltiplas linhas paralelas
- Diferentes instrumentos criam padrões únicos

### Parâmetros
- **Color** - **Normal** usa a cor do gráfico do tema e fica mais claro nas frequências fortes. **Heatmap** (padrão) mantém a escala multicolorida original. A troca recolore o histórico existente.
- **DB Range** - Quão vibrantes são as cores (-144dB a -48dB)
  - Números menores: Veja mais detalhes sutis
  - Números maiores: Foque nos sons principais
- **Points** - Tamanho de FFT usado na visualização (256 a 16384)
  - Números maiores: Mais detalhe de frequência, mas atualização temporal mais lenta
  - Números menores: Movimento mais rápido, mas menos detalhe de frequência
  - Com **Log (HQ)**, Points define a janela curta de análise; uma janela quatro vezes mais longa melhora a separação das frequências baixas.
- **Frequency Scale** - **Log** reserva mais espaço de exibição para as frequências baixas. **Log (HQ)** acrescenta uma medição mais longa para separar com mais clareza graves próximos, mantendo a medição curta para os agudos. Usa mais processamento, e mudanças nos graves podem demorar mais para aparecer ou desaparecer, mas não altera o áudio. **Linear** distribui larguras de frequência iguais em intervalos iguais.
- **Keyboard** - Mostra à direita do gráfico um guia estático de teclado que relaciona as notas musicais às frequências. Não altera a análise nem o áudio. A disposição das teclas acompanha **Log**, **Log (HQ)** ou **Linear**; **Log (HQ)** usa o mesmo espaçamento logarítmico de **Log**, e em **Linear** as teclas graves parecem mais estreitas.
- O analisador usa a média dos canais esquerdo e direito. A entrada mono é analisada diretamente.

## Spectrum Analyzer

Cria uma exibição visual em tempo real das frequências da sua música, dos graves profundos aos agudos. É como ver os ingredientes individuais que compõem o som completo da sua música.

### Guia de Visualização
- Lado esquerdo mostra frequências graves (bateria, baixo)
- Meio mostra frequências principais (vocais, guitarras, piano)
- Lado direito mostra frequências altas (pratos, brilho, ar)
- Picos mais altos significam presença mais forte dessas frequências
- A linha mais grossa mostra o som atual
- A linha mais fina acompanha os picos recentes e desce suavemente enquanto desaparecem
- Na visualização **Bar**, cada barra mostra o nível mais alto em uma parte de largura igual da tela. **Log** e **Log (HQ)** usam larguras de oitava iguais; **Linear** usa larguras de frequência iguais.
- A marca fina acima de uma barra mostra seu pico recente e desce suavemente.
- Observe como diferentes instrumentos criam padrões diferentes

### O Que Você Pode Ver
- Drops de Grave: Grandes movimentos à esquerda
- Melodias Vocais: Atividade no meio
- Agudos Nítidos: Brilhos à direita
- Mix Completo: Como todas as frequências trabalham juntas

### Parâmetros
- **Color** - **Normal** (padrão) mantém as cores do gráfico do tema. **Heatmap** ilumina os níveis mais altos e **Note Colors** acompanha as cores das notas no eixo de frequências. A escolha vale para **Line** e **Bar**. Com **Bar** e **Note Colors**, cada barra e sua marca de pico usam uma única cor conforme a frequência central da faixa.
- **DB Range** - Quão sensível é o display (-144dB a -48dB)
  - Números menores: Veja mais detalhes sutis
  - Números maiores: Foque nos sons principais
- **Points** - O quanto a visualização separa frequências próximas (256 a 16384)
  - Números maiores: Mais detalhe de frequência, com atualizações mais lentas
  - Números menores: Atualizações mais rápidas, com menos detalhe de frequência
  - Com **Log (HQ)**, Points define a janela curta de análise; uma janela quatro vezes mais longa melhora a separação das frequências baixas.
- **Frequency Scale** - **Log** reserva mais espaço de exibição para as frequências baixas. **Log (HQ)** acrescenta uma medição mais longa para separar com mais clareza graves próximos, mantendo a medição curta para os agudos. Usa mais processamento, e mudanças nos graves podem demorar mais para aparecer ou desaparecer, mas não altera o áudio. **Linear** distribui larguras de frequência iguais em intervalos iguais.
- **Display** - Altera apenas a aparência do espectro; não altera a análise nem o áudio.
  - **Line** (padrão): Mostra o espectro como linhas contínuas.
  - **Bar**: Mostra como barra o nível mais alto de cada faixa exibida.
- **Keyboard** - Mostra abaixo do gráfico um guia estático de teclado que relaciona as notas musicais às frequências. Não altera a análise nem o áudio. A disposição das teclas acompanha **Log**, **Log (HQ)** ou **Linear**; **Log (HQ)** usa o mesmo espaçamento logarítmico de **Log**, e em **Linear** as teclas graves parecem mais estreitas.
- O analisador usa a média dos canais esquerdo e direito. A entrada mono é analisada diretamente.

### Formas Divertidas de Usar Essas Ferramentas

1. Explorando Sua Música
   - Observe como diferentes gêneros criam padrões diferentes
   - Veja a diferença entre música acústica e eletrônica
   - Observe como os instrumentos ocupam diferentes faixas de frequência

2. Aprendendo Sobre Som
   - Veja o grave na música eletrônica
   - Observe melodias vocais se movendo pelo display
   - Observe como a bateria cria padrões nítidos

3. Melhorando Sua Experiência
   - Use o Level Meter para conferir os picos do sinal depois de adicionar efeitos
   - Observe o Spectrum Analyzer dançar com a música
   - Crie um show de luzes visual com o Spectrogram

## Stereo Meter

Uma ferramenta fascinante de visualização que permite ver como sua música cria uma sensação de espaço através do som estéreo. Observe como diferentes instrumentos e sons se movem entre seus alto-falantes ou fones de ouvido, adicionando uma dimensão visual empolgante à sua experiência auditiva.

### Guia de Visualização
- **Display em Diamante** - A janela principal onde a música ganha vida:
  - Centro: Momentos muito silenciosos ou em que o sinal combinado fica perto de zero
  - Cima/Baixo: Som compartilhado pelos canais esquerdo e direito, como conteúdo centralizado ou próximo de mono
  - Esquerda/Direita: Diferença ou conteúdo fora de fase entre os canais
  - Sons muito mais fortes de um lado podem aparecer perto dos cantos rotulados
  - Pontos verdes dançam com a música atual
  - Linha branca traça os picos musicais
  - A linha branca de picos decai a cada amostra de áudio, mantendo o mesmo movimento independentemente do tamanho do bloco de processamento
- **Correlation Bar** (lado esquerdo)
  - Mostra a correlação entre os canais esquerdo e direito
  - Topo (+1.0): Esquerda e direita são quase iguais, normalmente soando centralizadas
  - Meio (0.0): Relação fraca entre canais, comum em ambiências amplas ou conteúdo esquerdo/direito pouco relacionado
  - Base (-1.0): Esquerda e direita têm polaridade quase oposta, o que pode soar fraco em alto-falantes
- **Barra de Balanço** (Base)
  - Mostra se um alto-falante está mais alto que o outro
  - Centro: Música igualmente alta em ambos os alto-falantes
  - Esquerda/Direita: Música mais forte em um alto-falante
  - Os números mostram a diferença em decibéis (dB)

### O Que Você Pode Ver
- **Som Centralizado**: Movimento vertical forte no meio
- **Som Espacial**: Atividade espalhada por todo o display
- **Efeitos Especiais**: Padrões interessantes nos cantos
- **Balanço dos Alto-falantes**: Para onde a barra inferior aponta
- **Correlação dos Canais**: O que a barra de correlação à esquerda mostra

### Parâmetros
- **Window** (10-1000 ms) - Quanto áudio recente aparece na visualização
  - Valores menores: Veja mudanças musicais rápidas
  - Valores maiores: Veja padrões sonoros gerais
  - Padrão: 100 ms funciona bem para a maioria das músicas
- **Gain** (0 a 24 dB; padrão: 0 dB) - Amplia apenas os pontos e a linha de picos no gráfico em forma de losango. Aumente o valor para ver melhor os padrões dos trechos mais baixos. Não altera o áudio nem as leituras de correlação e equilíbrio.

### Aproveite Sua Música
1. **Observe Diferentes Estilos**
   - Música clássica geralmente mostra padrões suaves e equilibrados
   - Música eletrônica pode criar designs selvagens e expansivos
   - Gravações ao vivo podem mostrar movimento natural da sala

2. **Descubra Qualidades Sonoras**
   - Veja como diferentes álbuns usam efeitos estéreo
   - Note como algumas músicas parecem mais amplas que outras
   - Observe como os instrumentos se movem entre alto-falantes

3. **Melhore Sua Experiência**
   - Experimente diferentes fones de ouvido para ver como mostram o estéreo
   - Compare gravações antigas e novas de suas músicas favoritas
   - Observe como diferentes posições de escuta mudam o display

Lembre-se: Essas ferramentas são feitas para melhorar seu prazer ao ouvir música, adicionando uma dimensão visual à sua experiência auditiva. Divirta-se explorando e descobrindo novas maneiras de ver sua música favorita!
