interface LimitObject {
  invocations: number;
  expires: number;
}

export class WorkerRateLimitDurableObject implements DurableObject {
  private STORAGE_THRESHOLD = 30 * 1000;
  private shortLimitMap = new Map<string, LimitObject>();
  private longLimitMap = new Map<string, LimitObject>();
  private longLimitMapInitialized = false;

  constructor(private readonly state: DurableObjectState) {}

  async fetch(request: Request): Promise<Response> {
    let currentTime = Date.now();
    let url = request.url.slice(7);
    let data = JSON.parse(await request.text());
    let limit: number = data['limit'];
    let windowMs: number = data['windowMs'];

    let map;
    let save = false;

    if (windowMs > this.STORAGE_THRESHOLD) {
      if (!this.longLimitMapInitialized) {
        await this.loadLongLimitMap();
      }
      map = this.longLimitMap;
      save = true;
    } else {
      map = this.shortLimitMap;
    }

    let limitObject = map.get(url);

    if (limitObject == undefined || limitObject.expires < currentTime) {
      map.set(url, {
        invocations: 1,
        expires: currentTime + windowMs,
      });
      if (save) this.saveLongLimitMap();
      return new Response(JSON.stringify({ blocked: false }));
    }

    if (limitObject.invocations < limit) {
      limitObject.invocations++;
      if (save) this.saveLongLimitMap();
      return new Response(JSON.stringify({ blocked: false }));
    }

    return new Response(
      JSON.stringify({ blocked: true, expires: limitObject.expires })
    );
  }

  async saveLongLimitMap() {
    await this.state.storage.put(
      'longLimitMap',
      JSON.stringify(Array.from(this.longLimitMap.entries()))
    );
    console.log('Saved');
  }

  async loadLongLimitMap() {
    let data = <string>await this.state.storage.get('longLimitMap');
    if (data != undefined) {
      this.longLimitMap = new Map(JSON.parse(data));
    }

    this.longLimitMapInitialized = true;
  }
}
