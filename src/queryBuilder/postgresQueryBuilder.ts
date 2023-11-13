// src/queryBuilder/postgresQueryBuilder.ts

import { QueryBuilder } from './queryBuilder';

type Operator = '$eq' | '$ne' | '$gt' | '$gte' | '$lt' | '$lte' | '$in' | '$nin';

interface BaseCondition {
    [key: string]: any;
}

interface ConditionOperator {
    [operator: string]: any;
}

interface ConditionOr extends BaseCondition {
    $or: Condition[];
}

interface ConditionAnd extends BaseCondition {
    $and: Condition[];
}

type Condition = BaseCondition | ConditionOr | ConditionAnd | ConditionOperator;


export class PostgresQueryBuilder extends QueryBuilder {
    private selectColumns: string[] = [];
    private fromTable: string = '';
    private whereConditions: string[] = [];
    private orderByColumns: string[] = [];
    private groupByColumns: string[] = [];
    private updateTable: string = '';
    private updateValues: { [key: string]: any } = {};
    private insertTable: string = '';
    private insertValues: { [key: string]: any }[] = [];
    private caseConditions: { when: string; then: string }[] = [];
    private deleteTable: string;
    private joinClauses: string[] = [];

    select(columns: string[] = []): PostgresQueryBuilder {
        this.selectColumns = columns.length > 0 ? columns : ['*'];
        return this;
    }

    from(table: string): PostgresQueryBuilder {
        this.fromTable = table;
        return this;
    }

    where(conditions: Condition[] | Condition): PostgresQueryBuilder {
        this.whereConditions = this.buildConditions(conditions);
        return this;
    }

    orderBy(columns: string[] = []): PostgresQueryBuilder {
        this.orderByColumns = columns;
        return this;
    }

    groupBy(columns: string[] = []): PostgresQueryBuilder {
        this.groupByColumns = columns;
        return this;
    }

    update(table: string): PostgresQueryBuilder {
        this.updateTable = table;
        return this;
    }

    set(columns: { [key: string]: any }): PostgresQueryBuilder {
        this.updateValues = { ...this.updateValues, ...columns };
        return this;
    }

    insertInto(table: string): PostgresQueryBuilder {
        this.insertTable = table;
        return this;
    }

    values(data: { [key: string]: any }): PostgresQueryBuilder {
        this.insertValues.push(data);
        return this;
    }

    case(conditions: { when: string; then: string }[]): PostgresQueryBuilder {
        this.caseConditions = conditions;
        return this;
    }

    deleteFrom(table: string): PostgresQueryBuilder {
        this.deleteTable = table;
        return this;
    }

    join(table: string, conditions: Condition[] | Condition): PostgresQueryBuilder {
        const joinClause = `JOIN ${table} ON ${this.buildSingleCondition(conditions)}`;
        this.joinClauses.push(joinClause);
        return this;
      }

    build(): string {
        if (this.selectColumns.length > 0 && this.fromTable !== '') {
            return this.buildSelectQuery();
        } else if (this.updateTable !== '' && Object.keys(this.updateValues).length > 0) {
            return this.buildUpdateQuery();
        } else if (this.insertTable !== '' && this.insertValues.length > 0) {
            return this.buildInsertQuery();
        } else if (this.deleteTable !== '') {
            return this.buildDeleteQuery();
        } else {
            throw new Error('Invalid query. Please specify a valid operation.');
        }
    }

    private buildCaseStatement(): string {
        if (this.caseConditions.length === 0) {
            return '';
        }

        const caseConditionsStr = this.caseConditions
            .map(condition => `WHEN ${condition.when} THEN ${condition.then}`)
            .join(' ');

        return `CASE ${caseConditionsStr} END`;
    }

    private buildSelectQuery(): string {
        const columnsStr = this.selectColumns.join(', ');
        const fromStr = `FROM ${this.fromTable}`;
        const joinStr = this.joinClauses.join(' ');
        const whereStr = this.whereConditions.length > 0 ? `WHERE ${this.whereConditions.join(' AND ')}` : '';
        const orderByStr = this.orderByColumns.length > 0 ? `ORDER BY ${this.orderByColumns.join(', ')}` : '';
        const groupByStr = this.groupByColumns.length > 0 ? `GROUP BY ${this.groupByColumns.join(', ')}` : '';
        const caseStr = this.buildCaseStatement();
    
        return `SELECT ${columnsStr} ${fromStr} ${joinStr} ${whereStr} ${orderByStr} ${groupByStr}`;
      }

    private buildUpdateQuery(): string {
        const setStr = Object.entries(this.updateValues).map(([key, value]) => `${key} = '${value}'`).join(', ');
        const whereStr = this.whereConditions.length > 0 ? `WHERE ${this.whereConditions.join(' AND ')}` : '';

        return `UPDATE ${this.updateTable} SET ${setStr} ${whereStr}`;
    }

    private buildInsertQuery(): string {
        const columns = Object.keys(this.insertValues[0]);
        const columnsStr = columns.join(', ');
        const valuesStr = this.insertValues
            .map(data => `(${Object.values(data).map(value => `'${value}'`).join(', ')})`)
            .join(', ');

        return `INSERT INTO ${this.insertTable} (${columnsStr}) VALUES ${valuesStr}`;
    }

    private buildDeleteQuery(): string {
        const whereStr = this.whereConditions.length > 0 ? `WHERE ${this.whereConditions.join(' AND ')}` : '';
        return `DELETE FROM ${this.deleteTable} ${whereStr}`;
    }

    private buildConditions(conditions: Condition[] | Condition): string[] {
        if (!Array.isArray(conditions)) {
            conditions = [conditions];
        }

        return conditions.map(condition => this.buildSingleCondition(condition));
    }

    private buildSingleCondition(condition: Condition): string {
        const entries = Object.entries(condition);
        return entries.map(([key, value]) => {
            if ('$or' in value) {
                return `(${this.buildConditions(value.$or).join(' OR ')})`;
            } else if ('$and' in value) {
                return `(${this.buildConditions(value.$and).join(' AND ')})`;
            } else if (typeof value === 'object' && !(value instanceof Array)) {
                const operator = Object.keys(value)[0] as Operator;
                const operand = value[operator];
                return `${key} ${this.operatorMap(operator)} '${operand}'`;
            } else {
                return `${key} = '${value}'`;
            }
        }).join(' AND ');
    }

    private operatorMap(operator: Operator): string {
        const operatorMap: { [key in Operator]: string } = {
            $eq: '=',
            $ne: '!=',
            $gt: '>',
            $gte: '>=',
            $lt: '<',
            $lte: '<=',
            $in: 'IN',
            $nin: 'NOT IN',
        };
        return operatorMap[operator];
    }
}
