// import { IDatastore } from 'seed-of-mirror';
import { Connection, Schema, Model, Query } from 'mongoose';

import { MiddlewareDatastore } from './middleware.datastore';

// import { IDatastore, ICondition, IProjection, IOption, ISortOption, IPopulate, IConditionProjection,
// 	IConditionOption, IOptionProjection, IProjectionPopulate, IOptionPopulate, IConditionPopulate, ISortOptionProjection, ISortOptionPopulate,
// 	IConditionOptionProjection, IOptionProjectionPopulate, IConditionProjectionPopulate,
// 	IConditionOptionPopulate, ISortOptionProjectionPopulate, IConditionOptionProjectionPopulate } from '../../../../Sylvana/seed-of-mirror/index';	

import { IDatastore, ICondition, IProjection, IOption, ISortOption, IPopulate, IConditionProjection,
	IConditionOption, IOptionProjection, IProjectionPopulate, IOptionPopulate, IConditionPopulate, ISortOptionProjection, ISortOptionPopulate,
	IConditionOptionProjection, IOptionProjectionPopulate, IConditionProjectionPopulate,
	IConditionOptionPopulate, ISortOptionProjectionPopulate, IConditionOptionProjectionPopulate } from 'seed-of-mirror';

export abstract class AbstractDatastore<T> extends MiddlewareDatastore<T> implements IDatastore<T> {
	private extension: string;

	protected connection: Connection;
	protected name: string;
	protected schema: Schema;
	protected model: Model<any>;

	constructor(name: string, schema: Schema, extension: string = null) {
		super();
		this.name = name;
		this.schema = schema;
		this.extension = extension;
	}

	public get isInitialized(): boolean {
		return this.connection !== undefined;
	}

	public init(connection: Connection) {
		this.connection = connection;

		if (this.extension) {
			this.model = connection.models[this.extension].discriminator(this.name, this.schema);
		} else {
			this.model = connection.model(this.name, this.schema);
		}
	}

	protected observe(callback: Query<any, any> | Promise<T | Array<T>>): Promise<T & Array<T> & number> {
		const promise: Promise<T & Array<T> & number> = callback instanceof Promise ? callback : callback.exec();

		return promise;
	}

	private observeGet(query: Query<any, any>, newOptions?): Promise<T & Array<T>> {
		return new Promise((resolve, reject) => {
			query.then((model: T & Array<T>) => {
				if (this.runPostCheckMiddleware(model, newOptions)) {
					resolve(model);
				} else {
					resolve(null);
				}
			});
		});
	}

	/**
	 * Get all the Models of type T from the database.
	 */
	public getAll(option?: ICondition | IProjection | IOption | IPopulate |
		IConditionProjection | IConditionOption | IOptionProjection | IProjectionPopulate |
		IOptionPopulate | IConditionPopulate | IConditionOptionProjection |
		IOptionProjectionPopulate | IConditionProjectionPopulate | IConditionOptionPopulate |
		IConditionOptionProjectionPopulate): Promise<Array<T>> {

		if (option) {
			if ((option as ICondition).conditions) {
				if ((option as IConditionOption).options) {
					if ((option as IConditionOptionProjection).select) {
						if ((option as IConditionOptionProjectionPopulate).populate) {
							return this.getAllConditionOptionProjectPopulate(option as IConditionOptionProjectionPopulate);
						}

						return this.getAllConditionOptionProject(option as IConditionOptionProjection);
					}

					if ((option as IConditionOptionPopulate).populate) {
						return this.getAllConditionOptionPopulate(option as IConditionOptionPopulate);
					}

					return this.getAllConditionOption(option as IConditionOption);
				}

				if ((option as IConditionProjection).select) {
					if ((option as IConditionProjectionPopulate).populate) {
						return this.getAllConditionProjectPopulate(option as IConditionProjectionPopulate);
					}

					return this.getAllConditionProject(option as IConditionProjection);
				}

				if ((option as IConditionPopulate).populate) {
					return this.getAllConditionPopulate(option as IConditionPopulate);
				}

				return this.getAllCondition(option as ICondition);
			}

			if ((option as IOption).options) {
				if ((option as IOptionProjection).select) {
					if ((option as IOptionProjectionPopulate).populate) {
						return this.getAllOptionProjectPopulate(option as IOptionProjectionPopulate);
					}

					return this.getAllOptionProject(option as IOptionProjection);
				}

				if ((option as IOptionPopulate).populate) {
					return this.getAllOptionPopulate(option as IOptionPopulate);
				}

				return this.getAllOption(option as IOption);
			}

			if ((option as IProjection).select) {
				if ((option as IProjectionPopulate).populate) {
					return this.getAllProjectPopulate(option as IProjectionPopulate);
				}

				return this.getAllProject(option as IProjection);
			}

			if ((option as IPopulate).populate) {
				return this.getAllPopulate(option as IPopulate);
			}
		} else {
			return this.getAllSimple();
		}
	}

