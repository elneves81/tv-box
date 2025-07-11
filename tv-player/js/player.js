class TVBoxPlayer {
    constructor() {
        this.socket = null;
        this.deviceId = this.getDeviceId();
        this.currentPlaylist = null;
        this.currentVideoIndex = 0;
        this.isPlaying = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 10;
        this.heartbeatInterval = null;
        
        this.initializeElements();
        this.initializeSocket();
        this.setupEventListeners();
        this.startHeartbeat();
        
        console.log('TV Box Player inicializado para dispositivo:', this.deviceId);
    }

    initializeElements() {
        this.elements = {
            loadingScreen: document.getElementById('loadingScreen'),
            errorScreen: document.getElementById('errorScreen'),
            videoPlayer: document.getElementById('videoPlayer'),
            connectionStatus: document.getElementById('connectionStatus'),
            deviceInfo: document.getElementById('deviceInfo'),
            playlistInfo: document.getElementById('playlistInfo'),
            statusText: document.getElementById('statusText'),
            errorMessage: document.getElementById('errorMessage'),
            deviceName: document.getElementById('deviceName'),
            deviceIP: document.getElementById('deviceIP'),
            lastUpdate: document.getElementById('lastUpdate'),
            playlistName: document.getElementById('playlistName'),
            currentVideo: document.getElementById('currentVideo'),
            videoProgress: document.getElementById('videoProgress')
        };
    }

    getDeviceId() {
        // Extrair deviceId da URL ou usar um ID único baseado no navegador
        const urlParams = new URLSearchParams(window.location.search);
        const deviceId = urlParams.get('deviceId') || 
                         window.location.pathname.split('/').pop() ||
                         this.generateDeviceId();
        
        localStorage.setItem('deviceId', deviceId);
        return deviceId;
    }

    generateDeviceId() {
        // Gerar um ID único baseado em características do dispositivo
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        ctx.textBaseline = 'top';
        ctx.font = '14px Arial';
        ctx.fillText('Device fingerprint', 2, 2);
        
        const fingerprint = canvas.toDataURL();
        const hash = this.simpleHash(fingerprint + navigator.userAgent + screen.width + screen.height);
        
        return `device_${hash}`;
    }

    simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return Math.abs(hash).toString(36);
    }

    initializeSocket() {
        const serverUrl = window.location.origin;
        
        this.socket = io(serverUrl, {
            auth: {
                deviceId: this.deviceId
            },
            transports: ['websocket', 'polling']
        });

        this.setupSocketEvents();
    }

    setupSocketEvents() {
        this.socket.on('connect', () => {
            console.log('Conectado ao servidor');
            this.updateConnectionStatus('connected');
            this.hideLoadingScreen();
            this.reconnectAttempts = 0;
            this.updateStatusText('Conectado! Aguardando conteúdo...');
            this.requestDeviceInfo();
        });

        this.socket.on('disconnect', () => {
            console.log('Desconectado do servidor');
            this.updateConnectionStatus('disconnected');
            this.showLoadingScreen();
            this.updateStatusText('Conexão perdida. Tentando reconectar...');
        });

        this.socket.on('connect_error', (error) => {
            console.error('Erro de conexão:', error);
            this.updateConnectionStatus('disconnected');
            this.handleConnectionError();
        });

        // Eventos de controle de vídeo
        this.socket.on('play-video', (data) => {
            console.log('Comando recebido: reproduzir vídeo', data);
            this.playVideo(data);
        });

        this.socket.on('pause-video', () => {
            console.log('Comando recebido: pausar vídeo');
            this.pauseVideo();
        });

        this.socket.on('stop-video', () => {
            console.log('Comando recebido: parar vídeo');
            this.stopVideo();
        });

        this.socket.on('load-playlist', (data) => {
            console.log('Comando recebido: carregar playlist', data);
            this.loadPlaylist(data);
        });

        this.socket.on('next-video', () => {
            console.log('Comando recebido: próximo vídeo');
            this.nextVideo();
        });

        this.socket.on('previous-video', () => {
            console.log('Comando recebido: vídeo anterior');
            this.previousVideo();
        });

        this.socket.on('update-volume', (data) => {
            console.log('Comando recebido: atualizar volume', data);
            this.updateVolume(data.volume);
        });

        this.socket.on('device-info', (data) => {
            console.log('Informações do dispositivo recebidas:', data);
            this.updateDeviceInfo(data);
        });

        // Eventos de sistema
        this.socket.on('system-restart', () => {
            console.log('Comando recebido: reiniciar sistema');
            this.restartSystem();
        });

        this.socket.on('system-update', () => {
            console.log('Comando recebido: atualizar sistema');
            this.updateSystem();
        });
    }

    setupEventListeners() {
        // Eventos do player de vídeo
        this.elements.videoPlayer.addEventListener('loadstart', () => {
            this.sendEvent('video:loading');
        });

        this.elements.videoPlayer.addEventListener('loadeddata', () => {
            this.sendEvent('video:loaded');
        });

        this.elements.videoPlayer.addEventListener('play', () => {
            this.isPlaying = true;
            this.sendEvent('video:play', {
                videoId: this.currentVideoId,
                timestamp: Date.now()
            });
        });

        this.elements.videoPlayer.addEventListener('pause', () => {
            this.isPlaying = false;
            this.sendEvent('video:pause', {
                videoId: this.currentVideoId,
                currentTime: this.elements.videoPlayer.currentTime,
                timestamp: Date.now()
            });
        });

        this.elements.videoPlayer.addEventListener('ended', () => {
            this.sendEvent('video:end', {
                videoId: this.currentVideoId,
                duration: this.elements.videoPlayer.duration,
                timestamp: Date.now()
            });
            
            // Auto-play próximo vídeo se houver playlist
            if (this.currentPlaylist && this.currentVideoIndex < this.currentPlaylist.videos.length - 1) {
                setTimeout(() => this.nextVideo(), 1000);
            } else if (this.currentPlaylist && this.currentPlaylist.loop) {
                setTimeout(() => this.restartPlaylist(), 1000);
            }
        });

        this.elements.videoPlayer.addEventListener('error', (e) => {
            console.error('Erro no player de vídeo:', e);
            this.sendEvent('video:error', {
                videoId: this.currentVideoId,
                error: e.target.error,
                timestamp: Date.now()
            });
            this.showError('Erro ao reproduzir vídeo');
        });

        this.elements.videoPlayer.addEventListener('timeupdate', () => {
            if (this.currentPlaylist) {
                this.updatePlaylistProgress();
            }
        });

        // Eventos de teclado para controle remoto
        document.addEventListener('keydown', (e) => {
            this.handleKeyPress(e);
        });

        // Mostrar/ocultar informações com movimento do mouse
        let hideInfoTimeout;
        document.addEventListener('mousemove', () => {
            this.showInfo();
            clearTimeout(hideInfoTimeout);
            hideInfoTimeout = setTimeout(() => this.hideInfo(), 3000);
        });

        // Eventos de visibilidade da página
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.sendEvent('device:hidden');
            } else {
                this.sendEvent('device:visible');
            }
        });
    }

    handleKeyPress(e) {
        switch(e.code) {
            case 'Space':
                e.preventDefault();
                this.togglePlayPause();
                break;
            case 'ArrowRight':
                e.preventDefault();
                this.nextVideo();
                break;
            case 'ArrowLeft':
                e.preventDefault();
                this.previousVideo();
                break;
            case 'ArrowUp':
                e.preventDefault();
                this.increaseVolume();
                break;
            case 'ArrowDown':
                e.preventDefault();
                this.decreaseVolume();
                break;
            case 'KeyF':
                e.preventDefault();
                this.toggleFullscreen();
                break;
            case 'KeyI':
                e.preventDefault();
                this.toggleInfo();
                break;
        }
    }

    playVideo(data) {
        const { videoUrl, videoId, title } = data;
        
        this.currentVideoId = videoId;
        this.elements.videoPlayer.src = videoUrl;
        this.elements.currentVideo.textContent = title || 'Vídeo sem título';
        
        this.hideLoadingScreen();
        this.hideError();
        
        this.elements.videoPlayer.play().catch(error => {
            console.error('Erro ao reproduzir vídeo:', error);
            this.showError('Erro ao reproduzir vídeo');
        });
    }

    pauseVideo() {
        this.elements.videoPlayer.pause();
    }

    stopVideo() {
        this.elements.videoPlayer.pause();
        this.elements.videoPlayer.currentTime = 0;
        this.elements.videoPlayer.src = '';
        this.showLoadingScreen();
        this.updateStatusText('Vídeo parado');
    }

    loadPlaylist(data) {
        this.currentPlaylist = data;
        this.currentVideoIndex = 0;
        
        this.elements.playlistName.textContent = data.name || 'Playlist sem nome';
        this.updateVideoProgress();
        
        if (data.videos && data.videos.length > 0) {
            this.playCurrentVideo();
        }
    }

    playCurrentVideo() {
        if (this.currentPlaylist && this.currentPlaylist.videos[this.currentVideoIndex]) {
            const video = this.currentPlaylist.videos[this.currentVideoIndex];
            this.playVideo({
                videoUrl: video.url,
                videoId: video.id,
                title: video.title
            });
            this.updateVideoProgress();
        }
    }

    nextVideo() {
        if (this.currentPlaylist && this.currentVideoIndex < this.currentPlaylist.videos.length - 1) {
            this.currentVideoIndex++;
            this.playCurrentVideo();
        } else if (this.currentPlaylist && this.currentPlaylist.loop) {
            this.restartPlaylist();
        }
    }

    previousVideo() {
        if (this.currentPlaylist && this.currentVideoIndex > 0) {
            this.currentVideoIndex--;
            this.playCurrentVideo();
        }
    }

    restartPlaylist() {
        if (this.currentPlaylist) {
            this.currentVideoIndex = 0;
            this.playCurrentVideo();
        }
    }

    togglePlayPause() {
        if (this.elements.videoPlayer.paused) {
            this.elements.videoPlayer.play();
        } else {
            this.elements.videoPlayer.pause();
        }
    }

    updateVolume(volume) {
        this.elements.videoPlayer.volume = Math.max(0, Math.min(1, volume / 100));
    }

    increaseVolume() {
        const currentVolume = this.elements.videoPlayer.volume * 100;
        this.updateVolume(Math.min(100, currentVolume + 10));
    }

    decreaseVolume() {
        const currentVolume = this.elements.videoPlayer.volume * 100;
        this.updateVolume(Math.max(0, currentVolume - 10));
    }

    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    }

    updateConnectionStatus(status) {
        this.elements.connectionStatus.className = `connection-status ${status}`;
        this.elements.connectionStatus.textContent = {
            'connected': 'Conectado',
            'disconnected': 'Desconectado',
            'connecting': 'Conectando'
        }[status] || status;
    }

    updateStatusText(text) {
        this.elements.statusText.textContent = text;
    }

    updateDeviceInfo(data) {
        this.elements.deviceName.textContent = data.name || this.deviceId;
        this.elements.deviceIP.textContent = data.ipAddress || 'N/A';
        this.elements.lastUpdate.textContent = new Date().toLocaleTimeString();
    }

    updateVideoProgress() {
        if (this.currentPlaylist) {
            const current = this.currentVideoIndex + 1;
            const total = this.currentPlaylist.videos.length;
            this.elements.videoProgress.textContent = `${current}/${total}`;
        }
    }

    updatePlaylistProgress() {
        // Atualizar progresso em tempo real se necessário
        this.updateVideoProgress();
    }

    showLoadingScreen() {
        this.elements.loadingScreen.style.display = 'flex';
        this.elements.errorScreen.style.display = 'none';
    }

    hideLoadingScreen() {
        this.elements.loadingScreen.style.display = 'none';
    }

    showError(message) {
        this.elements.errorMessage.textContent = message;
        this.elements.errorScreen.style.display = 'flex';
        this.elements.loadingScreen.style.display = 'none';
    }

    hideError() {
        this.elements.errorScreen.style.display = 'none';
    }

    showInfo() {
        this.elements.deviceInfo.classList.add('show');
        this.elements.playlistInfo.classList.add('show');
    }

    hideInfo() {
        this.elements.deviceInfo.classList.remove('show');
        this.elements.playlistInfo.classList.remove('show');
    }

    toggleInfo() {
        if (this.elements.deviceInfo.classList.contains('show')) {
            this.hideInfo();
        } else {
            this.showInfo();
        }
    }

    handleConnectionError() {
        this.reconnectAttempts++;
        
        if (this.reconnectAttempts <= this.maxReconnectAttempts) {
            this.updateStatusText(`Tentativa de reconexão ${this.reconnectAttempts}/${this.maxReconnectAttempts}...`);
            setTimeout(() => {
                this.updateConnectionStatus('connecting');
            }, 2000 * this.reconnectAttempts);
        } else {
            this.showError('Não foi possível conectar ao servidor. Verifique sua conexão de rede.');
        }
    }

    startHeartbeat() {
        this.heartbeatInterval = setInterval(() => {
            if (this.socket && this.socket.connected) {
                this.sendEvent('device:heartbeat', {
                    timestamp: Date.now(),
                    isPlaying: this.isPlaying,
                    currentVideo: this.currentVideoId,
                    volume: this.elements.videoPlayer.volume * 100
                });
            }
        }, 30000); // Heartbeat a cada 30 segundos
    }

    requestDeviceInfo() {
        this.sendEvent('device:request-info');
    }

    restartSystem() {
        this.updateStatusText('Reiniciando sistema...');
        setTimeout(() => {
            window.location.reload();
        }, 2000);
    }

    updateSystem() {
        this.updateStatusText('Atualizando sistema...');
        setTimeout(() => {
            window.location.reload();
        }, 3000);
    }

    sendEvent(event, data = {}) {
        if (this.socket && this.socket.connected) {
            this.socket.emit(event, {
                deviceId: this.deviceId,
                timestamp: Date.now(),
                ...data
            });
        }
    }

    destroy() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
        }
        
        if (this.socket) {
            this.socket.disconnect();
        }
    }
}

// Inicializar o player quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    window.tvPlayer = new TVBoxPlayer();
});

// Cleanup quando a página for fechada
window.addEventListener('beforeunload', () => {
    if (window.tvPlayer) {
        window.tvPlayer.destroy();
    }
});
