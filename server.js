const { createServer } = require('http');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

const gameTimers = new Map();
const MATCH_DURATION = 7 * 60; // 7 minutos

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    handle(req, res);
  });

  const io = new Server(httpServer, {
    path: '/api/timer/socket',
    addTrailingSlash: false,
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  io.on('connection', (socket) => {
    console.log('Timer client connected:', socket.id);

    socket.on('join-game', (gameId) => {
      socket.join(gameId);
      
      // Enviar estado actual del timer si existe
      const timer = gameTimers.get(gameId);
      if (timer) {
        // Calcular tiempo actual basado en el tiempo transcurrido
        const now = Date.now();
        const elapsed = Math.floor((now - timer.lastUpdate) / 1000);
        const adjustedTime = Math.max(0, timer.timeLeft - (timer.isRunning ? elapsed : 0));
        
        socket.emit('timer-state', {
          timeLeft: adjustedTime,
          isRunning: timer.isRunning,
          whistleHasPlayed: timer.whistleHasPlayed,
          gameId
        });
        
        // Actualizar el timer
        timer.timeLeft = adjustedTime;
        timer.lastUpdate = now;
      } else {
        // Crear nuevo timer para el juego
        gameTimers.set(gameId, {
          timeLeft: MATCH_DURATION,
          isRunning: false,
          whistleHasPlayed: false,
          lastUpdate: Date.now()
        });
        
        socket.emit('timer-state', {
          timeLeft: MATCH_DURATION,
          isRunning: false,
          whistleHasPlayed: false,
          gameId
        });
      }
    });

    socket.on('start-timer', (gameId) => {
      const timer = gameTimers.get(gameId);
      if (!timer || timer.isRunning) return;

      timer.isRunning = true;
      timer.lastUpdate = Date.now();
      
      // Limpiar intervalo anterior si existe
      if (timer.interval) {
        clearInterval(timer.interval);
      }

      // Crear nuevo intervalo
      timer.interval = setInterval(() => {
        if (timer.timeLeft <= 0) {
          // Tiempo terminado
          timer.isRunning = false;
          timer.timeLeft = 0;
          
          if (timer.interval) {
            clearInterval(timer.interval);
          }
          
          io.to(gameId).emit('time-up', { gameId });
          io.to(gameId).emit('timer-state', {
            timeLeft: 0,
            isRunning: false,
            whistleHasPlayed: timer.whistleHasPlayed,
            gameId
          });
          
          return;
        }

        // Reproducir silbato en el minuto 1 (60 segundos)
        if (timer.timeLeft === 60 && !timer.whistleHasPlayed) {
          timer.whistleHasPlayed = true;
          io.to(gameId).emit('whistle-time', { gameId });
        }

        // Decrementar tiempo
        timer.timeLeft -= 1;
        timer.lastUpdate = Date.now();

        // Enviar actualización a todos los clientes
        io.to(gameId).emit('timer-state', {
          timeLeft: timer.timeLeft,
          isRunning: timer.isRunning,
          whistleHasPlayed: timer.whistleHasPlayed,
          gameId
        });
      }, 1000);

      // Enviar estado actualizado
      io.to(gameId).emit('timer-state', {
        timeLeft: timer.timeLeft,
        isRunning: timer.isRunning,
        whistleHasPlayed: timer.whistleHasPlayed,
        gameId
      });
    });

    socket.on('stop-timer', (gameId) => {
      const timer = gameTimers.get(gameId);
      if (!timer) return;

      timer.isRunning = false;
      if (timer.interval) {
        clearInterval(timer.interval);
        timer.interval = undefined;
      }

      io.to(gameId).emit('timer-state', {
        timeLeft: timer.timeLeft,
        isRunning: false,
        whistleHasPlayed: timer.whistleHasPlayed,
        gameId
      });
    });

    socket.on('reset-timer', (gameId) => {
      const timer = gameTimers.get(gameId);
      if (!timer) return;

      timer.timeLeft = MATCH_DURATION;
      timer.isRunning = false;
      timer.whistleHasPlayed = false;
      timer.lastUpdate = Date.now();

      if (timer.interval) {
        clearInterval(timer.interval);
        timer.interval = undefined;
      }

      io.to(gameId).emit('timer-state', {
        timeLeft: MATCH_DURATION,
        isRunning: false,
        whistleHasPlayed: false,
        gameId
      });
    });

    socket.on('reset-whistle', (gameId) => {
      const timer = gameTimers.get(gameId);
      if (!timer) return;

      timer.whistleHasPlayed = false;

      io.to(gameId).emit('timer-state', {
        timeLeft: timer.timeLeft,
        isRunning: timer.isRunning,
        whistleHasPlayed: false,
        gameId
      });
    });

    socket.on('disconnect', () => {
      console.log('Timer client disconnected:', socket.id);
    });
  });

  httpServer
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
}); 