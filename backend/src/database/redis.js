// Redis client com suporte a modo desabilitado (REDIS_DISABLED=true)

class RedisStub {
  ping() { return Promise.resolve('PONG') }
  get() { return Promise.resolve(null) }
  set() { return Promise.resolve('OK') }
  del() { return Promise.resolve(1) }
  expire() { return Promise.resolve(1) }
  on() { return this }
}

export const redis = new RedisStub()
