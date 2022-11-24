import { AxiosHttpRequest } from './core/AxiosHttpRequest';
import { DefaultService } from './services/DefaultService';
export class NodeCheckerClient {
    default;
    request;
    constructor(config, HttpRequest = AxiosHttpRequest) {
        this.request = new HttpRequest({
            BASE: config?.BASE ?? 'http://0.0.0.0:20121',
            VERSION: config?.VERSION ?? '0.1.1',
            WITH_CREDENTIALS: config?.WITH_CREDENTIALS ?? false,
            CREDENTIALS: config?.CREDENTIALS ?? 'include',
            TOKEN: config?.TOKEN,
            USERNAME: config?.USERNAME,
            PASSWORD: config?.PASSWORD,
            HEADERS: config?.HEADERS,
            ENCODE_PATH: config?.ENCODE_PATH,
        });
        this.default = new DefaultService(this.request);
    }
}
