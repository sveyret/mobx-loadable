import { action, computed, observable } from 'mobx'

export const $loading = Symbol('Loading indicator')

export interface Loading {
  [$loading]: true
}
export function isLoading(obj: any): obj is Loading {
  return !!(obj && obj[$loading])
}

class LoadableProperty {
  @observable private _value?: any
  @observable private _loading: boolean = false

  @computed
  public get value() {
    if (this._loading) {
      return new Proxy(Object(this._value), { get: this.getProperty })
    } else {
      return this._value
    }
  }

  @action
  public updateValue(value: any) {
    this._value = value
  }

  @action
  public updateLoading(loading: boolean) {
    this._loading = loading
  }

  private getProperty(target: any, p: PropertyKey): any {
    if (p === $loading) {
      return true
    } else {
      return target[p]
    }
  }
}

const $loadable = Symbol('Loadable data')

/**
 * The @loadable decorator indicates a value which is observed and may be in a loading state. The decorator may either
 * be used directly or as a decorator factory, i.e. one can either use @loadable() or @loadable without parenthesis.
 */
export function loadable(): PropertyDecorator
// tslint:disable-next-line:ban-types (This is taken from PropertyDecorator signature)
export function loadable(target: Object, propertyKey: string | symbol): void
export function loadable(
  target?: any,
  propertyKey?: string | symbol
): PropertyDecorator | void {
  // Called as a factory
  if (propertyKey === undefined) {
    return loadable

    // Decorate property
  } else {
    // Create hidden $loadable property if not done yet
    if (!target[$loadable]) {
      Object.defineProperty(target, $loadable, {
        configurable: false,
        enumerable: false,
        value: {},
        writable: false,
      })
    }

    // Create and register the loadable property
    const loadableProperty = new LoadableProperty()
    target[$loadable][propertyKey] = loadableProperty

    // Replace property
    const descriptor = Object.getOwnPropertyDescriptor(target, propertyKey)
    const configurable = !descriptor || descriptor.configurable
    if (configurable && delete target[propertyKey]) {
      Object.defineProperty(target, propertyKey, {
        ...descriptor,
        get: () => loadableProperty.value,
        set: (value: any) => {
          loadableProperty.updateValue(value)
        },
      })
    } else {
      throw new Error(`Cannot convert ${propertyKey.toString()} to loadable`)
    }
  }
}

export type StatusExtractorFunction = (...args: any[]) => boolean

/**
 * The @load decorator factory is used to transform a method for it updates the loading state of a property. This method
 * takes at least one boolean parameter which is the new loading state.
 * @param propertyKey The name of the property for which to update loading state.
 * @param statusExtractor Either a boolean or a method which will be given the decorated method parameters, used to give
 * the new loading status. The first parameter of the method is used if statusExtractor is not given.
 */
export function load(
  propertyKey: string | symbol,
  statusExtractor?: boolean | StatusExtractorFunction
): MethodDecorator {
  if (statusExtractor === undefined) {
    return load(propertyKey, (loading: boolean) => loading)
  } else if (typeof statusExtractor === 'boolean') {
    return load(propertyKey, () => statusExtractor)
  } else {
    return (target: any, _key, descriptor) => {
      if (target[$loadable] && target[$loadable][propertyKey]) {
        const loadableProperty: LoadableProperty =
          target[$loadable][propertyKey]
        const originalMethod: any = descriptor.value!
        descriptor.value = function(this: any, ...args: any[]) {
          loadableProperty.updateLoading(statusExtractor(...args))
          return originalMethod.apply(this, args)
        } as any
        return descriptor
      } else {
        throw new Error(`${propertyKey.toString()} is not a @loadable`)
      }
    }
  }
}
