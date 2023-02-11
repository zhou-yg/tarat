class EE {
  listeners = {}

  publish (topic, data) {
    const funcs = this.listeners[topic]
    if (funcs) {
      funcs.forEach(fn => fn(data))
    }
  }

  subscribe (topic, callback) {
    if (!this.listeners[topic]) {
      this.listeners[topic] = []
    }
    this.listeners[topic].push(callback)
    return () => {
      this.listeners[topic] = this.listeners[topic].filter(f => f !== callback)
    }
  }
  once (topic, callback) {
    this.subscribe(topic, (...args) => {
      this.off(topic, callback)
      callback(...args)
    })
  }
  off (topic, callback) {
    if (callback) {
      if (this.listeners[topic]) {
        this.listeners[topic] = this.listeners[topic].filter(f => f !== callback)
      }
    } else {
      this.listeners[topic] = []
    }
  }
}