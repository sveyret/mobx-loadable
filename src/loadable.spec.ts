// tslint:disable:no-implicit-dependencies (dev dependencies are enough for tests)
// tslint:disable:no-unused-expression (chai expressions are indeed used)
// tslint:disable:only-arrow-functions (arrow functions are not recommanded for mocha)
import { expect } from 'chai'
import { IReactionDisposer, action, autorun, computed, configure } from 'mobx'

import { Loading, isLoading, load, loadable } from '.'

// Configure in strict mode
configure({ enforceActions: true })

interface Person {
  firstName: string
  lastName: string
}

const MOTO: string = 'Timigu min, kaj mi obeos honte ; konvinku min, kaj mi obeos volonte'

class ExampleClass {
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

const FAMOUS: Person[] = [
  { firstName: 'Mohandas Karamchand', lastName: 'Gandhi' },
  { firstName: 'Nelson', lastName: 'Mandela' },
  { firstName: 'Clara', lastName: 'Rockmore' },
  { firstName: 'Michel', lastName: 'Colucci' },
  { firstName: 'Albert', lastName: 'Einstein' },
  { firstName: 'Marie', lastName: 'Curie' },
]

const PROPS: Array<'persons' | 'boss' | 'moto'> = ['persons', 'boss', 'moto']

describe('@loadable', function() {
  let counters: { [prop: string]: number }
  let example: ExampleClass
  let disposers: IReactionDisposer[]
  let records: string[]

  beforeEach('Create and spy new example class', function() {
    example = new ExampleClass(FAMOUS)
    counters = {}
    disposers = []
    records = []
    PROPS.forEach(prop => {
      counters[prop] = -1 // Set to 0 at initial call
      disposers.push(
        autorun(() => {
          counters[prop]++
          records.push(`Reading content of ${prop}: ${example[prop]}`)
        })
      )
    })
    expect(isLoading(example.persons), 'Persons should not be loading').to.be.false
    expect(isLoading(example.boss), 'Boss should not be loading').to.be.false
    expect(isLoading(example.moto), 'Moto should not be loading').to.be.false
    expect(example.persons, 'Unexpected value for persons').to.have.lengthOf(0)
    expect(example.boss, 'Unexpected value for boss').to.deep.equal(FAMOUS[0])
    expect(example.moto, 'Unexpected value for moto').to.be.undefined
  })

  afterEach('Clean up', function() {
    disposers.forEach(disposer => disposer())
  })

  it('must throw an error if applying to a non modifiable property', function() {
    Object.defineProperty(example, 'non-modifiable', { configurable: false })
    expect(() => loadable(example, 'non-modifiable')).to.throw(/cannot convert non-modifiable to loadable/i)
  })

  it('must throw an error if non applied on property given to @load', function() {
    const descriptor: any = Object.getOwnPropertyDescriptor(example, 'loadMoto')
    expect(() => load('counter')(example, 'loadMoto', descriptor)).to.throw(/is not a @loadable/i)
  })

  it('must throw an error if non existing property given to @load', function() {
    const descriptor: any = Object.getOwnPropertyDescriptor(example, 'loadMoto')
    expect(() => load('unknown')(example, 'loadMoto', descriptor)).to.throw(/is not a @loadable/i)
  })

  describe('@load(boolean)', function() {
    it('must indicate when loading', async function() {
      let promise
      promise = example.loadPersons()
      expect(example.persons, 'Persons should not be loaded yet').to.have.lengthOf(0)
      expect(isLoading(example.persons), 'Persons should be loading').to.be.true
      expect(counters.persons, 'Update state of persons should have been detected').to.equal(1)
      await promise
      expect(example.persons, 'All persons should now be loaded').to.have.lengthOf(FAMOUS.length)
      expect(isLoading(example.persons), 'Persons should not be loading anymore').to.be.false
      expect(counters.persons, 'Update state of persons should have been detected').to.equal(2)
      promise = example.loadPersons()
      expect(example.persons, 'Persons should have kept old values').to.have.lengthOf(FAMOUS.length)
      expect(isLoading(example.persons), 'Persons should be loading once more').to.be.true
      expect(counters.persons, 'Update state of persons should have been detected').to.equal(3)
      await promise
      expect(example.persons, 'Persons should be updated with emptyness').to.have.lengthOf(0)
      expect(isLoading(example.persons), 'New persons loading should be finished').to.be.false
      expect(counters.persons, 'Update state of persons should have been detected').to.equal(4)
      expect(counters.boss, 'Boss state should not have changed').to.equal(0)
      expect(counters.moto, 'Moto state should not have changed').to.equal(0)
    })
  })

  describe('@load()', function() {
    it('must indicate when loading', async function() {
      let promise
      promise = example.loadBoss()
      expect(example.boss, 'Boss should have last value').to.deep.equal(FAMOUS[0])
      expect(isLoading(example.boss), 'Boss should be loading').to.be.true
      expect(counters.boss, 'Update state of boss should have been detected').to.equal(1)
      await promise
      expect(example.boss, 'Boss should have loaded value').to.deep.equal(FAMOUS[1])
      expect(isLoading(example.boss), 'Boss should not be loading anymore').to.be.false
      expect(counters.boss, 'Update state of boss should have been detected').to.equal(2)
      promise = example.loadBoss()
      expect(example.boss, 'Boss should still have loaded value').to.deep.equal(FAMOUS[1])
      expect(isLoading(example.boss), 'Boss should be loading once more').to.be.true
      expect(counters.boss, 'Update state of boss should have been detected').to.equal(3)
      await promise
      expect(example.boss, 'Boss should have new loaded value').to.deep.equal(FAMOUS[2])
      expect(isLoading(example.boss), 'New boss loading should be finished').to.be.false
      expect(counters.boss, 'Update state of boss should have been detected').to.equal(4)
      expect(counters.persons, 'Person state should not have changed').to.equal(0)
      expect(counters.moto, 'Moto state should not have changed').to.equal(0)
    })
  })

  describe('@load(function)', function() {
    it('must indicate when loading', async function() {
      let promise
      promise = example.loadMoto()
      expect(isLoading(example.moto), 'Moto should be loading').to.be.true
      expect(counters.moto, 'Update state of moto should have been detected').to.equal(1)
      await promise
      expect(example.moto, 'Unexpected moto loaded value').to.be.an('object')
      expect(isLoading(example.moto), 'Moto should not be loading anymore').to.be.false
      expect(counters.moto, 'Update state of moto should have been detected').to.equal(2)
      expect(counters.persons, 'Person state should not have changed').to.equal(0)
      expect(counters.boss, 'Boss state should not have changed').to.equal(0)
    })
  })
})
