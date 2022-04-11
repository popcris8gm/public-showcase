import { Schema } from "mongoose";
import { DynamicDatastore } from "../datastore/dynamic.datastore";
import { IceContainerService } from "./ice-container.service";

export class DatastoreFactoryService {
    private static instance: DatastoreFactoryService = new DatastoreFactoryService();

    private map = {};

    private constructor() {}

    public getDatastore(name: string, schema: Schema): DynamicDatastore {
        if (this.map[name]) {
            return this.map[name];
        } else {
            const instance: DynamicDatastore = new DynamicDatastore(name, schema);
            this.map[name] = instance;

            instance.init(IceContainerService.getInstance().getConnection());

            return instance;
        }
    }

    public static getInstance(): DatastoreFactoryService {
        return this.instance;
    }
}