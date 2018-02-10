import { ModelClass, RelationMappings } from "objection";

/**
 * Decorator to set the table name for the decorated class.
 */
export function table(tableName: string) {
    return (constructor: any) => {
        constructor.tableName = tableName;
    };
}

/**
 * Adds a new hasMany relationship to the decorated class.
 */
export function hasMany(name: string, clazz: () => ModelClass<any>, from: string, to: string) {
    return (constructor: any) => {
        if (!constructor.tableName) throw new Error("@table must be used before using @hasMany. Put @table directly above the class definition.");

        const mappings: RelationMappings = constructor.relationMappings || {};
        mappings[name] = {
            relation: require("objection").Model.HasManyRelation,
            modelClass: clazz(),
            join: {
                from: constructor.tableName + "." + from,
                to: clazz().tableName + "." + to
            }
        };
        constructor.relationMappings = mappings;
    };
}

/**
 * Adds a new belongsTo relationship to the decorated class.
 */
export function belongsTo(name: string, clazz: () => ModelClass<any>, from: string, to: string) {
    return (constructor: any) => {
        if (!constructor.tableName) throw new Error("@table must be used before using @hasMany. Put @table directly above the class definition.");

        const mappings: RelationMappings = constructor.relationMappings || {};
        mappings[name] = {
            relation: require("objection").Model.BelongsToOneRelation,
            modelClass: clazz(),
            join: {
                from: constructor.tableName + "." + from,
                to: clazz().tableName + "." + to
            }
        };
        constructor.relationMappings = mappings;
    };
}