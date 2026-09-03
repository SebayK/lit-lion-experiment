import { ReactiveController, ReactiveControllerHost } from 'lit';
import { Unsubscribe } from '@reduxjs/toolkit';
import { store, RootState } from './index.js';

export class StoreController implements ReactiveController {
  private host: ReactiveControllerHost;
  private unsubscribe?: Unsubscribe;

  constructor(host: ReactiveControllerHost) {
    this.host = host;
    host.addController(this);
  }

  hostConnected() {
    this.unsubscribe = store.subscribe(() => {
      this.host.requestUpdate();
    });
  }

  hostDisconnected() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }

  get state(): RootState {
    return store.getState();
  }
}
