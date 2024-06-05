import { createServer } from 'rpc-reflector'
import { TypedEmitter } from 'tiny-typed-emitter'

export type Observation = string

export interface MapeoCoreApiEvents {
  update: (observations: Observation[]) => void
}

export interface MapeoCoreApi extends TypedEmitter<MapeoCoreApiEvents> {
  getObservations(): Array<Observation>
  createObservation(name: string): void
  deleteObservation(name: string): void
}

class FakeMapeo extends TypedEmitter<MapeoCoreApiEvents> {
  #observations = new Set(['Doc', 'Grumpy', 'Happy'])
  getObservations() {
    return Array.from(this.#observations)
  }

  createObservation(name: string) {
    this.#observations.add(name)
    this.emit('update', Array.from(this.#observations))
  }

  deleteObservation(name: string) {
    this.#observations.delete(name)
    this.emit('update', Array.from(this.#observations))
  }
}

const mapeo = new FakeMapeo()

// We might get multiple clients, for instance if there are multiple windows,
// or if the main window reloads.
process.parentPort.on('message', (event) => {
  const [port] = event.ports

  // Shouldn't happen but maybe log error?
  if (!port) return

  createServer(mapeo, port)

  port.start()
})
