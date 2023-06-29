import type { TypedEmitter } from 'tiny-typed-emitter'

export type Observation = string

export interface MapeoCoreApiEvents {
  update: (observations: Observation[]) => void
}

export interface MapeoCoreApi extends TypedEmitter<MapeoCoreApiEvents> {
  getObservations(): Array<Observation>
  createObservation(name: string): void
  deleteObservation(name: string): void
}
