import { AxiosHttpRequest } from './core/AxiosHttpRequest';
import { AccountsService } from './services/AccountsService';
import { BlocksService } from './services/BlocksService';
import { EventsService } from './services/EventsService';
import { GeneralService } from './services/GeneralService';
import { TablesService } from './services/TablesService';
import { TransactionsService } from './services/TransactionsService';
export class AptosGeneratedClient {
    accounts;
    blocks;
    events;
    general;
    tables;
    transactions;
    request;
    constructor(config, HttpRequest = AxiosHttpRequest) {
        this.request = new HttpRequest({
            BASE: config?.BASE ?? '/v1',
            VERSION: config?.VERSION ?? '1.2.0',
            WITH_CREDENTIALS: config?.WITH_CREDENTIALS ?? false,
            CREDENTIALS: config?.CREDENTIALS ?? 'include',
            TOKEN: config?.TOKEN,
            USERNAME: config?.USERNAME,
            PASSWORD: config?.PASSWORD,
            HEADERS: config?.HEADERS,
            ENCODE_PATH: config?.ENCODE_PATH,
        });
        this.accounts = new AccountsService(this.request);
        this.blocks = new BlocksService(this.request);
        this.events = new EventsService(this.request);
        this.general = new GeneralService(this.request);
        this.tables = new TablesService(this.request);
        this.transactions = new TransactionsService(this.request);
    }
}
