import { AbstractDatastore } from '../datastore/abstract.datastore';

export interface DatastoreMap {
    [key: string]: AbstractDatastore<any>
}