let timerId = null;
let timeLeft = 0; // The worker will keep track of the time

self.onmessage = function(e) {
  const { command, value } = e.data;

  switch (command) {
    case 'start':
      if (timerId) clearInterval(timerId); // Clear any existing timer
      timerId = setInterval(() => {
        if (timeLeft > 0) {
          timeLeft--;
          self.postMessage({ type: 'tick', timeLeft });
        } else {
          clearInterval(timerId);
          timerId = null;
          self.postMessage({ type: 'done' });
        }
      }, 1000);
      break;
    case 'pause':
      clearInterval(timerId);
      timerId = null;
      break;
    case 'setTime':
      timeLeft = value;
      break;
    case 'getTime':
        self.postMessage({ type: 'time', timeLeft });
        break;
  }
}; 