---
title: "Visualizer Guide - EffeTune"
description: "Arrange animated audio graphs, artwork, and track details in EffeTune."
lang: en
---

# Visualizer

Visualizer turns EffeTune's processed audio into a customizable display. It can show a waveform, spectrum, scrolling spectrogram, stereo image, or note spectrogram alongside artwork and track information. Changing the display does not change the sound.

## Open and display

On a PC layout, select **Visualizer** beside **Effect Pipeline** and **Music Library**. On mobile, open the **Player** tab and select **Visualizer**. In the desktop app, **View > Visualizer** opens the same view. You can also select Visualizer as the startup view in **Settings > Config...**.

Choose a built-in preset to start. The preset list groups designs by 16:9, 21:9, 4:3, 1:1, and 9:16 proportions. Selecting one replaces the current layout. The graph shows the signal just before it reaches the audio output; it follows the processed playback, including active effects.

Each proportion offers eight designs (40 layouts in total). **Stereo Workbench** compares left and right channels, while **Phase & Level** emphasizes stereo position and levels. **Frequency Timeline** and **Transient Lab** help you watch how frequency content changes; **Harmonic Atlas** and **Practice Roll** show detected note activity. **Album Cinema** and **Pulse Geometry** are designed for watching the music.

Hover over or tap the display to reveal **⛶**. Select it to fill the app window while preserving the chosen proportions; edges may be cropped. Select **⛶** again, press **Esc**, or use mobile Back to return. In the desktop app, switching to Mini Player while Visualizer is open places the display above the playback controls.

## Edit a layout

Select **Edit**. Changes appear immediately and the current layout is restored the next time you open EffeTune. Use the preset dialog's **Save** action when you want a named copy; editing alone does not update a saved preset.

In Edit mode, the left pane holds the overall settings, item list, and **Quality** control. The canvas is in the center, and the selected item's controls are on the right.

- Choose the display proportions, background color, or a background image. A large imported image is resized for the display. **Theme colors** lets you change the graph base, soft graph fill, fine and major grid lines, graph labels, axis titles, and meter ticks for this layout without changing the sound trace palette. Colors you leave untouched use the default dark theme colors, regardless of the current EffeTune theme. Choose **Use default colors** to reset your changes.
- Add an **Oscilloscope**, **Spectrum**, **Spectrogram**, **Stereo**, **Level Meter**, **Notes**, or **Chroma Spiral** graph, or add **Artwork**, **Title**, **Album**, or **Artist**. Drag an item to move it and use its corner handles to resize it. Grid snapping helps align items; front/back controls set their overlap order. Select an item and press Ctrl+D (Cmd+D on Mac) to duplicate it one grid step away, or Alt-drag it to create and place a copy.
- For a graph, choose the audio channel. The default uses output channels 1–2. Choosing one channel shows it on both sides, except in Level Meter, which shows one bar. Flip either axis to reverse its direction.
- Under **Color mode**, **Solid** uses a separate color picker and is the starting choice. A new item's solid color starts with the default dark theme's graph color. **Gradient** uses editable color stops; choose from 23 presets or move stops yourself. **Hue** changes gradient colors over time, and **Scroll** moves the gradient. Speed controls either motion. Switching modes keeps your solid color and gradient settings.
- Adjust each graph under **Items**. For **Title**, **Album**, and **Artist**, set the text size, font, alignment, **Bold**, and **Italic** separately. If a font is unavailable on your device or browser, another font is used. Artwork can have rounded corners. Graph controls are explained below.

## Tune and read the graphs

**Spectrum** shows level by frequency, with recent peaks that fall gradually. **Orientation** places frequency left to right in **Horizontal** (the default), or low to high from bottom to top in **Vertical**; the keyboard moves left and louder levels extend right. **Display** switches between **Line** and **Bar**. In **Bar**, **Quantize** (on by default) rounds the displayed bars to whole blocks and draws each peak in one block; measured levels do not change. **Points** sets the analysis size: more points separate nearby frequencies but respond more slowly. **Frequency Scale** offers **Log**, **Log (HQ)** for more detailed low-frequency analysis, and **Linear**, which gives equal space to equal frequency intervals. New graphs use **Log (HQ)**. **DB Range** sets the quietest level shown; a more negative value reveals quieter content. **Keyboard** adds a note reference. **Axes and grid** and **Axis labels and numbers** control the guides without changing the measurement; all three start off.

**Spectrogram** places frequency vertically and scrolls new measurements across time. Stronger bands appear more prominently in the chosen palette. Its **Points**, **Frequency Scale**, **DB Range**, **Keyboard**, and axis controls have the same purpose as in Spectrum. It starts with **Log (HQ)** and 4096 points. More points reveal finer detail but take longer to reflect a change in the sound.

**Stereo** plots the left and right channels together. The trace and peak outline show width and level; the correlation and balance indicators help you read how similar the channels are and which side is stronger. **Window** sets how much recent audio is shown, from 10 to 1000 ms. A short window follows transients; a long window looks steadier. The axis controls show or hide the guides. The **Correlation** and **Balance** switches show or hide those two meters independently.

**Level Meter** shows each channel on a −96 to 0 dB bar by default. **DB Range** sets the lower limit from −144 to −48 dB; the default is −96 dB. **Orientation** changes the bars from horizontal (the default) to vertical. A thin marker holds the recent peak for one second, and **OVERLOAD** warns of clipping for five seconds. **Axes and grid** controls the dB lines; **Axis labels and numbers** controls their values. **Level values** separately shows the held peak readings. All three start off; **OVERLOAD** remains visible. The bars offer **Solid**, **Gradient**, and **Heatmap** colors.

