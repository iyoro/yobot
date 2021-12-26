export default class EventBus {
  constructor(logger) {
    this.logger = logger;
    this.listeners = [];
    this.active = true;
  }

  /**
   * Add a listener. This is an object with an accept(type) and notify(evt) method.
   * 
   * @param {object} listener Listener object.
   */
  addListener(listener) {
    if (!listener || typeof listener !== 'object') { return; }
    this.listeners.unshift(listener);
    this.logger.trace({ listener }, 'add listener');
  }

  /**
   * Notify listeners.
   * 
   * @param {string} type Event type
   * @param {object} event Event object
   * @return {Promise} A promise which resolves after all the relevant event notifiers have been notified. The value in the promise is unspecified.
   */
  async notify(type, event) {
    if (!type) { return; }
    if (!this.active) { return; }
    this.logger.trace({ event, type }, 'notify');
    return Promise.all(this.listeners.filter(it => it.accept(type)).map(async it => it.notify(event, this)));
  }

  /**
   * Stop the bus from processing further events.
   */
  shutdown() {
    this.logger.debug('shutdown');
    this.active = false;
  }
}
