# Loadable decorator for mobx

mobx-loadable est une petite bibliothèque écrite en Typescript qui permet de définir des propriétés d'un objet comme _loadable_ (chargeable). Une propriété chargeable a un statut caché indiquant si elle est en cours de chargement. Cela peut être utile avec des magasins qui rafraichirait ses données depuis un serveur. Les valeurs précédente des données continuent a être accessibles durant le chargement, et peuvent donc être affichées, avec un sablier pour indiquer que leur mise à jour est en cours.

Une propriété chargeable est également observable. Chaque modification, que ce soit sur sa valeur ou sur son statut de chargement, peut être observée.

# Installation

L'installation se fait avec la commande `npm install` :

```bash
$ npm install --save mobx-loadable
```

Si vous préférez utiliser `yarn` :

```bash
$ yarn add mobx-loadable
```

# Langue

Le français étant ma langue maternelle, fournir les documents et messages en français n'est pas une option. Les autres traductions sont bienvenues.

Cependant, l'anglais étant la langue de la programmation, le code, y compris les noms de variable et commentaires, sont en anglais.

# Utilisation

## @loadable

Le décorateur de propriété `@loadable` peut être utilisé directement, avec `@loadable` ou comme une fabrique de décorateur, avec `@loadable()`. Toutes les propriétés chargeables sont automatiquement observables.

```typescript
  @loadable()
  public readonly persons: Person[] = []
  @loadable
  private _boss: Person
  @loadable
  private _moto?: string
```

## @load

La fabrique de décorateur de méthode `@load` est utilisée pour mettre à jour le statut de chargement de la propriété. Son premier paramètre est toujours le nom de la propriété à mettre à jour. La mise à jour de le statut de chargement est automatiquement effectué dans une `@action`, mais il peut être quand même nécessaire d'ajouter manuellement un décorateur `@action` si la valeur de la propriété est modifiée dans la méthode. Le statut de chargement est mis à jour à l'entrée de la méthode. La fabrique de décorateur peut être utilisée de 3 manières différentes :

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

Lorsque le second paramètre de `@load` est un booléen, il s'agit de la valeur qui sera positionnée comme statut de chargement.

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

Lorsqu'un seul paramètre est donné à `@load`, le premier paramètre passé à la méthode décorée sera utilisé comme valeur du statut de chargement.

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

Lorsque le second paramètre donné à `@load` est une fonction, celle-ci sera appelée avec les paramètres de la méthode décorée et doit renvoyer un booléen qui sera utilisé comme valeur du statut de chargement.

## Loading et non-objets

Afin d'ajouter le statut de chargement, la propriété doit être un objet. Si ce n'est pas le cas, elle sera transformée en objet lorsque le statut de chargement est positionné sur `true`. Autrement dit, lorsque la propriété est en cours de chargement :

| si la propriété est | elle deviendra |
|---------------------|----------------|
| `undefined`         | {}             |
| `null`              | {}             |
| boolean             | Boolean        |
| number              | Number         |
| string              | String         |
| symbol              | Symbol         |

**Il faut donc faire attention lorsque la propriété est utilisée** (par exemple, un Boolean contenant la valeur `false` étant un objet non vide, il sera évalué comme vrai dans un `if`). Si la valeur réelle n'est pas utilisée en cours de chargement, il est possible d'indiquer que la propriété peut renvoyer une valeur de type `Loading` :

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

La méthode `isLoading` prend un objet en argument et indique s'il est actuellement en cours de chargement.

En Typescript, la méthode `isLoading` est un _type guard_. Cela veut dire que, avec Typescript, elle peut être utilisée pour filtrer le type `Loading` de la propriété.

```typescript
const user: User | Loading = getValues()
if (isLoading(user)) {
  // user est de type Loading
} else {
  // user est de type User
}
```