**Oscilloscope** draws the captured waveform against time for the selected audio channel. The horizontal axis is time in milliseconds; the vertical axis is amplitude. **Display Time** sets the visible interval from 1 to 100 ms (default 10 ms); shorter times reveal brief changes, while longer times show more of the waveform. **Trigger Mode** is **Auto** by default, so the trace continues to update without a trigger; **Normal** holds the last trace until the signal crosses **Trigger Level** in the selected **Trigger Edge** direction. **Trigger Level** sets the capture point from −1 to 1 (default 0), and **Trigger Edge** selects **Rising** (default) or **Falling**. **Holdoff** sets the minimum time between triggers, from 0.1 to 10 ms (default 0.1 ms); a longer holdoff reduces rapid retriggers. **Display Level** sets the vertical scale from −96 to 0 dB (default 0 dB); lower values make quieter waveforms appear larger. **Vertical Offset** moves the waveform from −1 to 1 (default 0); positive values move it up and negative values move it down. **Axes and grid** and **Axis labels and numbers** show the guides and their labels; both start off. Use a repeated waveform and adjust the trigger level and edge if the trace is not steady. The trace is a visual guide, not an exact measurement tool.

For Spectrum, Spectrogram, and Stereo, **Input gain** changes only the signal sent to that graph, from −24 to +24 dB; it does not change playback. Start at 0 dB. Raise it to inspect a quiet signal, or lower it if the graph crowds its upper limit.

**Notes** shows detected pitches over time. **Pitch Resolution** chooses **1/12 Octave** for semitone rows or **High (1/60 Octave)** for finer pitch detail. **Layout** changes the direction of the history, while **Time Span** sets 1–10 seconds of visible history. **Volume** adds the note-level view alongside pitch confidence. **Lowest Note** and **Highest Note** set the pitch range to analyze; **Regular Note Limit** sets how many simultaneous note candidates are considered. Narrow the range or lower the limit if unrelated notes make the graph busy. **Keyboard** shows the piano keys; it starts off, as do **Axes and grid** and **Axis labels and numbers**. With **Gradient**, **Full range** maps colors across the displayed pitches and **One octave** repeats them by note.

**Chroma Spiral** arranges detected notes around a spiral, one turn per octave. **Display** switches between **Dots** and **Fill**. **Lowest Octave** and **Highest Octave** set its range; **Frequency Tilt** changes the emphasis across frequencies, **Level Range** changes how quiet notes appear, and **Display Floor** hides weaker notes.

Spectrum and Chroma Spiral offer both fixed **Note Colors** and **Heatmap** under **Color mode**. Spectrogram offers Heatmap, while Notes offers Note Colors. Note Colors repeats the same 12 pitch colors each octave without animation; Spectrum blends between notes. In Spectrum's **Bar** display, each bar uses one color based on its center frequency. Heatmap colors stronger sound more brightly and fades quiet areas to transparency instead of filling them with black. Stereo and text items offer Solid and Gradient only.

## Add motion and effects

Add effects to an item or the background and change their order to change the result. **Amount** controls strength. **Opacity** controls visibility and can blink when animated. **Glow**, **Outline**, and **Blur** soften or emphasize shapes. **Trail** leaves a fading trace, while **Trail Feedback** resizes, turns, and moves that trace. **Scale Pulse** enlarges an item rhythmically; **Symmetry** repeats it around a center; **Shake** moves it; **Particles** add small moving points. **Ken Burns** slowly moves artwork or a background image, and **Flash** brightens a background.

For **Trail Feedback**, **Zoom** changes each repeated trace's size by −2% to +2% per step: positive values expand it, negative values shrink it, and 0% leaves its size unchanged. The initial value is +2%. **Rotation angle (°)** sets how each trace turns from −3° to +3°: positive values rotate clockwise, negative values counterclockwise, and 0° stops rotation. **Horizontal flow** moves traces right or left; **Vertical flow** moves them down or up. Set both to move diagonally. Each flow slider spans −1% to +1% of the item's size per step, with 0% holding that axis still. **Amount** scales zoom, rotation, and flow.

An effect can run steadily, change with **Time**, or respond to overall **Level** or **Bass**. **Depth** controls how much that source changes the effect, and **Speed** controls a time-driven effect. Start with a single effect and a low amount, then add more if the display remains easy to read. For example, try Glow on a spectrum and a Bass-driven Scale Pulse on artwork.

If animation becomes slow, choose a lower display quality or use fewer effects. **Auto** adjusts quality as needed.

## Presets, backup, and audio sync

The preset dialog lets you save the current layout under a name, reload it, rename it, or delete it. Built-in presets stay available. **Settings > Backup / Restore** includes named Visualizer presets and their background images; the current working layout is not part of the backup. Visualizer layouts are not included in Effect Pipeline sharing links.

In **Config**, turn on **Sync Visuals to Audio** to align the display with what you hear; EffeTune may delay the sound. If graphs are unavailable, open **Audio Configuration** and check **Use WebAssembly audio processing**, then check that audio is playing through EffeTune.

In the desktop app, **Use hardware acceleration** is on by default. If the window flickers or stops updating, turn it off in **Settings > Config...** and restart EffeTune. After repeated display failures, EffeTune turns it off and restarts automatically. To try it again, turn the setting on and restart.
