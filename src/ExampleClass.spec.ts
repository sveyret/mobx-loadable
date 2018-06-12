import { action, computed } from 'mobx'

import { Loading, isLoading, load, loadable } from '.'

export interface Person {
  firstName: string
  lastName: string
}

const MOTO: string =
  'Timigu min, kaj mi obeos honte ; konvinku min, kaj mi obeos volonte'

export default class ExampleClass {
  @loadable() public readonly persons: Person[] = []
  private counter: number = 0
  @loadable private _boss: Person
  @loadable private _moto?: string

  public constructor(private readonly people: Person[]) {
    this._boss = people[this.counter]
  }

  @load('persons', true)
  public loadPersons() {
    return new Promise<void>(res => {
      setTimeout(() => {
        this.updatePersons(this.persons.length === 0 ? this.people : [])
        res()
      }, 100)
    })
  }

  public async loadBoss() {
    this.setBossLoading(true)
    return new Promise<void>(res => {
      setTimeout(() => {
        if (++this.counter > this.people.length) {
          this.counter = 0
        }
        this.updateBoss(this.people[this.counter])
        res()
      }, 100)
    })
  }

  public async loadMoto() {
    this.updateMoto()
    return new Promise<void>(res => {
      setTimeout(() => {
        this.updateMoto(MOTO)
        res()
      }, 100)
    })
  }

  public get boss() {
    return this._boss
  }

  @computed
  public get moto(): undefined | { moto: string } | Loading {
    if (this._moto === undefined || isLoading(this._moto)) {
      return this._moto
    } else {
      return { moto: this._moto }
    }
  }

  @action
  @load('persons', false)
  private updatePersons(persons: Person[]) {
    while (this.persons.length > 0) {
      this.persons.pop()
    }
    this.persons.push(...persons)
  }

  @action
  private updateBoss(boss: Person) {
    this._boss = boss
    this.setBossLoading(false)
  }

  @load('_boss')
  private setBossLoading(_status: boolean) {
    // Everything is done in decorator
  }

  @action
  @load('_moto', (moto: any) => !moto)
  private updateMoto(moto?: string) {
    this._moto = moto
  }
}
