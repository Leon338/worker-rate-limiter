# Worker Rate Limiter

**Worker Rate Limiter** is a small package for [Cloudflare Workers](https://workers.cloudflare.com/) that enables you to Rate Limit API Requests right on the Edge. It doesn't use any 3rd-Party Database Solutions, instead it uses Durable Objects. It's also cheaper then the alternatives.

## Features

* Super lightweight (~1KB)
* No external Dependencies
* Uses only Cloudflare Products


## Install
```
npm install --save worker-rate-limiter
```

## Usage

Export the Object and **register** the Durable Object in your **wrangler.toml** and **bindings** (Don't forget the [migrations](https://developers.cloudflare.com/workers/learning/using-durable-objects/#durable-object-migrations-in-wranglertoml)!)
```
export { WorkerRateLimitDurableObject } from 'worker-rate-limiter';
```


Import RateLimter and initialize it with the Durable Object from above. Add the limit Function to different Routes, Groups, etc.
```
import { RateLimiter } from 'worker-rate-limit';

const rateLimiter = new RateLimiter(durable_object_instance);

const blocked = await rateLimiter.limit({
  do_name: ip,
  identifier: url,
  limit: 10,
  windowMs: 5000,
});
```

`rateLimiter.limit` **options**
- `do_name`: Uniquie Durable Object Name per User like (IP, User Id, API Key, etc.)
- `identifier`: The Route, Group, Key that will be limited
- `limit`: Amount of Requests allowed in the given Window
- `windowMs`: Time in ms till the window resets

## Todo
- Cache blocked Requests in the Worker
- Add Cron Trigger to clean the Storage
- Add multiple blocking Strategies
- Add an overall Limit
- Refactor / Optimize Code
- Add Benchmarks and Monitor Code
- Unit-Tests
- Make the Durable Object scaleable

## Price Calculation

Rate Limits with a time window smaller then 30s (30000ms) are much cheaper.

- 1 million Requests (Rate Limit < 30s) should cost around ~0.16$
- 1 million Requests (Rate Limit > 30s) should cost around ~1.25$

The Default Worker Price isn't included.

## Current Limitations
Arround ~100 Requests/s per unique do_name. Can be increased by creating multiple DO's for different Routes, but you shouldn't overdo it like every Route is an identifier. At some point it will have an negative affect.
