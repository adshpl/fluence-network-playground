import { writable } from 'svelte/store';
import { Observable } from 'rxjs';
import { Fluence } from '@fluencelabs/fluence';
import Store from './store';

const store = writable({
  isInitialized: false,
  isConnected: false,
  peerId: null,
  relayPeerId: null,
});

export default new class NetworkStore extends Store {
  constructor() {
    super(store);
  }

  updateStatus() {
    const status = Fluence.getStatus();
    this.store.set(status);
  }

  isConnectionActive() {
    return new Observable((subscriber) => {
      store.subscribe((data) => {
        const { isInitialized, isConnected } = data;
        const isActive = (isInitialized && isConnected) || false;
        subscriber.next(isActive);
      });
    });
  }

  useStatusPooling(timeout = 20000) {
    const statusPooling = setInterval(() => {
      this.updateStatus();
    }, timeout);

    return () => clearInterval(statusPooling);
  }

  async connectToPeer(peer) {
    const { multiaddr } = peer;

    await Fluence.start({
      connectTo: multiaddr,
    });
    this.updateStatus();
  }

  async disconnect() {
    await Fluence.stop();
    this.reset();
  }
}();
