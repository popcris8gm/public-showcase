import { Mongoose, Connection } from 'mongoose';
import { IDatastoreService, DatastoreType } from 'seed-of-mirror';
import { AbstractProvider, SandStormService } from 'sandstorm-trade';

import { ConnectionConfig } from '../model/connection-config.model';
import { DatastoreMap } from '../model/datastore-map.model';

import { AbstractDatastore } from '../datastore/abstract.datastore';

export class IceContainerService extends AbstractProvider implements IDatastoreService {
	private static instance: IceContainerService;

	private mongoose: Mongoose;
	private connection: Connection;
	private datastores: DatastoreMap = {};
	// TODO: set a type to resolvers
	private resolvers: Array<any> = new Array<any>();

	private mongooseList: Array<Mongoose>;
	private connectionList: Array<Connection>;
	private datastoreListMap: {
		[id: string]: DatastoreMap
	} = {};

	private constructor() {
		super();
	}

	private static createInstance(): void {
		if (!IceContainerService.instance) {
			const sandStormService: SandStormService = SandStormService.getInstance();
			const instance: IceContainerService = sandStormService.getProvider(IceContainerService) as IceContainerService;

			if (instance) {
				IceContainerService.instance = instance;
			} else {
				IceContainerService.instance = new IceContainerService();
				sandStormService.setProvider(IceContainerService.instance, DatastoreType.ICE_CONTAINER);
			}
		}
	}

	public static getInstance(): IceContainerService {
		this.createInstance();
		return this.instance;
	}

	public getConnection(): Connection {
		return this.connection;
	}

	public init(config: ConnectionConfig | Array<ConnectionConfig>): void {
		if (Array.isArray(config)) {
			this.mongooseList = new Array<Mongoose>();
			this.connectionList = new Array<Connection>();

			config.forEach((configuration: ConnectionConfig) => {
				const mongoose: Mongoose = new Mongoose();
				mongoose.pluralize(null);

				mongoose.createConnection(configuration.host, {
					useNewUrlParser: true,
					useUnifiedTopology: true,
					useFindAndModify: false,
					user: configuration.username,
					pass: configuration.password
				}).then((connection: Connection) => {
					this.connectionList.push(connection);

					this.initExtraDatastores(configuration.id, connection);
				});

				this.mongooseList.push(mongoose);
			});
		} else {
			this.mongoose = new Mongoose();
			this.mongoose.pluralize(null);

			this.mongoose.createConnection(config.host, {
				useNewUrlParser: true,
				useUnifiedTopology: true,
				useFindAndModify: false,
				user: config.username,
				pass: config.password
			}).then((connection: Connection) => {
				this.connection = connection;
				this.initDatastores();
			});
		}
	}

	public registerDatastore(datastore, id?: string): void {
		if (id) {
			const datastoreMap = this.datastoreListMap[id] = this.datastoreListMap[id] || {};

			if (datastoreMap[datastore.name]) {
				console.log(`Datastore ${datastore.name} already registered`);
			} else {
				const instance: AbstractDatastore<any> = new datastore();
				datastoreMap[datastore.name] = instance;

				// TODO
				// if (this.connection) {
				// 	this.initDatastore(datastore.name);
				// }
			}
		} else {
			if (this.datastores[datastore.name]) {
				console.log(`Datastore ${datastore.name} already registered`);
			} else {
				const instance: AbstractDatastore<any> = new datastore();
				this.datastores[datastore.name] = instance;

				if (this.connection) {
					this.initDatastore(datastore.name);
				}
			}
		}
	}

	public getDatastore(datastoreName: string): Promise<AbstractDatastore<any>> {
		if (this.datastores[datastoreName] && this.datastores[datastoreName].isInitialized) {
			return Promise.resolve(this.datastores[datastoreName]);
		} else {
			return new Promise((resolve) => {
				this.resolvers.push({
					resolve, datastoreName
				});
			});
		}
	}

	private initExtraDatastores(id: string, connection: Connection): void {
		const datastoreMap: DatastoreMap = this.datastoreListMap[id];

		if (datastoreMap) {
			const keys: Array<string> = Object.keys(datastoreMap);

			keys.forEach((key: string) => {
				const datastore: AbstractDatastore<any> = datastoreMap[key];
				this.initExtraDatastore(datastore, connection);
			});

			this.resolvers.forEach((value) => {
				for (let i = 0; i < keys.length; i++) {
					if (value.datastoreName === keys[i]) {
						value.resolve(datastoreMap[keys[i]]);
						break;
					}
				}
			});
		}
	}

	private initDatastores(): void {
		const keys: Array<string> = Object.keys(this.datastores);

		keys.forEach((key: string) => {
			this.initDatastore(key);
		});

		this.resolvers.forEach((value) => {
			value.resolve(this.datastores[value.datastoreName]);
		});
	}

	private initExtraDatastore(datastore: AbstractDatastore<any>, connection: Connection): void {
		datastore.init(connection);
	}

	private initDatastore(key: string,): void {
		(this.datastores[key] as AbstractDatastore<any>).init(this.connection);
	}
}