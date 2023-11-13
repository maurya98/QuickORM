// src/queryBuilder/queryBuilder.ts

export abstract class QueryBuilder {
    abstract select(columns: string[]): any;
    abstract from(table: string): any;
    abstract where(conditions: { [key: string]: any }): any;
    abstract orderBy(columns: string[]): any;
    abstract groupBy(columns: string[]): any;
    abstract update(table: string): any;
    abstract set(values: { [key: string]: any }): any;
    abstract insertInto(table: string): any;
    abstract values(data: { [key: string]: any }): any;
    abstract deleteFrom(table: string): any;
    abstract join(table: string, conditions: { [key: string]: any }): any;
    abstract build(): string;
}
