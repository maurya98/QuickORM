import { DatabaseConnector } from './databaseConnector';
import { PostgresConnector } from './postgresConnector';
import { MySQLConnector } from './mysqlConnector';
import { CassandraConnector } from './cassandraConnector';
import { MongoDBConnector } from './mongoDBConnector';

export class DatabaseFactory {
  static createConnector(type: string, connectionOptions: any): DatabaseConnector {
    switch (type.toLowerCase()) {
      case 'postgres':
        return new PostgresConnector(connectionOptions);
      case 'mysql':
        return new MySQLConnector(connectionOptions);
      case 'cassandra':
        return new CassandraConnector(connectionOptions);
      case 'mongodb':
        return new MongoDBConnector(connectionOptions);
      default:
        throw new Error(`Unsupported database type: ${type}`);
    }
  }
}
