interface Options {
  do_name: string; // Unique Durable Object Name per User like (IP, User ID, API Key, etc.)
  identifier: string; // Name for the Path or Group to be limited
  limit: number; // Amount of Requests allowed in a given Window
  windowMs: number; // Time in ms till the window resets
}

interface RateLimited {
  blocked: boolean;
  expires: number;
}

export class RateLimiter {
  constructor(private readonly durableObject: DurableObjectNamespace) {}

  // Returns true if the Request should be blocked
  async limit(options: Options): Promise<boolean> {
    /* Cache Stuff
    const cache = await caches.default;
    const currentTime = Date.now();
    const cacheableRequest = new Request(url);
    */

    const id = this.durableObject.idFromName(options.do_name);
    const stub = this.durableObject.get(id);
    const url = 'http://' + options.identifier;
    const request = new Request(url, {
      method: 'POST',
      body: JSON.stringify({
        limit: options.limit,
        windowMs: options.windowMs,
      }),
    });

    /* TODO: Read From Cache
    const cachedResponse = await cache.match(cacheableRequest);
    if (cachedResponse != undefined) {
      let rateLimited = await this.parseResponse(cachedResponse);
      if (rateLimited.expires < currentTime) {
        // Expired
        await cache.delete(request);
      } else {
        // Cached
        return true;
      }
    }
    */

    const response = await stub.fetch(request);
    const rateLimited = await this.parseResponse(response);

    /* TODO: Write to Cache
    if (rateLimited.blocked) {
      await cache.put(
        cacheableRequest,
        new Response(JSON.stringify(rateLimited))
      );
    }
    */
    return rateLimited.blocked;
  }

  private async parseResponse(response: Response): Promise<RateLimited> {
    return JSON.parse(await response.text());
  }
}
