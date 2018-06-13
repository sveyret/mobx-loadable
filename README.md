[![npm package](https://badge.fury.io/js/mobx-loadable.svg)](https://www.npmjs.com/package/mobx-loadable)
[![license](https://img.shields.io/github/license/sveyret/mobx-loadable.svg)](https://github.com/sveyret/mobx-loadable/blob/master/LICENSE)
[![build](https://api.travis-ci.org/sveyret/mobx-loadable.svg?branch=master)](https://travis-ci.org/sveyret/mobx-loadable)
[![coverage](https://coveralls.io/repos/github/sveyret/mobx-loadable/badge.svg?branch=master)](https://coveralls.io/github/sveyret/mobx-loadable)
[![issues](https://img.shields.io/github/issues/sveyret/mobx-loadable.svg)](https://github.com/sveyret/mobx-loadable/issues)

# Loadable decorator for mobx

mobx-loadable is a small library written in Typescript allowing to set some properties of an object loadable. The loadable property will then have a hidden state indicating that it is currently being loaded. This can be useful when used with a store which is sometimes refreshing its data from a server. Previous data value still can be accessed while loading, and then can be displayed, with an hourglass to indicate that it is being updated.

A loadable property is an observable property. Each change either to the value or to the loading state of the property can be observed.

# Installation

Installation is done using `npm install` command:

```bash
$ npm install --save mobx-loadable
```

If you prefer using `yarn`:

```bash
$ yarn add mobx-loadable
```

# Language/langue

Because French is my native language, finding all documents and messages in French is not an option. Other translations are welcome.

Anyway, because English is the language of programming, the code, including variable names and comments, are in English.

:fr: Une version française de ce document se trouve [ici](doc/fr/README.md).

# Usage

## @loadable

The `@loadable` property decorator can be used either directly, i.e. `@loadable` or as a decorator factory, i.e. `@loadable()`. All the loadable properties are also automatically observable.

```typescript
  @loadable()
  public readonly persons: Person[] = []
  @loadable
  private _boss: Person
  @loadable
  private _moto?: string
```

## @load

The `@load` method decorator factory is used to update the loading state of the properties. Its first parameter is always the name of the property to update. The loading state update is automatically done in an `@action`, but you may need to manually add an `@action` anyway if you also modify the value of the property in the method. The loading state is updated when entering the method. The decorator factory can be used in 3 different ways:

```typescript
  @load('persons', true)
  loadPersons() {
    axios.get('/persons').then(this.updatePersons)
  }

  @action
  @load('persons', false)
  updatePersons(response: any) {
      // this.persons = …
  }
```

When the second parameter of `@load` is a boolean, it will be the value set to the loading state.

```typescript
  loadPersons() {
    this.setLoadingPersons(true)
    axios.get('/persons').then(() => {
      // this.updatePersons(response)
      this.setLoadingPersons(false)
    })
  }

  @load('persons')
  setLoadingPersons(loading: boolean) {
      // this.persons = …
  }
```

When only one parameter is given to `@load`, the first parameter given to the decorated method will be used as the loading state value.

```typescript
  loadPersons() {
    this.updatePersons([])
    axios.get('/persons').then(() => {
      // const persons = convert(response)
      this.updatePersons(persons)
    })
  }

  @action
  @load('persons', (persons: any[]) => persons.length === 0)
  updatePersons(persons: Persons[]) {
      this.persons = persons
  }
```

When the second parameter given to `@load` is a function, this function will be called with the decorated method arguments and must return a boolean which will be used as the loading state value.

## Loading and non-objects

In order for the loading state to be added, the property must be an object. If it is not the case, it will be transformed into an object when the loading state is set to `true`. In other words, while the property is loading:

| if the property is | it will become |
|--------------------|----------------|
| `undefined`        | {}             |
| `null`             | {}             |
| boolean            | Boolean        |
| number             | Number         |
| string             | String         |
| symbol             | Symbol         |

So **you have to be careful when using the property** (e.g. as a non empty object, a Boolean with value `false` will be truthy inside a `if`). If the real value is not needed while loading, you may indicate that the property can return a value of type `Loading`:

```typescript
  @computed
  get user() undefined | User | Loading {
    if (this._userId === undefined || isLoading(this._userId)) {
      return this._userId
    } else {
      return this._users.find(user => user.id === this._userId)
    }
  }
```

## isLoading()

The `isLoading` method takes an object as argument and indicates if it is currently being loaded.

In Typescript, the `isLoading` method is a type guard. It means that with Typescript, it can be used to filter the `Loading` type of the property.

```typescript
const user: User | Loading = getValues()
if (isLoading(user)) {
  // user is of type Loading
} else {
  // user is of type User
}
```