	/**
	 * Get all the Models of type T from the datastore.
	 */
	private getAllSimple(): Promise<Array<T>> {
		const query: Query<any, any> = this.model.find();

		return this.observeGet(query);
	}

	/**
	 * Get all the Models of type T from the datastore that respect the provided conditions.
	 */
	private getAllCondition(condition: ICondition): Promise<Array<T>> {
		const query: Query<any, any> = this.model.find(condition.conditions);

		return this.observeGet(query);
	}

	/**
	 * Get all the Models of type T from the datastore including or excluding the provided
	 * list of attributes.
	 */
	private getAllProject(projection: IProjection): Promise<Array<T>> {
		const query: Query<any, any> = this.model.find().select(projection.select);

		return this.observeGet(query);
	}

	/**
	 * Get all the Models of type T from the datastore from a specific index, limited to a
	 * number of entries and sorted in one or multiple directions.
	 */
	private getAllOption(section: IOption): Promise<Array<T>> {
		const query: Query<any, any> = this.model.find();

		section.options.limit && query.limit(section.options.limit);
		section.options.skip && query.skip(section.options.skip);
		section.options.sort && query.sort(section.options.sort);

		return this.observeGet(query);
	}

	/**
	 * Get all the Models of type T from the datastore and populate the provided fields from
	 * their respective tables.
	 */
	private getAllPopulate(populate: IPopulate): Promise<Array<T>> {
		const query: Query<any, any> = this.model.find().populate({
			path: populate.populate.fields,
			select: populate.populate.select,
			options: populate.populate.options
		});

		return this.observeGet(query);
	}

	/**
	 * Get all the Models of type T from the datastore that respect the provided conditions
	 * and including or excluding the provided list of attributes.
	 */
	private getAllConditionProject(conditionProjection: IConditionProjection): Promise<Array<T>> {
		const query: Query<any, any> = this.model.find(conditionProjection.conditions, conditionProjection.select);

		return this.observeGet(query);
	}

	/**
	 * Get all the Models of type T from the datastore that respect the provided conditions
	 * and from a specific index, limited to a number of entries and sorted in one or multiple
	 * directions.
	 */
	private getAllConditionOption(conditionOption: IConditionOption): Promise<Array<T>> {
		const query: Query<any, any> = this.model.find(conditionOption.conditions);

		conditionOption.options.limit && query.limit(conditionOption.options.limit);
		conditionOption.options.skip && query.skip(conditionOption.options.skip);
		conditionOption.options.sort && query.sort(conditionOption.options.sort);

		return this.observeGet(query);
	}

	/**
	 * Get all the Models of type T from the datastore including or excluding the provided
	 * list of attributes and from a specific index, limited to a number of entries and
	 * sorted in one or multiple directions.
	 */
	private getAllOptionProject(optionProjection: IOptionProjection): Promise<Array<T>> {
		const query: Query<any, any> = this.model.find(null, optionProjection.select);

		optionProjection.options.limit && query.limit(optionProjection.options.limit);
		optionProjection.options.skip && query.skip(optionProjection.options.skip);
		optionProjection.options.sort && query.sort(optionProjection.options.sort);

		return this.observeGet(query);
	}

	/**
	 * Get all the Models of type T from the datastore that respect the provided conditions
	 * and populate the provided fields from their respective tables.
	 */
	private getAllConditionPopulate(conditionPopulate: IConditionPopulate): Promise<Array<T>> {
		const query: Query<any, any> = this.model.find(conditionPopulate.conditions).populate({
			path: conditionPopulate.populate.fields,
			select: conditionPopulate.populate.select,
			options: conditionPopulate.populate.options
		});

		return this.observeGet(query);
	}

	/**
	 * Get all the Models of type T from the datastore including or excluding the provided
	 * list of attributes and from a specific index, and populate the provided fields from their
	 * respective tables.
	 */
	private getAllProjectPopulate(projectionPopulate: IProjectionPopulate): Promise<Array<T>> {
		const query: Query<any, any> = this.model.find().select(projectionPopulate.select).populate({
			path: projectionPopulate.populate.fields,
			select: projectionPopulate.populate.select,
			options: projectionPopulate.populate.options
		});

		return this.observeGet(query);
	}

	/**
	 * Get all the Models of type T from the datastore from a specific index, limited to a number of 
	 * entries and sorted in one or multiple directions, and populate the provided fields from their
	 * respective tables.
	 */
	private getAllOptionPopulate(optionPopulate: IOptionPopulate): Promise<Array<T>> {
		const query: Query<any, any> = this.model.find().populate({
			path: optionPopulate.populate.fields,
			select: optionPopulate.populate.select,
			options: optionPopulate.populate.options
		});

		optionPopulate.options.limit && query.limit(optionPopulate.options.limit);
		optionPopulate.options.skip && query.skip(optionPopulate.options.skip);
		optionPopulate.options.sort && query.sort(optionPopulate.options.sort);

		return this.observeGet(query);
	}
	
