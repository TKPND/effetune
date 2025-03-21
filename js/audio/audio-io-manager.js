import { AudioContextManager } from './audio-context-manager.js';

/**
 * AudioIOManager - Manages audio input and output devices
 */
export class AudioIOManager {
    /**
     * Create a new AudioIOManager instance
     * @param {Object} contextManager - Reference to the AudioContextManager
     */
    constructor(contextManager) {
        this.contextManager = contextManager;
        this.stream = null;
        this.sourceNode = null;
        this.destinationNode = null;
        this.audioElement = null;
        this.defaultDestinationConnection = null;
        this.silenceNode = null;
    }
    
    /**
     * Initialize audio input (microphone)
     * @returns {Promise<string>} - Empty string on success, error message on failure
     */
    async initAudioInput() {
        try {
            // Variable to store microphone error message
            let microphoneError = null;
            
            // Flag to track if we're using microphone input
            let usingMicrophoneInput = true;
            
            // Check if we're running in Electron and have audio preferences
            let audioConstraints = {
                echoCancellation: false,
                noiseSuppression: false,
                autoGainControl: false
            };

            // If running in Electron, try to use saved audio preferences
            if (window.electronAPI && window.electronIntegration) {
                const preferences = await window.electronIntegration.loadAudioPreferences();
                if (preferences && preferences.inputDeviceId) {
                    audioConstraints.deviceId = { exact: preferences.inputDeviceId };
                }
            }

            // Try to get user media with audio constraints
            try {
                this.stream = await navigator.mediaDevices.getUserMedia({
                    audio: audioConstraints
                });
            } catch (error) {
                // If failed with saved device, try again with default device
                if (audioConstraints.deviceId) {
                    console.warn('Failed to use saved audio input device, falling back to default:', error);
                    delete audioConstraints.deviceId;
                    try {
                        this.stream = await navigator.mediaDevices.getUserMedia({
                            audio: audioConstraints
                        });
                    } catch (innerError) {
                        // If permission is denied, try to clear permission overrides and ask again
                        if (innerError.name === 'NotAllowedError' || innerError.name === 'PermissionDeniedError') {
                            if (window.electronAPI && window.electronAPI.clearMicrophonePermission) {
                                console.log('Microphone permission denied, attempting to clear permission overrides');
                                try {
                                    await window.electronAPI.clearMicrophonePermission();
                                    // Try one more time after clearing permissions
                                    this.stream = await navigator.mediaDevices.getUserMedia({
                                        audio: audioConstraints
                                    });
                                } catch (finalError) {
                                    console.warn('Failed to get microphone access after clearing permissions:', finalError);
                                    usingMicrophoneInput = false;
                                }
                            } else {
                                console.warn('Microphone permission denied:', innerError);
                                usingMicrophoneInput = false;
                            }
                        } else {
                            console.warn('Failed to get microphone access:', innerError);
                            usingMicrophoneInput = false;
                        }
                    }
                } else if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
                    // If permission is denied on first attempt, try to clear permission overrides and ask again
                    if (window.electronAPI && window.electronAPI.clearMicrophonePermission) {
                        console.log('Microphone permission denied, attempting to clear permission overrides');
                        try {
                            await window.electronAPI.clearMicrophonePermission();
                            // Try one more time after clearing permissions
                            this.stream = await navigator.mediaDevices.getUserMedia({
                                audio: audioConstraints
                            });
                        } catch (finalError) {
                            console.warn('Failed to get microphone access after clearing permissions:', finalError);
                            usingMicrophoneInput = false;
                        }
                    } else {
                        console.warn('Microphone permission denied:', error);
                        usingMicrophoneInput = false;
                    }
                } else {
                    console.warn('Failed to get microphone access:', error);
                    usingMicrophoneInput = false;
                }
            }

            // If we have microphone access, create source from stream
            if (usingMicrophoneInput && this.stream) {
                this.sourceNode = this.contextManager.audioContext.createMediaStreamSource(this.stream);
            } else {
                // No microphone access, create a stereo-compatible silent source as a fallback
                console.log('Creating stereo-compatible silent source as fallback');
                
                // Create a buffer source instead of oscillator for better stereo support
                const bufferSize = this.contextManager.audioContext.sampleRate * 2; // 2 seconds of silence
                const silentBuffer = this.contextManager.audioContext.createBuffer(
                    2, // 2 channels for stereo
                    bufferSize,
                    this.contextManager.audioContext.sampleRate
                );
                
                // Create a buffer source node
                const bufferSource = this.contextManager.audioContext.createBufferSource();
                bufferSource.buffer = silentBuffer;
                bufferSource.loop = true; // Loop the silent buffer
                
                // Create a gain node to ensure silence
                const gainNode = this.contextManager.audioContext.createGain();
                gainNode.gain.value = 0; // Mute
                
                // Connect buffer source to gain node
                bufferSource.connect(gainNode);
                bufferSource.start();
                
                // Use the gain node as our source node
                this.sourceNode = gainNode;
                
                // Log message for Electron users
                if (window.electronAPI && window.electronIntegration) {
                    console.log('Microphone access not available. Music file playback mode will still work.');
                }
                
                // Store the error message if microphone access was denied, but don't return it yet
                // This allows us to continue setting up the audio nodes for playback
                if (!usingMicrophoneInput) {
                    // Use the same error format as before so app.js can detect it properly
                    microphoneError = `Audio Error: Microphone access denied. Music file playback mode will still work.`;
                }
            }
            
            // Return microphone error if there was one
            return microphoneError || '';
        } catch (error) {
            console.error('Audio input initialization error:', error);
            return `Audio Error: ${error.message}`;
        }
    }
    
    /**
     * Initialize audio output
     * @returns {Promise<string>} - Empty string on success, error message on failure
     */
    async initAudioOutput() {
        try {
            // Create a MediaStreamDestination to get a MediaStream
            // Check if createMediaStreamDestination is supported
            try {
                if (typeof this.contextManager.audioContext.createMediaStreamDestination === 'function') {
                    this.destinationNode = this.contextManager.audioContext.createMediaStreamDestination();
                } else {
                    console.warn('createMediaStreamDestination is not supported in this browser');
                    // Fall back to default destination only
                    this.destinationNode = null;
                }
            } catch (error) {
                console.error('Error creating MediaStreamDestination:', error);
                // Fall back to default destination only
                this.destinationNode = null;
                return `Audio Error: Failed to create audio destination: ${error.message}`;
            }
            
            // Note: We don't connect to the default destination here anymore
            // This will be done in connectAudioNodes to ensure proper order of operations
            
            // For Electron, prepare audio output device
            if (window.electronAPI && window.electronIntegration) {
                // If running in Electron, try to use saved output device
                const preferences = await window.electronIntegration.loadAudioPreferences();
                if (preferences && preferences.outputDeviceId) {
                    try {
                        // Create a new audio element for actual use
                        if (this.audioElement) {
                            this.audioElement.pause();
                            this.audioElement.srcObject = null;
                        }
                        
                        this.audioElement = new Audio();
                        this.audioElement.autoplay = true;
                        this.audioElement.volume = 1.0;
                        this.audioElement.muted = false;
                        
                        // Check for Audio Output Devices API support
                        // The setSinkId method is part of the Audio Output Devices API
                        const hasSinkIdSupport =
                            typeof this.audioElement.setSinkId === 'function';
                        
                        if (hasSinkIdSupport) {
                            try {
                                // Get available devices - this doesn't require microphone permission
                                let outputDevice = null;
                                
                                try {
                                    // Try to enumerate devices - this works even without microphone permission
                                    if (typeof navigator.mediaDevices !== 'undefined' &&
                                        typeof navigator.mediaDevices.enumerateDevices === 'function') {
                                        const devices = await navigator.mediaDevices.enumerateDevices();
                                        outputDevice = devices.find(device =>
                                            device.kind === 'audiooutput' &&
                                            device.deviceId === preferences.outputDeviceId
                                        );
                                    }
                                } catch (enumError) {
                                    console.warn('Failed to enumerate devices:', enumError);
                                    // Continue with the saved device ID even if we can't verify it exists
                                }
                                
                                if (outputDevice) {
                                    await this.audioElement.setSinkId(preferences.outputDeviceId);
                                    console.log(`Audio output set to: ${outputDevice.label || 'unnamed device'}`);
                                } else {
                                    // Try to use the saved device ID directly even if we couldn't verify it
                                    try {
                                        await this.audioElement.setSinkId(preferences.outputDeviceId);
                                        console.log(`Audio output set to saved device ID: ${preferences.outputDeviceId}`);
                                    } catch (directSinkError) {
                                        console.warn('Failed to set audio output to saved device, using default:', directSinkError);
                                        // Fall back to default device
                                        await this.audioElement.setSinkId('default');
                                    }
                                }
                                
                                // Now set the srcObject after sinkId is set
                                if (this.destinationNode && this.destinationNode.stream) {
                                    this.audioElement.srcObject = this.destinationNode.stream;
                                } else {
                                    console.warn('No destination stream available');
                                    // Fall back to default output
                                    try {
                                        this.defaultDestinationConnection = this.contextManager.workletNode.connect(this.contextManager.audioContext.destination);
                                    } catch (connectError) {
                                        console.error('Error connecting to default audio destination:', connectError);
                                        return `Audio Error: Failed to connect to default audio destination: ${connectError.message}`;
                                    }
                                }
                                
                                // Explicitly call play()
                                try {
                                    await this.audioElement.play();
                                } catch (playError) {
                                    console.warn('Failed to play audio:', playError);
                                    // Fall back to default output
                                    this.defaultDestinationConnection = this.contextManager.workletNode.connect(this.contextManager.audioContext.destination);
                                }
                            } catch (sinkError) {
                                console.warn('Failed to set audio output device:', sinkError);
                                this.defaultDestinationConnection = this.contextManager.workletNode.connect(this.contextManager.audioContext.destination);
                                
                                // Still try to use the audio element as a fallback
                                if (this.destinationNode && this.destinationNode.stream) {
                                    this.audioElement.srcObject = this.destinationNode.stream;
                                }
                            }
                        } else {
                            console.warn('Audio Output Devices API not supported in this browser');
                            // Fall back to default output
                            this.defaultDestinationConnection = this.contextManager.workletNode.connect(this.contextManager.audioContext.destination);
                            
                            // Still try to use the audio element as a fallback
                            if (this.destinationNode && this.destinationNode.stream) {
                                this.audioElement.srcObject = this.destinationNode.stream;
                            }
                        }
                        
                        // Add event listeners for debugging
                        this.audioElement.addEventListener('error', (e) => {
                            // If there's an error with the audio element, make sure we're using the default output
                            if (!this.defaultDestinationConnection) {
                                this.defaultDestinationConnection = this.contextManager.workletNode.connect(this.contextManager.audioContext.destination);
                            }
                        });
                    } catch (error) {
                        // Ensure we have audio output in case of error
                        if (!this.defaultDestinationConnection) {
                            this.defaultDestinationConnection = this.contextManager.workletNode.connect(this.contextManager.audioContext.destination);
                        }
                    }
                }
            }
            
            // If this is the first launch, set up a processor to mute audio output
            if (this.contextManager.isFirstLaunch && window.electronIntegration && window.electronIntegration.isElectron) {
                // Create a script processor node to zero-fill audio output
                const bufferSize = 4096;
                // Handle vendor prefixes for ScriptProcessorNode (deprecated but still used)
                let silenceNode;
                if (typeof this.contextManager.audioContext.createScriptProcessor === 'function') {
                    silenceNode = this.contextManager.audioContext.createScriptProcessor(bufferSize, 2, 2);
                } else if (typeof this.contextManager.audioContext.createJavaScriptNode === 'function') {
                    // Older browsers used createJavaScriptNode
                    silenceNode = this.contextManager.audioContext.createJavaScriptNode(bufferSize, 2, 2);
                } else {
                    console.warn('ScriptProcessorNode is not supported in this browser');
                    // Skip silence node creation and continue with normal audio output
                    return '';
                }
                
                silenceNode.onaudioprocess = (e) => {
                    // Get output buffer
                    const outputL = e.outputBuffer.getChannelData(0);
                    const outputR = e.outputBuffer.getChannelData(1);
                    
                    // Fill with zeros (silence)
                    for (let i = 0; i < outputL.length; i++) {
                        outputL[i] = 0;
                        outputR[i] = 0;
                    }
                };
                
                // Insert the silence node between worklet and destination
                try {
                    // Only disconnect if connected
                    if (this.destinationNode) {
                        this.contextManager.workletNode.disconnect(this.destinationNode);
                    }
                    this.contextManager.workletNode.connect(silenceNode);
                    silenceNode.connect(this.destinationNode);
                } catch (error) {
                    console.warn('Error connecting silence node:', error);
                    // Fall back to direct connection if there's an error
                    if (this.destinationNode) {
                        this.contextManager.workletNode.connect(this.destinationNode);
                    }
                }
                
                // Store reference to remove on cleanup
                this.silenceNode = silenceNode;
            }
            
            return '';
        } catch (error) {
            console.error('Audio output initialization error:', error);
            return `Audio Error: ${error.message}`;
        }
    }
    
    /**
     * Connect audio nodes
     * @returns {Promise<string>} - Empty string on success, error message on failure
     */
    async connectAudioNodes() {
        try {
            // Connect source to worklet
            try {
                // Make sure both nodes exist
                if (!this.sourceNode || !this.contextManager.workletNode) {
                    console.error('Source or worklet node is missing');
                    return `Audio Error: Audio initialization incomplete - missing audio nodes`;
                }
                
                // Use the original connect method to avoid any overridden connect methods
                if (window.originalConnectMethod && this.contextManager.isFirstLaunch) {
                    window.originalConnectMethod.call(this.sourceNode, this.contextManager.workletNode);
                } else {
                    this.sourceNode.connect(this.contextManager.workletNode);
                }
            } catch (error) {
                console.error('Error connecting source to worklet:', error);
                return `Audio Error: Failed to connect audio nodes: ${error.message}`;
            }
            
            // Connect worklet to destination
            if (this.destinationNode) {
                try {
                    this.contextManager.workletNode.connect(this.destinationNode);
                } catch (error) {
                    console.error('Error connecting worklet to destination:', error);
                    return `Audio Error: Failed to connect to audio destination: ${error.message}`;
                }
            }
            
            // For web app (non-Electron), always connect to default destination
            // This is crucial for audio output to work
            if (!window.electronAPI || !window.electronIntegration) {
                try {
                    this.defaultDestinationConnection = this.contextManager.workletNode.connect(this.contextManager.audioContext.destination);
                } catch (error) {
                    console.error('Error connecting to default audio destination:', error);
                    return `Audio Error: Failed to connect to default audio destination: ${error.message}`;
                }
            }
            
            return '';
        } catch (error) {
            console.error('Error connecting audio nodes:', error);
            return `Audio Error: ${error.message}`;
        }
    }
    
    /**
     * Create a fallback silent source node
     * @returns {AudioNode} - The created source node
     */
    createFallbackSilentSource() {
        console.warn('Source node missing, creating fallback silent source');
        // Create a silent source node as fallback
        const bufferSize = this.contextManager.audioContext.sampleRate * 2;
        const silentBuffer = this.contextManager.audioContext.createBuffer(2, bufferSize, this.contextManager.audioContext.sampleRate);
        const bufferSource = this.contextManager.audioContext.createBufferSource();
        bufferSource.buffer = silentBuffer;
        bufferSource.loop = true;
        
        const gainNode = this.contextManager.audioContext.createGain();
        gainNode.gain.value = 0;
        
        bufferSource.connect(gainNode);
        bufferSource.start();
        
        return gainNode;
    }
    
    /**
     * Clean up audio input and output
     */
    cleanupAudio() {
        // Stop audio element if it exists
        if (this.audioElement) {
            this.audioElement.pause();
            this.audioElement.srcObject = null;
            this.audioElement = null;
        }
        
        // Disconnect from default destination if connected
        if (this.defaultDestinationConnection && this.contextManager.workletNode && this.contextManager.audioContext) {
            try {
                this.contextManager.workletNode.disconnect(this.contextManager.audioContext.destination);
            } catch (error) {
                console.warn('Error disconnecting from default destination:', error);
            }
        }
        
        // Disconnect silence node if it exists
        if (this.silenceNode && this.contextManager.audioContext) {
            try {
                this.silenceNode.disconnect();
                this.silenceNode = null;
            } catch (error) {
                console.warn('Error disconnecting silence node:', error);
            }
        }
        
        // Stop all media tracks
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
        
        // Clear nodes
        this.sourceNode = null;
        this.destinationNode = null;
        this.defaultDestinationConnection = null;
    }
}