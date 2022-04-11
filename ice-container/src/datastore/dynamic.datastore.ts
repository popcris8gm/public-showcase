import { Schema } from "mongoose";
import { AbstractDatastore } from "./abstract.datastore";

export class DynamicDatastore extends AbstractDatastore<any> {

    constructor(name: string, schema: Schema, extension: string = null) {
        super(name, schema, extension);
    }
}