	/**
	 * Get all the Models of type T from the datastore that respect the provided conditions,
	 * from a specific index, limited to a number of entries and sorted in one or multiple directions,
	 * and including or excluding the provided list of attributes.
	 */
	private getAllConditionOptionProject(conditionOptionProject: IConditionOptionProjection): Promise<Array<T>> {
		const query: Query<any, any> = this.model.find(conditionOptionProject.conditions, conditionOptionProject.select);

		conditionOptionProject.options.limit && query.limit(conditionOptionProject.options.limit);
		conditionOptionProject.options.skip && query.skip(conditionOptionProject.options.skip);
		conditionOptionProject.options.sort && query.sort(conditionOptionProject.options.sort);

		return this.observeGet(query);
	}

	private getAllOptionProjectPopulate(optionProjectionPopulate: IOptionProjectionPopulate): Promise<Array<T>> {
		const query: Query<any, any> = this.model.find().select(optionProjectionPopulate.select).populate({
			path: optionProjectionPopulate.populate.fields,
			select: optionProjectionPopulate.populate.select,
			options: optionProjectionPopulate.populate.options
		});

		optionProjectionPopulate.options.limit && query.limit(optionProjectionPopulate.options.limit);
		optionProjectionPopulate.options.skip && query.skip(optionProjectionPopulate.options.skip);
		optionProjectionPopulate.options.sort && query.sort(optionProjectionPopulate.options.sort);

		return this.observeGet(query);
	}

	private getAllConditionProjectPopulate(conditionProjectionPopulate: IConditionProjectionPopulate): Promise<Array<T>> {
		const query: Query<any, any> = this.model.find(conditionProjectionPopulate.conditions,
			conditionProjectionPopulate.select).populate({
				path: conditionProjectionPopulate.populate.fields,
				select: conditionProjectionPopulate.populate.select,
				options: conditionProjectionPopulate.populate.options
			});

		return this.observeGet(query);
	}

	private getAllConditionOptionPopulate(condtionOptionPopulate: IConditionOptionPopulate): Promise<Array<T>> {
		const query: Query<any, any> = this.model.find(condtionOptionPopulate.conditions)
			.populate({
				path: condtionOptionPopulate.populate.fields,
				select: condtionOptionPopulate.populate.select,
				options: condtionOptionPopulate.populate.options
			});

		condtionOptionPopulate.options.limit && query.limit(condtionOptionPopulate.options.limit);
		condtionOptionPopulate.options.skip && query.skip(condtionOptionPopulate.options.skip);
		condtionOptionPopulate.options.sort && query.sort(condtionOptionPopulate.options.sort);

		return this.observeGet(query);
	}

	private getAllConditionOptionProjectPopulate(conditionOptionProjectPopulate: IConditionOptionProjectionPopulate): Promise<Array<T>> {
		const query: Query<any, any> = this.model.find(conditionOptionProjectPopulate.conditions,
			conditionOptionProjectPopulate.select).populate({
				path: conditionOptionProjectPopulate.populate.fields,
				select: conditionOptionProjectPopulate.populate.select,
				options: conditionOptionProjectPopulate.populate.options
			});

		conditionOptionProjectPopulate.options.limit && query.limit(conditionOptionProjectPopulate.options.limit);
		conditionOptionProjectPopulate.options.skip && query.skip(conditionOptionProjectPopulate.options.skip);
		conditionOptionProjectPopulate.options.sort && query.sort(conditionOptionProjectPopulate.options.sort);

		return this.observeGet(query);
	}

	/**
	 * Get a Model of type T by it's id.
	 */
	public getById(id: string | T, option?: IProjection | ISortOption | IPopulate | ISortOptionProjection | IProjectionPopulate | ISortOptionPopulate | ISortOptionProjectionPopulate): Promise<T> {
		if (option) {
			if ((option as ISortOption).options) {
				if ((option as ISortOptionProjection).select) {
					if ((option as ISortOptionProjectionPopulate).populate) {
						return this.getByIdOptionProjectionPopulate(id, option as ISortOptionProjectionPopulate);
					}

					return this.getByIdOptionProject(id, option as ISortOptionProjection);
				}

				if ((option as ISortOptionPopulate).populate) {
					return this.getByIdOptionPopulate(id, option as ISortOptionPopulate);
				}

				return this.getByIdOption(id, option as ISortOption);
			}

			if ((option as IProjection).select) {
				if ((option as IProjectionPopulate).populate) {
					return this.getByIdProjectPopulate(id, option as IProjectionPopulate);
				}

				return this.getByIdProject(id, option as IProjection);
			}

			if ((option as IPopulate).populate) {
				return this.getByIdPopulate(id, option as IPopulate);
			}
		}

		return this.getByIdSimple(id);
	}

