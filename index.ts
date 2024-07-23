export type EventType = string | symbol

// An event handler can take an optional event argument
// and should not return a value
export type Handler<T = unknown> = (event: T, ...args) => void

export type EventHanderItem<T, C> = {
    handler: Handler<T[keyof T]> | WildcardHandler<T>
    context: C
}

export type WildcardHandler<T = Record<string, unknown>> = (
    type: keyof T,
    event: T[keyof T]
) => void

// An array of all currently registered event handlers for a type
export type EventHandlerList<T, C> = Array<EventHanderItem<T, C>>
export type WildCardEventHandlerList<T, C> = Array<EventHanderItem<T, C>>

// A map of event types and their corresponding event handlers.
export type EventHandlerMap<MittEvents extends Record<EventType, unknown>> = Map<
    keyof MittEvents | '*',
    EventHandlerList<MittEvents[keyof MittEvents], any> | WildCardEventHandlerList<MittEvents, any>
>

export interface Emitter<MittEvents extends Record<EventType, unknown>> {
    all: EventHandlerMap<MittEvents>

    on<Key extends keyof MittEvents>(type: Key, handler: Handler<MittEvents[Key]>, context?: any): void
    on(type: '*', handler: WildcardHandler<MittEvents>): void

    off<Key extends keyof MittEvents>(type: Key, handler?: Handler<MittEvents[Key]>): void
    off(type: '*', handler: WildcardHandler<MittEvents>): void

    emit<Key extends keyof MittEvents>(type: Key, event: MittEvents[Key], ...args): void
    emit<Key extends keyof MittEvents>(type: undefined extends MittEvents[Key] ? Key : never, ...args): void
}



/**
 * 扩展mitt库，增加执行时指定上下文和传入多个参数
 * Mitt: functional event emitter / pubsub.
 * @name mitt
 * @returns {Mitt}
 */
export default function mitt<MittEvents extends Record<EventType, unknown>>(
    all?: EventHandlerMap<MittEvents>
): Emitter<MittEvents> {
    type GenericEventHandler = Handler<MittEvents[keyof MittEvents]> | WildcardHandler<MittEvents>
    all = all || new Map()

    return {
        /**
         * A Map of event names to registered handler functions.
         */
        all,

        /**
         * Register an event handler for the given type.
         * @param {string|symbol} type Type of event to listen for, or `'*'` for all events
         * @param {Function} handler Function to call in response to given event
         * @memberOf mitt
         */
        on<Key extends keyof MittEvents>(type: Key, handler: GenericEventHandler, context?: any) {
            const handlers: Array<EventHanderItem<GenericEventHandler, any>> | undefined = all!.get(type)
            if (handlers) {
                handlers.push({ handler, context })
            } else {
                all!.set(type, [{ handler, context }] as Array<EventHanderItem<GenericEventHandler, any>>)
            }
        },

        /**
         * Remove an event handler for the given type.
         * If `handler` is omitted, all handlers of the given type are removed.
         * @param {string|symbol} type Type of event to unregister `handler` from (`'*'` to remove a wildcard handler)
         * @param {Function} [handler] Handler function to remove
         * @memberOf mitt
         */
        off<Key extends keyof MittEvents>(type: Key, handler?: GenericEventHandler) {
            const handlers: Array<EventHanderItem<GenericEventHandler, any>> | undefined = all!.get(type)
            if (handlers) {
                if (handler) {
                    const index = handlers.findIndex((v) => v.handler === handler)
                    handlers.splice(index >>> 0, 1)
                } else {
                    all!.set(type, [])
                }
            }
        },

        /**
         * Invoke all handlers for the given type.
         * If present, `'*'` handlers are invoked after type-matched handlers.
         *
         * Note: Manually firing '*' handlers is not supported.
         *
         * @param {string|symbol} type The event type to invoke
         * @param {Any} [evt] Any value (object is recommended and powerful), passed to each handler
         * @memberOf mitt
         */
        emit<Key extends keyof MittEvents>(type: Key, evt?: MittEvents[Key], ...args) {
            let handlers = all!.get(type)
            if (handlers) {
                ;(handlers as Array<EventHanderItem<GenericEventHandler, any>>).slice().map((item) => {
                    item.handler.call(item.context, evt!, ...args)
                })
            }

            handlers = all!.get('*')
            if (handlers) {
                ;(handlers as WildCardEventHandlerList<MittEvents>).slice().map((item) => {
                    item.handler.call(item.context, type, evt!, ...args)
                })
            }
        }
    }
}
