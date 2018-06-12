// tslint:disable:no-implicit-dependencies (dev dependencies are enough for tests)
// tslint:disable:no-unused-expression (chai expressions are indeed used)
// tslint:disable:only-arrow-functions (arrow functions are not recommanded for mocha)
import { expect } from 'chai'
import { IReactionDisposer, autorun, configure } from 'mobx'

import { isLoading, load, loadable } from '.'
import ExampleClass, { Person } from './ExampleClass.spec'

// Configure in strict mode
configure({ enforceActions: true })

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
    expect(isLoading(example.persons)).to.be.false
    expect(isLoading(example.boss)).to.be.false
    expect(isLoading(example.moto)).to.be.false
    expect(example.persons.length).to.equal(0)
    expect(example.boss).to.deep.equal(FAMOUS[0])
    expect(example.moto).to.be.undefined
  })

  afterEach('Clean up', function() {
    disposers.forEach(disposer => disposer())
  })

  it('must throw an error if applying to a non modifiable property', function() {
    Object.defineProperty(example, 'non-modifiable', { configurable: false })
    expect(() => loadable(example, 'non-modifiable')).to.throw(
      'Cannot convert non-modifiable to loadable'
    )
  })

  it('must throw an error if non applied on property given to @load', function() {
    const descriptor: any = Object.getOwnPropertyDescriptor(example, 'loadMoto')
    expect(() => load('counter')(example, 'loadMoto', descriptor)).to.throw(
      'is not a @loadable'
    )
  })

  it('must throw an error if non existing property given to @load', function() {
    const descriptor: any = Object.getOwnPropertyDescriptor(example, 'loadMoto')
    expect(() => load('unknown')(example, 'loadMoto', descriptor)).to.throw(
      'is not a @loadable'
    )
  })

  describe('@load(boolean)', function() {
    it('must indicate when loading', async function() {
      let promise
      promise = example.loadPersons()
      expect(example.persons.length).to.equal(0)
      expect(isLoading(example.persons)).to.be.true
      expect(counters.persons).to.equal(1)
      await promise
      expect(example.persons.length).to.equal(FAMOUS.length)
      expect(isLoading(example.persons)).to.be.false
      expect(counters.persons).to.equal(2)
      promise = example.loadPersons()
      expect(example.persons.length).to.equal(FAMOUS.length)
      expect(isLoading(example.persons)).to.be.true
      expect(counters.persons).to.equal(3)
      await promise
      expect(example.persons.length).to.equal(0)
      expect(isLoading(example.persons)).to.be.false
      expect(counters.persons).to.equal(4)
      expect(counters.boss).to.equal(0)
      expect(counters.moto).to.equal(0)
    })
  })

  describe('@load()', function() {
    it('must indicate when loading', async function() {
      let promise
      promise = example.loadBoss()
      expect(example.boss).to.deep.equal(FAMOUS[0])
      expect(isLoading(example.boss)).to.be.true
      expect(counters.boss).to.equal(1)
      await promise
      expect(example.boss).to.deep.equal(FAMOUS[1])
      expect(isLoading(example.boss)).to.be.false
      expect(counters.boss).to.equal(2)
      promise = example.loadBoss()
      expect(example.boss).to.deep.equal(FAMOUS[1])
      expect(isLoading(example.boss)).to.be.true
      expect(counters.boss).to.equal(3)
      await promise
      expect(example.boss).to.deep.equal(FAMOUS[2])
      expect(isLoading(example.boss)).to.be.false
      expect(counters.boss).to.equal(4)
      expect(counters.persons).to.equal(0)
      expect(counters.moto).to.equal(0)
    })
  })

  describe('@load(function)', function() {
    it('must indicate when loading', async function() {
      let promise
      promise = example.loadMoto()
      expect(isLoading(example.moto)).to.be.true
      expect(counters.moto).to.equal(1)
      await promise
      expect(example.moto).to.be.an('object')
      expect(isLoading(example.moto)).to.be.false
      expect(counters.moto).to.equal(2)
      expect(counters.persons).to.equal(0)
      expect(counters.boss).to.equal(0)
    })
  })
})
