// @ts-check
import { createServer } from 'rpc-reflector'
import { TypedEmitter } from 'tiny-typed-emitter'

/**
 * @extends {TypedEmitter<import('../shared.ts').MapeoCoreApiEvents>}
 */
class FakeMapeo extends TypedEmitter {
  #observations = new Set(['Doc', 'Grumpy', 'Happy'])
  getObservations() {
    return Array.from(this.#observations)
  }
  /**
   *
   * @param {string} name
   */
  createObservation(name) {
    this.#observations.add(name)
    this.emit('update', Array.from(this.#observations))
  }

  /**
   *
   * @param {string} name
   */
  deleteObservation(name) {
    this.#observations.delete(name)
    this.emit('update', Array.from(this.#observations))
  }
}

const mapeo = new FakeMapeo()

// We might get multiple clients, for instance if there are multiple windows,
// or if the main window reloads.
process.parentPort.on('message', (event) => {
  const [port] = event.ports
  const { close } = createServer(mapeo, port)
  port.start()
})