	private getByIdSimple(id: string | T): Promise<T> {
		const query: Query<any, any> = this.model.findById(id);

		return this.observe(query);
	}

	private getByIdOption(id: string | T, option: ISortOption): Promise<T> {
		const query: Query<any, any> = this.model.findById(id);

		option.options.sort && query.sort(option.options.sort);

		return this.observe(query);
	}

	private getByIdProject(id: string | T, projection: IProjection): Promise<T> {
		const query: Query<any, any> = this.model.findById(id).select(projection.select);

		return this.observe(query);
	}

	private getByIdPopulate(id: string | T, populate: IPopulate): Promise<T> {
		const query: Query<any, any> = this.model.findById(id).populate({
			path: populate.populate.fields,
			select: populate.populate.select,
			options: populate.populate.options
		});

		return this.observe(query);
	}

	private getByIdOptionProject(id: string | T, optionProjection: ISortOptionProjection): Promise<T> {
		const query: Query<any, any> = this.model.findById(id).select(optionProjection.select);

		optionProjection.options.sort && query.sort(optionProjection.options.sort);

		return this.observe(query);
	}

	private getByIdProjectPopulate(id: string | T, projectionPopulate: IProjectionPopulate): Promise<T> {
		const query: Query<any, any> = this.model.findById(id).select(projectionPopulate.select)
			.populate({
				path: projectionPopulate.populate.fields,
				select: projectionPopulate.populate.select,
				options: projectionPopulate.populate.options
			});

		return this.observe(query);
	}

	private getByIdOptionPopulate(id: string | T, optionPopulate: ISortOptionPopulate): Promise<T> {
		const query: Query<any, any> = this.model.findById(id)
			.populate({
				path: optionPopulate.populate.fields,
				select: optionPopulate.populate.select,
				options: optionPopulate.populate.options
			});

		optionPopulate.options.sort && query.sort(optionPopulate.options.sort);

		return this.observe(query);
	}

	private getByIdOptionProjectionPopulate(id: string | T, optionProjectionPopulate: ISortOptionProjectionPopulate): Promise<T> {
		const query: Query<any, any> = this.model.findById(id).select(optionProjectionPopulate.select)
			.populate({
				path: optionProjectionPopulate.populate.fields,
				select: optionProjectionPopulate.populate.select,
				options: optionProjectionPopulate.populate.options
			});

		optionProjectionPopulate.options.sort && query.sort(optionProjectionPopulate.options.sort);

		return this.observe(query);
	}


	public getOne(options: any): Promise<T> {
		const newOptions = this.runPreCheckMiddleware(options);
		const query: Query<any, any> = this.model.findOne(options);

		this.model.findOne()

		return this.observeGet(query, newOptions);
	}

	public getOneByOptions(options): Promise<T> {
		const newOptions = this.runPreCheckMiddleware(options);
		const query: Query<any, any> = this.model.findOne(options);

		return this.observeGet(query, newOptions);
	}

	public getOneByOptionsAndUpdate(options, update): Promise<T> {
		this.runCreateMiddlewares(update);
		const query: Query<any, any> = this.model.findOneAndUpdate(options, update, { new: true });

		return this.observe(query);
	}

	public getManyByOptions(condition: any, options?: any): Promise<Array<T>> {
		const query: Query<any, any> = this.model.find(condition, null, options);

		return this.observe(query);
	}

	public getPaginated(skip: number, limit: number, sort = {}): Promise<Array<T>> {
		const query: Query<any, any> = this.model.find().skip(skip).limit(limit).sort(sort);

		return this.observe(query);
	}

	/**
	 * Create a Model of type T and return it.
	 */
	public create(model: T): Promise<T> {
		this.runCreateMiddlewares(model);
		const query: Promise<T> = this.model.create(model);

		return this.observe(query);
	}

	public removeById(id: string) {
		const query: Query<any, any> = this.model.findByIdAndDelete(id);

		return this.observe(query);
	}

	public removeAll() {
		const query: Query<any, any> = this.model.remove({});

		return this.observe(query);
	}

	public count(condition: {} = {}): Promise<number> {
		const query: Query<any, any> = this.model.countDocuments(condition);

		return this.observe(query);
	}

	public getByOptionsPopulated(condition: {} = {}, options: {} = {}, populators: Array<string>): Promise<Array<T>> {
		const query: Query<any, any> = this.model.find(condition, null, options).populate(populators.join(' '));

		return this.observe(query);
	}
}